
export type Currency = 'USD' | 'MYR';

export type AssetCategory = 'ETF' | 'Stock' | 'Crypto' | 'Cash (Investment)' | 'Cash (Saving)' | 'Pension' | 'Money Market Fund';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  currency: Currency;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  targetAllocation: number; // Percentage 0-100
  pensionConfig?: {
    baseAmount: number;
    monthlyContribution: number;
    startDate: string; // ISO Date string
  };
}

export interface GlobalSettings {
  exchangeRateUsdMyr: number;
  financialFreedomTarget: number;
  savingTarget: number;
  geminiApiKey?: string; // 用户自备的 Gemini API Key
}

export interface FireProjectionSettings {
  currentAge: number;
  monthlyContribution: number; // Personal Liquid Contribution
  annualReturnPercent: number; // Liquid Return
  inflationPercent: number;
  // EPF Specifics
  includeEpf: boolean;
  epfMonthlyContribution: number;
  epfAnnualReturnPercent: number;
  // Reverse Calc
  desiredMonthlySpending: number;
  withdrawalRate: number; // New field for custom SWR (e.g., 3.5 or 4.0)
}

export interface ComputedAsset extends Asset {
  currentValueOriginal: number;
  currentValueMyr: number;
  currentValueUsd: number;
  totalCostMyr: number;
  totalCostUsd: number; // New field
  totalCostOriginal: number;
  profitLossMyr: number;
  profitLossUsd: number; // New field
  profitLossPercent: number;
  currentAllocationPercent: number;
}

export interface PortfolioMetrics {
  totalNetWorth: number; // Liquid + Pension
  investedNetWorth: number;
  savedNetWorth: number; // Savings + MMF
  pensionNetWorth: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  progressToFire: number;
  progressToFireLiquid: number;
}

export interface RebalanceAction {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  amountMyr: number;
  amountUnits: number;
  currentWeight: number;
  targetWeight: number;
  isUsd: boolean;
  usdAmount?: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface YearlyRecord {
  id: string;
  year: number;
  investAmount: number;
  savingAmount: number;
  epfAmount: number;
  vooReturn?: number; // Market Benchmark Return (e.g. S&P 500)
  note?: string;
  // Snapshot date helps sort if user has multiple entries for same year (though typically 1 per year)
  dateRecorded: string;
}
