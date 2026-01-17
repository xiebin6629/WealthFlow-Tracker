
import { GoogleGenAI } from "@google/genai";
import { ComputedAsset, GlobalSettings, GroundingSource, Asset } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert financial advisor and portfolio analyst. 
Your goal is to analyze the user's investment portfolio and provide actionable, concise insights.
Focus on:
1. Diversification health.
2. Risk exposure (based on asset classes like Crypto vs ETFs).
3. Alignment with standard financial freedom goals.
4. Specific observations on individual holdings if they seem overweight/underweight significantly.

IMPORTANT: Please provide the response in Chinese (Simplified).
Keep the tone professional, encouraging, and analytical. Format the output with clear bullet points.
`;

export const analyzePortfolio = async (
  assets: ComputedAsset[],
  settings: GlobalSettings
): Promise<string> => {
  try {
    // 优先使用用户设置的 API Key，否则使用环境变量
    const apiKey = settings.geminiApiKey || process.env.API_KEY;
    if (!apiKey) {
      return "请在设置中输入您的 Gemini API Key。获取地址: https://aistudio.google.com/app/apikey";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare data for the model
    const portfolioSummary = assets.map(a => ({
      symbol: a.symbol,
      category: a.category,
      valueMYR: a.currentValueMyr.toFixed(2),
      allocation: a.currentAllocationPercent.toFixed(2) + '%',
      target: a.targetAllocation + '%',
      profitLoss: a.profitLossPercent.toFixed(2) + '%'
    }));

    const prompt = `
      Please analyze this portfolio:
      Base Currency: MYR
      Exchange Rate USD/MYR: ${settings.exchangeRateUsdMyr}
      
      Holdings:
      ${JSON.stringify(portfolioSummary, null, 2)}
      
      Total Net Worth: MYR ${assets.reduce((sum, a) => sum + a.currentValueMyr, 0).toFixed(2)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this time. Please try again later.";
  }
};

export interface MarketDataResult {
  prices: Record<string, number>;
  exchangeRate: number | null;
  sources: GroundingSource[];
}

export const fetchLiveMarketData = async (assets: Asset[], apiKey?: string): Promise<MarketDataResult> => {
  // 使用传入的 API Key 或环境变量
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("请在设置中输入您的 Gemini API Key");
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // Create a more descriptive list to help the AI search better
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
    1. **PRICE**: Get the **CURRENT LIVE PRICE**. If the market is closed, return the **LAST TRADED PRICE** displayed as the main price.
    2. **SOURCES**: Use reliable data from Google Finance, Yahoo Finance, or Bloomberg.
    3. **FORMAT**: Ensure the number is the raw price (e.g. 9.91), do not round it yourself unless it has more than 4 decimal places.

    OUTPUT FORMAT (Strict Text):
       USD_MYR: <rate>
       <SYMBOL>: <price>
       <SYMBOL>: <price>
    
    RULES:
    - USD_MYR line is mandatory.
    - <SYMBOL> must match the input symbol provided above exactly.
    - If a price isn't found, skip that line.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0, // Deterministic output
      },
    });

    const text = response.text || '';
    const prices: Record<string, number> = {};
    let exchangeRate: number | null = null;

    // Parse the text response
    const lines = text.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      // Improved Regex to handle various AI output formats better
      // Matches: "USD_MYR: 4.13", "MAYBANK: RM 9.88", "BTC: $69,000.50", "VOO: 500.12 (Close)"
      // 1. ([A-Za-z0-9_]+) -> Captures Symbol (KEY)
      // 2. :\s* -> Matches colon and whitespace
      // 3. [^0-9-]* -> Matches any non-digit prefix (like "RM ", "$", "MYR ")
      // 4. ([\d,]+\.?\d*) -> Captures the number (including commas)
      const match = cleanLine.match(/([A-Za-z0-9_]+):\s*[^0-9-]*([\d,]+\.?\d*)/);

      if (match) {
        const key = match[1];
        // Remove commas before parsing
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

    // Extract sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { prices, exchangeRate, sources };

  } catch (error) {
    console.error("Market Data Fetch Error:", error);
    throw error;
  }
};
