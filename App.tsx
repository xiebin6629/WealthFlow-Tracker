
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Asset, ComputedAsset, GlobalSettings, PortfolioMetrics, GroundingSource, AssetCategory, FireProjectionSettings, YearlyRecord, DividendRecord, Loan } from './types';
import { INITIAL_ASSETS, INITIAL_SETTINGS, INITIAL_FIRE_SETTINGS, INITIAL_YEARLY_RECORDS, INITIAL_DIVIDEND_RECORDS, INITIAL_LOANS } from './constants';
import Dashboard from './components/Dashboard';
import AssetTable from './components/AssetTable';
import RebalanceView from './components/RebalanceView';
import FireProjection from './components/FireProjection';
import YearlyRecords from './components/YearlyRecords';
import FirebaseSyncPanel from './components/FirebaseSyncPanel';
import DividendTracker from './components/DividendTracker';
import LoanTracker from './components/LoanTracker';
import { UserData } from './services/firebaseService';
import { LayoutDashboard, List, Settings, Sparkles, Plus, X, Globe, Menu, Eye, EyeOff, Download, Upload, Save, Database, TrendingUp, TrendingDown, Cloud, CloudUpload, CloudDownload, LogOut, Loader2, FileJson, Clock, Key, Copy, AlertCircle, HelpCircle, Wrench, History, ArrowRight, CheckCircle2, FileSpreadsheet, Sun, Moon, DollarSign } from 'lucide-react';
import SettingsPage from './components/SettingsPage';
import { analyzePortfolio } from './services/geminiService';
import { fetchPrices } from './services/priceService';


const STORAGE_KEYS = {
  ASSETS: 'WF_ASSETS',
  SETTINGS: 'WF_SETTINGS',
  SOURCES: 'WF_SOURCES',
  LAST_UPDATED: 'WF_LAST_UPDATED',
  FIRE_SETTINGS: 'WF_FIRE_SETTINGS',
  LAST_CLOUD_SYNC: 'WF_LAST_CLOUD_SYNC',
  CLIENT_ID: 'WF_CLIENT_ID',
  YEARLY_RECORDS: 'WF_YEARLY_RECORDS'
};

interface PriceUpdateLogItem {
  symbol: string;
  oldPrice: number;
  newPrice: number;
  currency?: string; // Made optional as new snippet doesn't include it
  source?: string; // Added source as per new snippet
}

