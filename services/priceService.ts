/**
 * Price Service - 股价获取服务
 * 支持多种数据源：
 * 1. Cloudflare Worker 代理 (推荐用于生产环境)
 * 2. 直接 Gemini API (仅限本地开发)
 * 3. 免费备用 API (Yahoo Finance 等)
 */

import { Asset, GroundingSource } from '../types';

export interface PriceResult {
    prices: Record<string, number>;
    exchangeRate: number | null;
    sources: GroundingSource[];
    fromCache?: boolean;
}

// 价格缓存（避免频繁请求）
const PRICE_CACHE_KEY = 'WF_PRICE_CACHE';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5分钟缓存

interface PriceCache {
    data: PriceResult;
    timestamp: number;
}

// 获取缓存
const getCache = (): PriceCache | null => {
    try {
        const cached = localStorage.getItem(PRICE_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as PriceCache;
            if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
                return parsed;
            }
        }
    } catch {
        // 忽略缓存错误
    }
    return null;
};

// 设置缓存
const setCache = (data: PriceResult): void => {
    try {
        const cache: PriceCache = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // 忽略缓存错误
    }
};

// 获取 Worker URL 配置
const getWorkerUrl = (): string | null => {
    return localStorage.getItem('WF_WORKER_URL');
};

// 保存 Worker URL
export const saveWorkerUrl = (url: string): void => {
    localStorage.setItem('WF_WORKER_URL', url);
};

/**
 * 通过 Cloudflare Worker 获取价格（推荐用于生产环境）
 * Worker 会安全地调用 Gemini API
 */
export const fetchPricesViaWorker = async (assets: Asset[], apiKey?: string): Promise<PriceResult> => {
    const workerUrl = getWorkerUrl();

    if (!workerUrl) {
        throw new Error('Worker URL not configured. Please set it in settings.');
    }

    // 过滤掉不需要获取价格的资产（现金类）
    const assetsToFetch = assets.filter(a =>
        !['Cash (Saving)', 'Cash (Investment)', 'Pension'].includes(a.category) ||
        (a.category === 'Pension' && a.symbol !== 'EPF')
    );

    const assetList = assetsToFetch.map(a => ({
        symbol: a.symbol,
        category: a.category,
        currency: a.currency,
    }));

    const response = await fetch(`${workerUrl}/api/prices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assets: assetList,
            apiKey: apiKey // 传递用户自备的 API Key
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Worker error: ${errorText}`);
    }

    const result = await response.json() as PriceResult;
    setCache(result);
    return result;
};

/**
 * 通过免费 API 获取主要股票价格（备用方案）
 * 使用 Yahoo Finance 的公开端点
 */
