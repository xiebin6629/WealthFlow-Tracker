
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
      model: 'gemini-2.5-flash-lite',
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