const App: React.FC = () => {
  // 主题切换 - 支持暗色模式
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('WF_THEME');
    if (saved === 'dark' || saved === 'light') return saved;
    // Follow system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('WF_THEME', newTheme);
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'projection' | 'history' | 'dividends' | 'loans' | 'settings'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State with LocalStorage Initialization ---

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASSETS);
      return saved ? JSON.parse(saved) : INITIAL_ASSETS;
    } catch (e) {
      return INITIAL_ASSETS;
    }
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  });

  const [fireSettings, setFireSettings] = useState<FireProjectionSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FIRE_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_FIRE_SETTINGS;
    } catch (e) {
      return INITIAL_FIRE_SETTINGS;
    }
  });

  const [dataSources, setDataSources] = useState<GroundingSource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [yearlyRecords, setYearlyRecords] = useState<YearlyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.YEARLY_RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_YEARLY_RECORDS;
    } catch (e) {
      return INITIAL_YEARLY_RECORDS;
    }
  });

  const [dividendRecords, setDividendRecords] = useState<DividendRecord[]>(() => {
    try {
      const saved = localStorage.getItem('WF_DIVIDEND_RECORDS');
      return saved ? JSON.parse(saved) : INITIAL_DIVIDEND_RECORDS;
    } catch (e) {
      return INITIAL_DIVIDEND_RECORDS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem('WF_LOANS');
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch (e) {
      return INITIAL_LOANS;
    }
  });

  // --- DATA MIGRATION / FIXER ---
  // Runs once on mount to ensure all records have valid IDs
  useEffect(() => {
    setYearlyRecords(prev => {
      let hasChanges = false;
      const verified = prev.map((r, index) => {
        // If ID is missing or empty, generate one
        if (!r.id || String(r.id).trim() === '') {
          hasChanges = true;
          return { ...r, id: `auto-fixed-${r.year}-${Date.now()}-${index}` };
        }
        // Ensure ID is a string
        if (typeof r.id !== 'string') {
          hasChanges = true;
          return { ...r, id: String(r.id) };
        }
        return r;
      });
      return hasChanges ? verified : prev;
    });

    // Fire Projection Settings Persistence
    try {
      const savedFire = localStorage.getItem(STORAGE_KEYS.FIRE_SETTINGS);
      if (savedFire) {
        const parsedFire = JSON.parse(savedFire);
        // Migration: If currentAge exists but birthYear doesn't, calculate birthYear
        if (parsedFire.currentAge && !parsedFire.birthYear) {
          console.log("Migrating Fire Settings: currentAge -> birthYear");
          parsedFire.birthYear = new Date().getFullYear() - parsedFire.currentAge;
          delete parsedFire.currentAge;
        }
        // Ensure newly added fields have defaults
        if (!parsedFire.desiredMonthlySpending) parsedFire.desiredMonthlySpending = INITIAL_FIRE_SETTINGS.desiredMonthlySpending;
        if (!parsedFire.withdrawalRate) parsedFire.withdrawalRate = INITIAL_FIRE_SETTINGS.withdrawalRate;

        setFireSettings(parsedFire);
      }
    } catch (e) { console.error("Failed to load fire settings", e); }
  }, []);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      return saved ? new Date(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_SYNC);
      return saved ? new Date(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Client ID State
  const [customClientId, setCustomClientId] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || process.env.GOOGLE_CLIENT_ID || '';
  });
  const [tempClientId, setTempClientId] = useState('');
  const [isEditingClientId, setIsEditingClientId] = useState(!customClientId);

  // Troubleshooter State
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Helper for origin extraction
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const extractedOrigin = useMemo(() => {
    if (!errorText) return null;
    // Look for origin=https://...
    // Also handle URL encoded versions just in case
    const match = errorText.match(/origin=(https?:\/\/[^&\s]+)/) || errorText.match(/origin%3D(https?%3A%2F%2F[^&\s]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }, [errorText]);

  // Auto-save timestamp state
  const [lastAutoSave, setLastAutoSave] = useState<Date>(new Date());

  // Market Data State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updateLog, setUpdateLog] = useState<PriceUpdateLogItem[]>([]);
  const [showUpdateLog, setShowUpdateLog] = useState(false);
  const [exchangeRateUpdate, setExchangeRateUpdate] = useState<{ old: number, new: number, from?: number, to?: number, source?: string } | null>(null); // Updated type for exchangeRateUpdate

  // Worker URL State
  const [workerUrl, setWorkerUrl] = useState<string>(localStorage.getItem('WF_WORKER_URL') || '');
  useEffect(() => {
    localStorage.setItem('WF_WORKER_URL', workerUrl);
  }, [workerUrl]);

  // AI State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);



  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.FIRE_SETTINGS, JSON.stringify(fireSettings));
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(dataSources));
    localStorage.setItem(STORAGE_KEYS.YEARLY_RECORDS, JSON.stringify(yearlyRecords));
    localStorage.setItem('WF_DIVIDEND_RECORDS', JSON.stringify(dividendRecords));
    localStorage.setItem('WF_LOANS', JSON.stringify(loans));
    if (lastUpdated) {
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, lastUpdated.toISOString());
    }
    if (lastCloudSync) {
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_SYNC, lastCloudSync.toISOString());
    }
    setLastAutoSave(new Date());
  }, [assets, settings, fireSettings, dataSources, yearlyRecords, lastUpdated, lastCloudSync]);



  // --- Calculations ---

  // Helper to check category type
  const isInvestment = (cat: string) => ['ETF', 'Stock', 'Crypto', 'Cash (Investment)'].includes(cat);
  const isPension = (cat: string) => cat === 'Pension';

  const computedAssets: ComputedAsset[] = useMemo(() => {
    // 1. Calculate Investment Total ONLY for allocation percentages
    const investmentTotalValueMyr = assets
      .filter(a => isInvestment(a.category))
      .reduce((sum, asset) => {
        const val = asset.currency === 'USD'
          ? asset.quantity * asset.currentPrice * settings.exchangeRateUsdMyr
          : asset.quantity * asset.currentPrice;
        return sum + val;
      }, 0);

    return assets.map(asset => {
      // Logic for Pension Auto-Calc
      let quantity = asset.quantity;
      if (asset.pensionConfig) {
        const { baseAmount, monthlyContribution, startDate } = asset.pensionConfig;
        const start = new Date(startDate);
        const now = new Date();
        // Calculate months difference
        let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (months < 0) months = 0;
        quantity = baseAmount + (monthlyContribution * months);
      }

      const currentValueOriginal = quantity * asset.currentPrice;

      const currentValueMyr = asset.currency === 'USD'
        ? currentValueOriginal * settings.exchangeRateUsdMyr
        : currentValueOriginal;

      const currentValueUsd = asset.currency === 'USD'
        ? currentValueOriginal
        : (settings.exchangeRateUsdMyr > 0 ? currentValueOriginal / settings.exchangeRateUsdMyr : 0);

      const totalCostOriginal = quantity * asset.averageCost;
      const totalCostMyr = asset.currency === 'USD'
        ? totalCostOriginal * settings.exchangeRateUsdMyr
        : totalCostOriginal;

      const totalCostUsd = asset.currency === 'USD'
        ? totalCostOriginal
        : (settings.exchangeRateUsdMyr > 0 ? totalCostOriginal / settings.exchangeRateUsdMyr : 0);

      const profitLossMyr = currentValueMyr - totalCostMyr;
      const profitLossUsd = currentValueUsd - totalCostUsd;
      const profitLossPercent = totalCostMyr !== 0 ? (profitLossMyr / totalCostMyr) * 100 : 0;

      // Allocation is based on Investment Total if it's an investment
      const currentAllocationPercent = (isInvestment(asset.category) && investmentTotalValueMyr !== 0)
        ? (currentValueMyr / investmentTotalValueMyr) * 100
        : 0;

      return {
        ...asset,
        quantity, // Use computed qty for pension
        currentValueOriginal,
        currentValueMyr,
        currentValueUsd,
        totalCostOriginal,
        totalCostMyr,
        totalCostUsd,
        profitLossMyr,
        profitLossUsd,
        profitLossPercent,
        currentAllocationPercent
      };
    });
  }, [assets, settings.exchangeRateUsdMyr]);

  // Split assets for tables
  const investmentAssets = useMemo(() => computedAssets.filter(a => isInvestment(a.category)), [computedAssets]);
  const savingsAssets = useMemo(() => computedAssets.filter(a => !isInvestment(a.category)), [computedAssets]);
  const pensionAsset = useMemo(() => computedAssets.find(a => isPension(a.category)), [computedAssets]);

  const metrics: PortfolioMetrics = useMemo(() => {
    const investedNetWorth = investmentAssets.reduce((acc, curr) => acc + curr.currentValueMyr, 0);
    const savedNetWorth = savingsAssets.filter(a => !isPension(a.category)).reduce((acc, curr) => acc + curr.currentValueMyr, 0);
    const pensionNetWorth = savingsAssets.filter(a => isPension(a.category)).reduce((acc, curr) => acc + curr.currentValueMyr, 0);

    const totalNetWorth = investedNetWorth + savedNetWorth + pensionNetWorth;

    // Calculate P/L ONLY for Investment Assets to avoid skewing data with EPF/Savings
    const totalInvestedCost = investmentAssets.reduce((acc, curr) => acc + curr.totalCostMyr, 0);
    const totalProfitLoss = investedNetWorth - totalInvestedCost;
    const totalProfitLossPercent = totalInvestedCost > 0 ? (totalProfitLoss / totalInvestedCost) * 100 : 0;

    const progressToFire = (totalNetWorth / settings.financialFreedomTarget) * 100;
    const progressToFireLiquid = ((investedNetWorth + savedNetWorth) / settings.financialFreedomTarget) * 100;

    return {
      totalNetWorth,
      investedNetWorth,
      savedNetWorth,
      pensionNetWorth,
      totalCost: totalInvestedCost,
      totalProfitLoss,
      totalProfitLossPercent,
      progressToFire,
      progressToFireLiquid
    };
  }, [computedAssets, investmentAssets, savingsAssets, settings.financialFreedomTarget]);

  // --- Handlers ---
  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleAddAsset = (initialCategory: AssetCategory = 'Stock') => {
    const isCash = ['Cash (Investment)', 'Cash (Saving)', 'Money Market Fund', 'Pension'].includes(initialCategory);

    const newAsset: Asset = {
      id: Date.now().toString(),
      symbol: 'NEW',
      name: 'New Asset',
      category: initialCategory,
      currency: 'MYR',
      quantity: 0,
      averageCost: 0,
      currentPrice: isCash ? 1 : 0,
      targetAllocation: 0
    };
    setAssets([...assets, newAsset]);
    setActiveTab('portfolio');
  };

  // Yearly Record Handlers
  const handleAddYearlyRecord = (record: YearlyRecord) => {
    setYearlyRecords(prev => [...prev, record]);
  };
  const handleUpdateYearlyRecord = (updatedRecord: YearlyRecord) => {
    setYearlyRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleDeleteYearlyRecord = (id: string, year: number) => {
    setYearlyRecords(prev => {
      // Combined Deletion Strategy:
      // We delete the record if:
      // 1. The ID matches (Strict string comparison)
      // OR
      // 2. The Year matches (Strict number comparison)
      // This ensures that even if ID is broken, the year will catch it.
      const updated = prev.filter(r => {
        const isIdMatch = String(r.id) === String(id);
        const isYearMatch = Number(r.year) === Number(year);

        // If EITHER matches, we exclude it (return false to delete)
        if (isIdMatch || isYearMatch) {
          return false;
        }
        return true;
      });

      return updated;
    });
  };

  // Dividend Record Handlers
  const handleAddDividend = (record: DividendRecord) => {
    setDividendRecords(prev => [...prev, record]);
  };

  const handleDeleteDividend = (id: string) => {
    setDividendRecords(prev => prev.filter(r => r.id !== id));
  };

  // Loan Handlers
  const handleAddLoan = (loan: Loan) => {
    setLoans(prev => [...prev, loan]);
  };

  const handleUpdateLoan = (updatedLoan: Loan) => {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
  };

  const handleDeleteLoan = (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    setShowUpdateLog(false);
    setUpdateLog([]);
    setExchangeRateUpdate(null);

    try {
      // 使用新的 priceService 获取价格，传入 API Key
      const result = await fetchPrices(assets, {
        forceRefresh: true,
        preferWorker: !!workerUrl,
        apiKey: settings.geminiApiKey
      });

      const updates: PriceUpdateLogItem[] = [];

      // Update Exchange Rate
      if (result.exchangeRate) {
        setExchangeRateUpdate({
          from: settings.exchangeRateUsdMyr,
          to: result.exchangeRate,
          source: result.sources.find(s => s.title.includes('Exchange'))?.title || 'API'
        });
        setSettings(prev => ({ ...prev, exchangeRateUsdMyr: result.exchangeRate! }));
      }

      // Update Asset Prices
      const newAssets = assets.map(asset => {
        const newPrice = result.prices[asset.symbol];
        if (newPrice !== undefined && newPrice !== asset.currentPrice) {
          updates.push({
            symbol: asset.symbol,
            oldPrice: asset.currentPrice,
            newPrice: newPrice,
            source: result.sources.find(s => s.title.includes('CoinGecko') || s.title.includes('Yahoo'))?.title || 'API'
          });
          return { ...asset, currentPrice: newPrice };
        }
        return asset;
      });

      setAssets(newAssets);
      setUpdateLog(updates);
      setShowUpdateLog(true);

      // Auto-hide log after 5s
      setTimeout(() => setShowUpdateLog(false), 8000);

    } catch (error) {
      console.error("Failed to fetch prices:", error);
      alert("Failed to refresh market data. Please check your API usage or network.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setIsAiOpen(true);
    setAiInsight('');
    const result = await analyzePortfolio(computedAssets, settings);
    setAiInsight(result);
    setAiLoading(false);
  };

  // --- Data Management Handlers ---

  // Local Backup
  const handleExportData = () => {
    const data = {
      assets,
      settings,
      fireSettings,
      dataSources,
      yearlyRecords,
      lastUpdated: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const timestamp = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');

    a.download = `wealthflow-backup-${timestamp}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['Symbol', 'Name', 'Category', 'Quantity', 'Avg Cost', 'Current Price', 'Value (MYR)', 'Value (USD)', 'Profit (MYR)'];

    // Helper to escape CSV fields
    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      // If contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringField.search(/("|,|\n)/g) >= 0) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const rows = computedAssets.map(a => [
      a.symbol,
      a.name,
      a.category,
      a.quantity,
      a.averageCost,
      a.currentPrice,
      a.currentValueMyr.toFixed(2),
      a.currentValueUsd.toFixed(2),
      a.profitLossMyr.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthflow_assets_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        restoreState(json);
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('Data restored successfully!');
      } catch (error) {
        console.error("Import error:", error);
        alert('Failed to import data. The file format might be invalid.');
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const restoreState = (json: any) => {
    if (json.assets) setAssets(json.assets);
    if (json.settings) setSettings(json.settings);
    if (json.fireSettings) setFireSettings(json.fireSettings);
    if (json.dataSources) setDataSources(json.dataSources);
    if (json.yearlyRecords) setYearlyRecords(json.yearlyRecords);
    if (json.lastUpdated) setLastUpdated(new Date(json.lastUpdated));
  };



  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const togglePrivacy = () => setIsPrivacyMode(!isPrivacyMode);

  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Firebase 数据处理
  const handleFirebaseDataLoaded = useCallback((data: UserData) => {
    if (data.assets) setAssets(data.assets);
    if (data.settings) setSettings(data.settings);
    if (data.fireSettings) setFireSettings(data.fireSettings);
    if (data.yearlyRecords) setYearlyRecords(data.yearlyRecords);
    if (data.lastUpdated) setLastUpdated(new Date(data.lastUpdated));
  }, []);

  // 当前数据用于 Firebase 同步
  const firebaseUserData: UserData = useMemo(() => ({
    assets: JSON.parse(JSON.stringify(assets)), // Remove undefined values (e.g. pensionConfig) to prevent Firestore crash
    settings,
    fireSettings,
    yearlyRecords,
    lastUpdated: lastUpdated?.toISOString() || new Date().toISOString(),
  }), [assets, settings, fireSettings, yearlyRecords, lastUpdated]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>

      {/* Mobile Header */}
      <div
        className="md:hidden p-4 flex justify-between items-center z-30 sticky top-0 shadow-lg backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <h1 className="text-lg font-bold gradient-text">WealthFlow</h1>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={togglePrivacy} className="p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <button onClick={toggleMobileMenu} className="p-2" style={{ color: 'var(--text-primary)' }}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 w-72 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40 flex flex-col h-full shadow-2xl md:shadow-none`}
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="p-8 hidden md:block" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h1 className="text-2xl font-bold gradient-text">
            WealthFlow
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--sidebar-text-muted)' }}>智能财富追踪器</p>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={22} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavClick('portfolio')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'portfolio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={22} />
            <span>Portfolio</span>
          </button>

          <button
            onClick={() => handleNavClick('projection')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'projection' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <TrendingUp size={22} />
            <span>FIRE Projection</span>
          </button>

          <button
            onClick={() => handleNavClick('history')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <History size={22} />
            <span>History Log</span>
          </button>

          <button
            onClick={() => handleNavClick('dividends')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'dividends' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <DollarSign size={22} />
            <span>Dividends</span>
          </button>

          <button
            onClick={() => handleNavClick('loans')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'loans' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <TrendingDown size={22} />
            <span>Loans</span>
          </button>

          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-base font-medium ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={22} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Global Data Panel (Simplified) */}
        <div className="p-6 bg-slate-800/50 border-t border-slate-700 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center gap-2 text-slate-400 mb-4 text-sm uppercase font-semibold tracking-wider">
            <Database size={16} /> Data Management
          </div>

          {/* Firebase 云同步 - 推荐 */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <FirebaseSyncPanel
              currentData={firebaseUserData}
              onDataLoaded={handleFirebaseDataLoaded}
            />
          </div>

          {/* Local Data Management Section */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-3 text-sm uppercase font-semibold tracking-wider">
              <Database size={16} /> Local Backup
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Download File
              </button>

              <button
                onClick={handleExportCsv}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <FileSpreadsheet size={16} />
                Export to CSV
              </button>

              <button
                onClick={triggerImport}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={16} />
                Restore File
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportData}
                className="hidden"
                accept=".json"
              />

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-2">
                <Save size={12} className="text-emerald-500" />
                <span>Auto-saved locally</span>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <div className="pt-4 mt-2 border-t border-slate-700 text-[10px] text-slate-500 text-center">
              Prices Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {
        isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )
      }

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden relative">
        {/* Header - Desktop */}
        <header
          className="h-20 hidden md:flex items-center justify-between px-8 gap-8 flex-shrink-0 backdrop-blur-xl z-20"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderBottom: '1px solid var(--border-light)',
            boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="flex items-center gap-4 overflow-hidden min-w-0">
            <h2
              className="text-2xl font-bold capitalize tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ color: 'var(--text-primary)' }}
            >
              {activeTab === 'dashboard' && '投资仪表盘'}
              {activeTab === 'portfolio' && '资产组合'}
              {activeTab === 'projection' && 'FIRE 推演'}
              {activeTab === 'history' && '历史记录'}
              {activeTab === 'dividends' && '股息追踪'}
              {activeTab === 'loans' && '贷款详情'}
              {activeTab === 'settings' && '系统设置'}
            </h2>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* View Settings Group */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                style={{ color: 'var(--text-secondary)' }}
                title={isDark ? "切换到浅色模式" : "切换到深色模式"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {/* Privacy Toggle */}
              <button
                onClick={togglePrivacy}
                className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                style={{ color: 'var(--text-secondary)' }}
                title={isPrivacyMode ? "显示数值" : "隐藏数值"}
              >
                {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Separator */}
            {(activeTab === 'dashboard' || activeTab === 'portfolio') && (
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
            )}

            {/* Contextual Actions */}
            {(activeTab === 'dashboard' || activeTab === 'portfolio') && (
              <div className="flex items-center gap-3">
                {/* Refresh Prices */}
                <button
                  onClick={handleRefreshPrices}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)'
                  }}
                  title="刷新价格"
                >
                  <Globe size={18} className={isRefreshing ? 'animate-spin' : 'text-blue-500'} />
                  <span className="hidden lg:inline">{isRefreshing ? '更新中...' : '刷新价格'}</span>
                </button>

                {/* Add Asset */}
                <button
                  onClick={() => handleAddAsset('Stock')}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 hover:shadow-md"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)'
                  }}
                  title="添加资产"
                >
                  <Plus size={18} className="text-emerald-500" />
                  <span className="hidden lg:inline">添加资产</span>
                </button>

                {/* AI Analysis */}
                <button
                  onClick={handleAiAnalysis}
                  className="flex items-center gap-2 px-3 lg:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                    color: 'white',
                  }}
                  title="AI 分析"
                >
                  <Sparkles size={18} />
                  <span className="hidden lg:inline">AI 分析</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Action Bar */}
        <div
          className="md:hidden p-4 flex justify-between gap-2 overflow-x-auto backdrop-blur-xl"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <button
            onClick={handleRefreshPrices}
            className="p-2.5 rounded-lg flex-shrink-0 transition-all"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}
          >
            <Globe size={20} className={isRefreshing ? 'animate-spin' : ''} style={{ color: isRefreshing ? '#3B82F6' : 'var(--text-secondary)' }} />
          </button>
          <button
            onClick={() => handleAddAsset('Stock')}
            className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            + 添加
          </button>
          <button
            onClick={handleAiAnalysis}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
              color: 'white'
            }}
          >
            <Sparkles size={16} /> AI
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="container mx-auto max-w-full space-y-8">
            {activeTab === 'dashboard' && (
              <div className="max-w-[1600px] mx-auto">
                <Dashboard
                  metrics={metrics}
                  assets={computedAssets}
                  financialFreedomTarget={settings.financialFreedomTarget}
                  savingTarget={settings.savingTarget}
                  monthlyInvestmentTarget={settings.monthlyInvestmentTarget}
                  annualInvestmentTarget={settings.annualInvestmentTarget}
                  exchangeRate={settings.exchangeRateUsdMyr}
                  dataSources={dataSources}
                  isPrivacyMode={isPrivacyMode}
                  yearlyRecords={yearlyRecords}
                  dividendYieldPercent={settings.dividendYieldPercent}
                />
              </div>
            )}
            {activeTab === 'portfolio' && (
              <>
                {/* 1. Rebalance Plan Section */}
                <RebalanceView
                  assets={investmentAssets}
                  exchangeRate={settings.exchangeRateUsdMyr}
                  isPrivacyMode={isPrivacyMode}
                />

                {/* 2. Investment Portfolio Table */}
                <AssetTable
                  title="Investment Portfolio"
                  assets={investmentAssets}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onAddAsset={() => handleAddAsset('Stock')}
                  isPrivacyMode={isPrivacyMode}
                />

                {/* 3. Savings Table */}
                <AssetTable
                  title="Savings & Liquidity (Including Pension)"
                  assets={savingsAssets}
                  onUpdateAsset={handleUpdateAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onAddAsset={() => handleAddAsset('Cash (Saving)')}
                  isPrivacyMode={isPrivacyMode}
                />
              </>
            )}

            {activeTab === 'projection' && (
              <FireProjection
                settings={fireSettings}
                onUpdateSettings={setFireSettings}
                onUpdateGlobalSettings={(newTarget) => setSettings({ ...settings, financialFreedomTarget: newTarget })}
                currentLiquidNetWorth={metrics.investedNetWorth + metrics.savedNetWorth}
                currentEpfNetWorth={metrics.pensionNetWorth}
                fireTarget={settings.financialFreedomTarget}
                isPrivacyMode={isPrivacyMode}
                portfolioPensionConfig={pensionAsset?.pensionConfig}
              />
            )}

            {activeTab === 'history' && (
              <YearlyRecords
                records={yearlyRecords}
                onAddRecord={handleAddYearlyRecord}
                onUpdateRecord={handleUpdateYearlyRecord}
                onDeleteRecord={handleDeleteYearlyRecord}
                currentMetrics={metrics}
                isPrivacyMode={isPrivacyMode}
              />
            )}

            {activeTab === 'dividends' && (
              <DividendTracker
                records={dividendRecords}
                onAddRecord={handleAddDividend}
                onDeleteRecord={handleDeleteDividend}
                exchangeRate={settings.exchangeRateUsdMyr}
                isPrivacyMode={isPrivacyMode}
              />
            )}

            {activeTab === 'loans' && (
              <LoanTracker
                loans={loans}
                onAddLoan={handleAddLoan}
                onUpdateLoan={handleUpdateLoan}
                onDeleteLoan={handleDeleteLoan}
                isPrivacyMode={isPrivacyMode}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                settings={settings}
                fireSettings={fireSettings}
                onUpdateSettings={setSettings}
                onUpdateFireSettings={setFireSettings}
                workerUrl={workerUrl}
                setWorkerUrl={setWorkerUrl}
                firebaseUserData={firebaseUserData}
                onFirebaseDataLoaded={handleFirebaseDataLoaded}
                handleExportData={handleExportData}
                handleExportCsv={handleExportCsv}
                triggerImport={triggerImport}
                fileInputRef={fileInputRef}
                handleImportData={handleImportData}
                lastUpdated={lastUpdated}
              />
            )}
          </div>
        </div>

        {/* Detailed Market Update Log Summary - Bottom Right */}
        {showUpdateLog && (
          <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 animate-slide-in-right overflow-hidden flex flex-col max-h-[400px]">
            <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white">
              <h4 className="font-bold flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} /> Market Data Updated
              </h4>
              <button onClick={() => setShowUpdateLog(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
              <div className="space-y-3">
                {/* Exchange Rate Section */}
                {exchangeRateUpdate && (
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">USD / MYR Exchange Rate</p>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 line-through text-xs">{(exchangeRateUpdate.from || 0).toFixed(4)}</span>
                      <ArrowRight size={14} className="text-slate-300" />
                      <span className="font-bold text-slate-800">{(exchangeRateUpdate.to || 0).toFixed(4)}</span>
                    </div>
                  </div>
                )}

                {/* Asset List */}
                {updateLog.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Updated Assets</p>
                    {updateLog.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100">
                        <div className="font-semibold text-slate-800">{item.symbol}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">
                            {item.currency === 'USD' ? '$' : 'RM'}{item.oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`font-bold ${item.newPrice >= item.oldPrice ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !exchangeRateUpdate && <p className="text-sm text-slate-500 text-center py-2">No price changes detected.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* AI Modal */}
      {
        isAiOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <Sparkles size={20} /> Gemini Portfolio Analyst
                </h3>
                <button onClick={() => setIsAiOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-6">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-base animate-pulse">Analyzing market data...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate prose-lg max-w-none">
                    {aiInsight ? (
                      <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                        {aiInsight}
                      </div>
                    ) : (
                      <p className="text-rose-500">Failed to load insights.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Loading Toast for AI Refresh */}
      {
        isRefreshing && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-slide-in-right">
            <Loader2 className="animate-spin text-blue-400" size={20} />
            <span className="text-sm font-medium">AI is researching live market data... (approx 5-10s)</span>
          </div>
        )
      }


    </div >
  );
};

export default App;