export const fetchPricesViaFreeAPI = async (assets: Asset[]): Promise<PriceResult> => {
    const prices: Record<string, number> = {};
    const sources: GroundingSource[] = [];
    let exchangeRate: number | null = null;

    // 获取汇率 (使用免费 API)
    try {
        const fxResponse = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD'
        );
        if (fxResponse.ok) {
            const fxData = await fxResponse.json();
            exchangeRate = fxData.rates?.MYR || null;
            if (exchangeRate) {
                sources.push({
                    title: 'ExchangeRate-API',
                    uri: 'https://www.exchangerate-api.com/',
                });
            }
        }
    } catch (error) {
        console.warn('Failed to fetch exchange rate:', error);
    }

    // 过滤需要获取价格的资产
    const assetsToFetch = assets.filter(a =>
        ['ETF', 'Stock', 'Crypto'].includes(a.category)
    );

    // 批量获取股票价格 (通过 CORS 代理)
    for (const asset of assetsToFetch) {
        try {
            let symbol = asset.symbol;

            // 常用马股代码映射 (Name -> Code)
            const MY_STOCK_MAP: Record<string, string> = {
                'MAYBANK': '1155',
                'PBBANK': '1295',
                'CIMB': '1023',
                'TENAGA': '5347',
                'IHH': '5225',
                'PCHEM': '5183',
                'DIGI': '6947',
                'AXIATA': '6888',
                'GENTING': '3182',
                'IOICORP': '1961'
            };

            // Yahoo Finance 符号转换
            if (asset.currency === 'MYR' && asset.category === 'Stock') {
                let s = asset.symbol.toUpperCase().replace('.KL', ''); // 移除后缀进行查找
                if (MY_STOCK_MAP[s]) {
                    symbol = MY_STOCK_MAP[s]; // 替换为数字代码
                }

                // 如果用户没有输入 .KL 后缀，自动添加
                if (!symbol.toUpperCase().endsWith('.KL')) {
                    symbol = `${symbol}.KL`;
                }
            }

            // 使用 corsproxy.io 作为主要是 CORS 代理 (更稳定)
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`;

            const response = await fetch(proxyUrl);

            if (response.ok) {
                const data = await response.json();
                const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

                if (price && typeof price === 'number') {
                    prices[asset.symbol] = price;
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch price for ${asset.symbol}:`, error);
        }
    }

    // 加密货币价格 (使用 CoinGecko 免费 API)
    const cryptoAssets = assets.filter(a => a.category === 'Crypto');
    if (cryptoAssets.length > 0) {
        try {
            const cryptoIds: Record<string, string> = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum',
                'SOL': 'solana',
                'BNB': 'binancecoin',
                'XRP': 'ripple',
                'ADA': 'cardano',
                'DOGE': 'dogecoin',
            };

            const ids = cryptoAssets
                .map(a => cryptoIds[a.symbol])
                .filter(Boolean)
                .join(',');

            if (ids) {
                const cgResponse = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
                );

                if (cgResponse.ok) {
                    const cgData = await cgResponse.json();

                    for (const asset of cryptoAssets) {
                        const id = cryptoIds[asset.symbol];
                        if (id && cgData[id]?.usd) {
                            prices[asset.symbol] = cgData[id].usd;
                        }
                    }

                    sources.push({
                        title: 'CoinGecko',
                        uri: 'https://www.coingecko.com/',
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to fetch crypto prices:', error);
        }
    }

    if (Object.keys(prices).length > 0) {
        sources.push({
            title: 'Yahoo Finance',
            uri: 'https://finance.yahoo.com/',
        });
    }

    const result: PriceResult = { prices, exchangeRate, sources };
    setCache(result);
    return result;
};

/**
 * 智能获取价格 - 自动选择最佳数据源
 */
/**
 * 智能获取价格 - 自动选择最佳数据源
 */
export const fetchPrices = async (
    assets: Asset[],
    options?: { forceRefresh?: boolean; preferWorker?: boolean; apiKey?: string }
): Promise<PriceResult> => {
    const { forceRefresh = false, preferWorker = true, apiKey } = options || {};

    // 检查缓存
    if (!forceRefresh) {
        const cached = getCache();
        if (cached) {
            return { ...cached.data, fromCache: true };
        }
    }

    const workerUrl = getWorkerUrl();

    // 优先使用 Worker（如果配置了）
    if (preferWorker && workerUrl) {
        try {
            return await fetchPricesViaWorker(assets, apiKey);
        } catch (error) {
            console.warn('Worker fetch failed, falling back to free API:', error);
        }
    }

    // 回退到免费 API
    return await fetchPricesViaFreeAPI(assets);
};

/**
 * 检查价格服务状态
 */
export const checkPriceServiceStatus = async (): Promise<{
    workerAvailable: boolean;
    freeApiAvailable: boolean;
}> => {
    let workerAvailable = false;
    let freeApiAvailable = false;

    const workerUrl = getWorkerUrl();

    if (workerUrl) {
        try {
            const response = await fetch(`${workerUrl}/api/health`, {
                method: 'GET',
            });
            workerAvailable = response.ok;
        } catch {
            workerAvailable = false;
        }
    }

    // 测试免费 API
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        freeApiAvailable = response.ok;
    } catch {
        freeApiAvailable = false;
    }

    return { workerAvailable, freeApiAvailable };
};
