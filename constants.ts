
import { Asset, GlobalSettings, FireProjectionSettings, YearlyRecord, DividendRecord, Loan, InvestmentTransaction } from './types';

// ============================================
// 全局设置 - 模拟马来西亚初级程序员的财务规划
// ============================================
export const INITIAL_SETTINGS: GlobalSettings = {
  exchangeRateUsdMyr: 4.42,
  financialFreedomTarget: 800000, // RM 800k FIRE 目标
  savingTarget: 25000, // RM 25k 现金储备目标
  monthlyInvestmentTarget: 1500, // 每月投资 RM 1500
  annualInvestmentTarget: 18000, // 年度投资 RM 18000
  geminiApiKey: '',
  dividendYieldPercent: 2.5 // 2.5% 股息率
};

// ============================================
// FIRE 推演设置
// ============================================
export const INITIAL_FIRE_SETTINGS: FireProjectionSettings = {
  birthYear: 1997, // 29岁 (2026年)
  monthlyContribution: 1500,
  annualReturnPercent: 7,
  inflationPercent: 3,
  includeEpf: true,
  epfMonthlyContribution: 1200, // 雇主 + 个人
  epfAnnualReturnPercent: 5.5,
  desiredMonthlySpending: 3500,
  withdrawalRate: 4
};

// ============================================
// 模拟资产组合 - 初级程序员的投资配置
// ============================================
export const INITIAL_ASSETS: Asset[] = [
  // === 美股 ETF (核心持仓) ===
  {
    id: "asset-voo",
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    category: "ETF",
    currency: "USD",
    quantity: 18,
    averageCost: 380.50,
    currentPrice: 536.09,
    targetAllocation: 55,
  },
  {
    id: "asset-qqqm",
    symbol: "QQQM",
    name: "Invesco NASDAQ 100 ETF",
    category: "ETF",
    currency: "USD",
    quantity: 12,
    averageCost: 155.30,
    currentPrice: 215.71,
    targetAllocation: 25,
  },
  {
    id: "asset-schd",
    symbol: "SCHD",
    name: "Schwab US Dividend Equity",
    category: "ETF",
    currency: "USD",
    quantity: 15,
    averageCost: 68.50,
    currentPrice: 82.30,
    targetAllocation: 10,
  },

  // === 马股 ===
  {
    id: "asset-maybank",
    symbol: "1155.KL",
    name: "Malayan Banking Bhd",
    category: "Stock",
    currency: "MYR",
    quantity: 200,
    averageCost: 9.50,
    currentPrice: 10.86,
    targetAllocation: 5,
  },

  // === 加密货币 (小仓位尝试) ===
  {
    id: "asset-btc",
    symbol: "BTC",
    name: "Bitcoin",
    category: "Crypto",
    currency: "USD",
    quantity: 0.025,
    averageCost: 38000,
    currentPrice: 98500,
    targetAllocation: 5,
    groupName: "BTC",
  },

  // === 公积金 (EPF) ===
  {
    id: "asset-epf",
    symbol: "EPF",
    name: "KWSP / EPF",
    category: "Pension",
    currency: "MYR",
    quantity: 0,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
    pensionConfig: {
      baseAmount: 35000,
      monthlyContribution: 1200,
      startDate: "2021-01-01"
    }
  },

  // === 现金储蓄 ===
  {
    id: "asset-fd",
    symbol: "FD-CIMB",
    name: "CIMB Fixed Deposit",
    category: "Cash (Saving)",
    currency: "MYR",
    quantity: 12000,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
  },
  {
    id: "asset-asnb",
    symbol: "ASNB",
    name: "ASB (Amanah Saham)",
    category: "Cash (Saving)",
    currency: "MYR",
    quantity: 8000,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
  },
  {
    id: "asset-tng",
    symbol: "TNG-GO+",
    name: "Touch 'n Go GO+",
    category: "Cash (Saving)",
    currency: "MYR",
    quantity: 1500,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
  },
  {
    id: "asset-emergency",
    symbol: "EMERGENCY",
    name: "Emergency Fund (Maybank)",
    category: "Cash (Saving)",
    currency: "MYR",
    quantity: 6000,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
  },

  // === 投资账户现金 ===
  {
    id: "asset-ibkr-cash",
    symbol: "IBKR-CASH",
    name: "IBKR Account Cash",
    category: "Cash (Investment)",
    currency: "USD",
    quantity: 500,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0,
  },
];

// ============================================
// 历史年度记录 - 用于图表展示
// ============================================
export const INITIAL_YEARLY_RECORDS: YearlyRecord[] = [
  {
    id: "rec-2021",
    year: 2021,
    investAmount: 6000,
    savingAmount: 5000,
    epfAmount: 12000,
    income: 48000,
    vooReturn: 28.7,
    note: "大学毕业，开始第一份工作",
    dateRecorded: "2021-12-31T00:00:00.000Z"
  },
  {
    id: "rec-2022",
    year: 2022,
    investAmount: 12000,
    savingAmount: 8000,
    epfAmount: 22000,
    income: 54000,
    vooReturn: -18.1,
    note: "熊市入市，逢低买入",
    dateRecorded: "2022-12-31T00:00:00.000Z"
  },
  {
    id: "rec-2023",
    year: 2023,
    investAmount: 18000,
    savingAmount: 12000,
    epfAmount: 34000,
    income: 60000,
    vooReturn: 26.3,
    note: "市场反弹，收益回正",
    dateRecorded: "2023-12-31T00:00:00.000Z"
  },
  {
    id: "rec-2024",
    year: 2024,
    investAmount: 28000,
    savingAmount: 18000,
    epfAmount: 48000,
    income: 72000,
    vooReturn: 25.0,
    note: "升职加薪，加大投入",
    dateRecorded: "2024-12-31T00:00:00.000Z"
  },
  {
    id: "rec-2025",
    year: 2025,
    investAmount: 42000,
    savingAmount: 24000,
    epfAmount: 62000,
    income: 78000,
    vooReturn: 12.5,
    note: "稳步增长",
    dateRecorded: "2025-12-31T00:00:00.000Z"
  },
  {
    id: "rec-2026",
    year: 2026,
    investAmount: 3500,
    savingAmount: 27500,
    epfAmount: 68000,
    income: 84000,
    vooReturn: undefined,
    note: "年初进度",
    dateRecorded: "2026-01-19T00:00:00.000Z"
  }
];

