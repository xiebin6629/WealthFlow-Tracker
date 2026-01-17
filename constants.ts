
import { Asset, GlobalSettings, FireProjectionSettings } from './types';

export const INITIAL_SETTINGS: GlobalSettings = {
  exchangeRateUsdMyr: 4.1325,
  financialFreedomTarget: 500000, // 500k Target
  savingTarget: 15000, // 15k Emergency Fund Target
  geminiApiKey: '', // 用户自备
};

export const INITIAL_FIRE_SETTINGS: FireProjectionSettings = {
  currentAge: 30,
  monthlyContribution: 3000,
  annualReturnPercent: 7.0, // Conservative market return
  inflationPercent: 3.0,    // Standard inflation
  includeEpf: true,
  epfMonthlyContribution: 1100, // Employer + Employee
  epfAnnualReturnPercent: 5.5, // Historical EPF avg
  desiredMonthlySpending: 5000, // Default 5k monthly spend
  withdrawalRate: 4.0 // Default 4% Rule
};

export const INITIAL_ASSETS: Asset[] = [
  {
    id: '1',
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'ETF',
    currency: 'USD',
    quantity: 11.0, // Adjusted for 100k total
    averageCost: 485.50,
    currentPrice: 628.41,
    targetAllocation: 60,
  },
  {
    id: '2',
    symbol: 'QQQM',
    name: 'Invesco NASDAQ 100',
    category: 'ETF',
    currency: 'USD',
    quantity: 8.0, // Adjusted for 100k total
    averageCost: 185.20,
    currentPrice: 254.90,
    targetAllocation: 18,
  },
  {
    id: '3',
    symbol: 'VGT',
    name: 'Vanguard Info Tech',
    category: 'ETF',
    currency: 'USD',
    quantity: 2.0, // Adjusted for 100k total
    averageCost: 590.00,
    currentPrice: 752.20,
    targetAllocation: 15,
  },
  {
    id: '4',
    symbol: '1155', // Correct Symbol for Maybank
    name: 'Malayan Banking Bhd',
    category: 'Stock',
    currency: 'MYR',
    quantity: 500,
    averageCost: 8.90,
    currentPrice: 9.91,
    targetAllocation: 5,
  },
  {
    id: '5',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Crypto',
    currency: 'USD',
    quantity: 0.002, // Adjusted for 100k total
    averageCost: 65000,
    currentPrice: 90684,
    targetAllocation: 2,
  },
  {
    id: '6',
    symbol: 'EPF',
    name: 'KWSP / EPF',
    category: 'Pension',
    currency: 'MYR',
    quantity: 0, // Calculated via pensionConfig
    averageCost: 0,
    currentPrice: 1,
    targetAllocation: 0,
    pensionConfig: {
      baseAmount: 38500.00, // Adjusted for 100k total
      monthlyContribution: 1100,
      startDate: '2025-01-01'
    }
  },
  {
    id: '7',
    symbol: 'MAYBANK',
    name: 'Saving Account',
    category: 'Cash (Saving)',
    currency: 'MYR',
    quantity: 1500,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0
  },
  {
    id: '8',
    symbol: 'ASNB',
    name: 'Amanah Saham',
    category: 'Cash (Saving)',
    currency: 'MYR',
    quantity: 8000.00,
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0
  },
  {
    id: '9',
    symbol: 'TNG',
    name: 'Touch n Go eWallet',
    category: 'Cash (Saving)',
    currency: 'MYR',
    quantity: 200.00, // Adjusted for 100k total
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0
  },
  {
    id: '10',
    symbol: 'RYT',
    name: 'KDI / Rize',
    category: 'Cash (Saving)',
    currency: 'MYR',
    quantity: 3000.00, // Adjusted for 100k total
    averageCost: 1,
    currentPrice: 1,
    targetAllocation: 0
  }
];
