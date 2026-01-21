
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
  groupName?: string; // For grouping assets (e.g. BTC + IBIT)
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
  monthlyInvestmentTarget?: number; // Monthly investment goal
  annualInvestmentTarget?: number; // Annual investment goal
  geminiApiKey?: string; // 用户自备的 Gemini API Key
  dividendYieldPercent?: number; // Estimated Average Dividend Yield
}

export interface FireProjectionSettings {
  birthYear: number;
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
  income?: number; // Annual Active Income (Net)
  expenses?: number; // Annual Expenses (derived or explicit)
  vooReturn?: number; // Market Benchmark Return (e.g. S&P 500)
  note?: string;
  // Snapshot date helps sort if user has multiple entries for same year (though typically 1 per year)
  dateRecorded: string;
}

export interface MonthlySnapshot {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  totalNetWorth: number;
  investedNetWorth: number;
  savedNetWorth: number;
  pensionNetWorth: number;
  note?: string;
}

export interface DividendRecord {
  id: string;
  date: string; // ISO date string
  symbol: string;
  amount: number; // In original currency
  currency: 'USD' | 'MYR';
  amountMyr: number; // Converted to MYR
  note?: string;
}

export type LoanType = 'car' | 'house' | 'education' | 'personal' | 'credit_card' | 'other';

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  principalAmount: number; // 原始贷款金额
  interestRatePercent: number; // 年利率
  monthlyPayment: number; // 每月还款额
  startDate: string; // ISO date string (YYYY-MM-DD)
  tenureMonths: number; // 贷款期限（月）
  note?: string;
}

// Computed loan with remaining balance
export interface ComputedLoan extends Loan {
  monthsPaid: number; // 已还月数
  remainingBalance: number; // 剩余本金
  totalPaid: number; // 已还总额
  totalInterest: number; // 总利息
  progressPercent: number; // 还款进度
  isCompleted: boolean; // 是否还清
  monthsRemaining: number; // 剩余月数
}

// Investment Transaction Types
export type TransactionType = 'BUY' | 'SELL';

export interface InvestmentTransaction {
  id: string;
  date: string;           // ISO date string
  type: TransactionType;  // BUY or SELL
  symbol: string;         // Asset symbol (e.g., VOO, AAPL)
  quantity: number;       // Units bought/sold
  pricePerUnit: number;   // Price per unit
  currency: Currency;     // USD or MYR
  totalAmount: number;    // Total transaction amount
  cashAccountId?: string; // ID of cash account to deduct/add from
  note?: string;
}