// ============================================
// 股息记录 - 演示数据
// ============================================
export const INITIAL_DIVIDEND_RECORDS: DividendRecord[] = [
  // 2024年
  { id: "div-2024-01", date: "2024-03-28", symbol: "VOO", amount: 12.80, currency: "USD", amountMyr: 56.58, note: "Q1 股息" },
  { id: "div-2024-02", date: "2024-06-28", symbol: "VOO", amount: 13.50, currency: "USD", amountMyr: 59.67, note: "Q2 股息" },
  { id: "div-2024-03", date: "2024-09-27", symbol: "VOO", amount: 14.20, currency: "USD", amountMyr: 62.76, note: "Q3 股息" },
  { id: "div-2024-04", date: "2024-12-20", symbol: "VOO", amount: 15.10, currency: "USD", amountMyr: 66.74, note: "Q4 股息" },
  { id: "div-2024-05", date: "2024-03-15", symbol: "SCHD", amount: 8.50, currency: "USD", amountMyr: 37.57, note: "Q1 股息" },
  { id: "div-2024-06", date: "2024-06-15", symbol: "SCHD", amount: 8.80, currency: "USD", amountMyr: 38.90, note: "Q2 股息" },
  { id: "div-2024-07", date: "2024-09-15", symbol: "SCHD", amount: 9.10, currency: "USD", amountMyr: 40.22, note: "Q3 股息" },
  { id: "div-2024-08", date: "2024-12-15", symbol: "SCHD", amount: 9.50, currency: "USD", amountMyr: 41.99, note: "Q4 股息" },
  { id: "div-2024-09", date: "2024-05-15", symbol: "1155.KL", amount: 108.00, currency: "MYR", amountMyr: 108.00, note: "Maybank 中期股息" },
  { id: "div-2024-10", date: "2024-09-10", symbol: "1155.KL", amount: 114.00, currency: "MYR", amountMyr: 114.00, note: "Maybank 终期股息" },
  // 2025年
  { id: "div-2025-01", date: "2025-03-28", symbol: "VOO", amount: 16.20, currency: "USD", amountMyr: 71.60, note: "Q1 股息" },
  { id: "div-2025-02", date: "2025-06-28", symbol: "VOO", amount: 17.00, currency: "USD", amountMyr: 75.14, note: "Q2 股息" },
  { id: "div-2025-03", date: "2025-09-27", symbol: "VOO", amount: 17.80, currency: "USD", amountMyr: 78.68, note: "Q3 股息" },
  { id: "div-2025-04", date: "2025-12-20", symbol: "VOO", amount: 18.50, currency: "USD", amountMyr: 81.77, note: "Q4 股息" },
  { id: "div-2025-05", date: "2025-03-15", symbol: "SCHD", amount: 9.80, currency: "USD", amountMyr: 43.32, note: "Q1 股息" },
  { id: "div-2025-06", date: "2025-06-15", symbol: "SCHD", amount: 10.20, currency: "USD", amountMyr: 45.08, note: "Q2 股息" },
  { id: "div-2025-07", date: "2025-09-15", symbol: "SCHD", amount: 10.60, currency: "USD", amountMyr: 46.85, note: "Q3 股息" },
  { id: "div-2025-08", date: "2025-12-15", symbol: "SCHD", amount: 11.00, currency: "USD", amountMyr: 48.62, note: "Q4 股息" },
  { id: "div-2025-09", date: "2025-05-15", symbol: "1155.KL", amount: 120.00, currency: "MYR", amountMyr: 120.00, note: "Maybank 中期股息" },
  { id: "div-2025-10", date: "2025-09-10", symbol: "1155.KL", amount: 126.00, currency: "MYR", amountMyr: 126.00, note: "Maybank 终期股息" },
];

// ============================================
// 贷款记录 - 演示数据
// ============================================
export const INITIAL_LOANS: Loan[] = [
  {
    id: "loan-car",
    name: "Perodua Myvi 汽车贷款",
    type: "car",
    principalAmount: 55000,
    interestRatePercent: 3.5,
    monthlyPayment: 650,
    startDate: "2023-06-01",
    tenureMonths: 84, // 7年
    note: "Hong Leong Bank"
  },
  {
    id: "loan-ptptn",
    name: "PTPTN 教育贷款",
    type: "education",
    principalAmount: 28000,
    interestRatePercent: 1.0,
    monthlyPayment: 250,
    startDate: "2021-07-01",
    tenureMonths: 120, // 10年
    note: "大学费用"
  },
  {
    id: "loan-laptop",
    name: "MacBook Pro 分期",
    type: "personal",
    principalAmount: 8500,
    interestRatePercent: 0,
    monthlyPayment: 354,
    startDate: "2024-01-01",
    tenureMonths: 24,
    note: "AEON 0% 分期"
  },
];

// ============================================
// 投资交易记录 - 初始为空
// ============================================
export const INITIAL_TRANSACTIONS: InvestmentTransaction[] = [];
