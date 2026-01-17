/**
 * WealthFlow Tracker - Cloudflare Worker
 * 
 * 这个 Worker 作为 API 代理，安全地调用 Gemini API 获取实时股价
 * 部署后，前端可以通过这个 Worker 获取价格数据，而不暴露 API Key
 * 
 * 部署步骤：
 * 1. 安装 Wrangler CLI: npm install -g wrangler
 * 2. 登录: wrangler login
 * 3. 设置密钥: wrangler secret put GEMINI_API_KEY
 * 4. 部署: wrangler deploy
 */

export interface Env {
    GEMINI_API_KEY: string;
}

// CORS 配置
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 处理 CORS 预检请求
function handleOptions(): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

// 健康检查端点
function handleHealth(): Response {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
}

// 通过 Gemini API 获取价格
async function fetchPricesFromGemini(
    assets: Array<{ symbol: string; category: string; currency: string }>,
    apiKey: string
): Promise<{ prices: Record<string, number>; exchangeRate: number | null; sources: Array<{ title: string; uri: string }> }> {

    const assetList = assets.map(a => {
        let desc = `Symbol: ${a.symbol}`;
        if (a.category === 'Stock' && a.currency === 'MYR') desc += ` (Bursa Malaysia/KLSE Stock)`;
        else if (a.category === 'ETF') desc += ` (ETF)`;
        else if (a.category === 'Crypto') desc += ` (Cryptocurrency)`;
        return desc;
    }).join('\n');

    const prompt = `
    I need the most recent market data.
    
    TASK 1: Find the current live exchange rate for 1 USD to MYR.
    TASK 2: Find the latest price for these assets:
    ${assetList}

    INSTRUCTIONS:
    1. **PRICE**: Get the **CURRENT LIVE PRICE**. If the market is closed, return the **LAST TRADED PRICE**.
    2. **SOURCES**: Use reliable data from Google Finance, Yahoo Finance, or Bloomberg.
    3. **FORMAT**: Ensure the number is the raw price (e.g. 9.91), do not round it.

    OUTPUT FORMAT (Strict Text):
       USD_MYR: <rate>
       <SYMBOL>: <price>
       <SYMBOL>: <price>
    
    RULES:
    - USD_MYR line is mandatory.
    - <SYMBOL> must match the input symbol provided above exactly.
    - If a price isn't found, skip that line.
  `;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0,
                },
                tools: [{ googleSearch: {} }],
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const prices: Record<string, number> = {};
    let exchangeRate: number | null = null;

    // 解析响应
    const lines = text.split('\n');
    for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        const match = cleanLine.match(/([A-Za-z0-9_]+):\s*[^0-9-]*([\d,]+\.?\d*)/);

        if (match) {
            const key = match[1];
            const rawValue = match[2].replace(/,/g, '');
            const value = parseFloat(rawValue);

            if (!isNaN(value)) {
                if (key === 'USD_MYR') {
                    exchangeRate = value;
                } else {
                    prices[key] = value;
                }
            }
        }
    }

    // 提取来源
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
            if (chunk.web?.uri && chunk.web?.title) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        }
    }

    return { prices, exchangeRate, sources };
}

// 主处理函数
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // 处理 CORS 预检
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }

        // 健康检查
        if (path === '/api/health' && request.method === 'GET') {
            return handleHealth();
        }

        // 获取价格
        if (path === '/api/prices' && request.method === 'POST') {
            try {
                if (!env.GEMINI_API_KEY) {
                    return new Response(JSON.stringify({ error: 'API key not configured' }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const body = await request.json() as any;
                const assets = body.assets;

                if (!assets || !Array.isArray(assets)) {
                    return new Response(JSON.stringify({ error: 'Invalid request: assets array required' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const result = await fetchPricesFromGemini(assets, env.GEMINI_API_KEY);

                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                return new Response(JSON.stringify({ error: message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // 404 - 未知路由
        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    },
};
