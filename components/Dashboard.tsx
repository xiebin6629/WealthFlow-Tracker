
import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioMetrics, ComputedAsset, GroundingSource } from '../types';
import { DollarSign, Activity, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown, GripVertical } from 'lucide-react';

interface DashboardProps {
  metrics: PortfolioMetrics;
  assets: ComputedAsset[];
  financialFreedomTarget: number;
  savingTarget: number;
  dataSources: GroundingSource[];
  isPrivacyMode: boolean;
}

type SortKey = 'symbol' | 'currentValueMyr' | 'currentValueUsd' | 'totalCostMyr' | 'totalCostUsd' | 'profitLossMyr' | 'profitLossUsd' | 'profitLossPercent';
type SortDirection = 'asc' | 'desc';

// Define Columns for Dashboard Table
type DashboardColumnKey = SortKey;

interface DashboardColumnDef {
  key: DashboardColumnKey;
  label: string;
  align: 'left' | 'right';
  className?: string;
}

const DEFAULT_DASHBOARD_COLUMNS: DashboardColumnDef[] = [
  { key: 'symbol', label: 'Asset', align: 'left' },
  { key: 'currentValueUsd', label: 'Value (USD)', align: 'right' },
  { key: 'currentValueMyr', label: 'Value (RM)', align: 'right' },
  { key: 'totalCostUsd', label: 'Total Cost (USD)', align: 'right' },
  { key: 'totalCostMyr', label: 'Total Cost (RM)', align: 'right' },
  { key: 'profitLossUsd', label: 'P/L (USD)', align: 'right' },
  { key: 'profitLossMyr', label: 'P/L (RM)', align: 'right' },
  { key: 'profitLossPercent', label: 'P/L (%)', align: 'right' },
];

const STORAGE_KEY_DASH_COL_ORDER = 'WF_DASH_COL_ORDER';

const Dashboard: React.FC<DashboardProps> = ({ metrics, assets, financialFreedomTarget, savingTarget, dataSources, isPrivacyMode }) => {
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'profitLossMyr',
    direction: 'desc'
  });

  // Drag and Drop State
  const [columnOrder, setColumnOrder] = useState<DashboardColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DASH_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset if column count changed (e.g., added USD columns)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_DASHBOARD_COLUMNS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load dashboard column order", e);
    }
    return DEFAULT_DASHBOARD_COLUMNS.map(c => c.key);
  });
  
  const [draggedColumn, setDraggedColumn] = useState<DashboardColumnKey | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DASH_COL_ORDER, JSON.stringify(columnOrder));
  }, [columnOrder]);

  const savingProgressPercent = Math.min(100, Math.max(0, (metrics.savedNetWorth / savingTarget) * 100));
  const fireProgressPercent = Math.min(100, Math.max(0, metrics.progressToFire));
  const fireLiquidProgressPercent = Math.min(100, Math.max(0, metrics.progressToFireLiquid));

  // Filter only investment assets for the performance table
  const investmentAssets = useMemo(() => {
    return assets.filter(a => ['ETF', 'Stock', 'Crypto', 'Cash (Investment)'].includes(a.category));
  }, [assets]);

  // Sorting Logic
  const sortedInvestments = useMemo(() => {
    return [...investmentAssets].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [investmentAssets, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, key: DashboardColumnKey) => {
    setDraggedColumn(key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: DashboardColumnKey) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === key) return;

    const newOrder = [...columnOrder];
    const draggedIdx = newOrder.indexOf(draggedColumn);
    const targetIdx = newOrder.indexOf(key);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);
      setColumnOrder(newOrder);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const renderCell = (asset: ComputedAsset, colKey: DashboardColumnKey) => {
    const isPositive = asset.profitLossMyr >= 0;
    const isPositiveUsd = asset.profitLossUsd >= 0;

    switch(colKey) {
        case 'symbol':
            return (
                <div>
                  <div className="font-bold text-slate-900">{asset.symbol}</div>
                  <div className="text-xs text-slate-500">{asset.name}</div>
                </div>
            );
        case 'currentValueUsd':
            return (
                <div className="font-medium text-slate-500">
                    {isPrivacyMode ? '****' : asset.currentValueUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                </div>
            );
        case 'currentValueMyr':
            return (
                <div className="font-medium text-slate-700">
                    {isPrivacyMode ? '****' : asset.currentValueMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}
                </div>
            );
        case 'totalCostUsd':
            return (
                <div className="text-slate-500">
                    {isPrivacyMode ? '****' : asset.totalCostUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                </div>
            );
        case 'totalCostMyr':
            return (
                <div className="text-slate-500">
                    {isPrivacyMode ? '****' : asset.totalCostMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}
                </div>
            );
        case 'profitLossUsd':
            return (
                <div className={`font-bold ${isPositiveUsd ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPrivacyMode ? (
                        isPositiveUsd ? '+ ****' : '- ****'
                    ) : (
                        `${isPositiveUsd ? '+' : ''}${asset.profitLossUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}`
                    )}
                </div>
            );
        case 'profitLossMyr':
            return (
                <div className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPrivacyMode ? (
                        isPositive ? '+ ****' : '- ****'
                    ) : (
                        `${isPositive ? '+' : ''}${asset.profitLossMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}`
                    )}
                </div>
            );
        case 'profitLossPercent':
            return (
                <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {isPositive ? <TrendingUp size={14} className="inline mr-1"/> : <TrendingDown size={14} className="inline mr-1"/>}
                    {asset.profitLossPercent.toFixed(2)}%
                </span>
            );
        default:
            return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Net Worth */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div>
            <p className="text-slate-500 text-base font-semibold uppercase tracking-wide">Total Net Worth</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
              {isPrivacyMode ? 'RM ****' : `RM ${metrics.totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </h3>
          </div>
          <div className="mt-4 space-y-1">
             <div className="flex justify-between text-xs text-slate-500">
               <span>Invest + Save</span>
               <span className="font-semibold text-emerald-600">
                 {isPrivacyMode ? '+ ****' : `+ RM ${(metrics.investedNetWorth + metrics.savedNetWorth).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
             </div>
             <div className="flex justify-between text-xs text-slate-500">
               <span>EPF / Pension</span>
               <span className="font-semibold text-emerald-600">
                 {isPrivacyMode ? '+ ****' : `+ RM ${metrics.pensionNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
               </span>
             </div>
          </div>
        </div>

        {/* Invested vs Saved Breakdown */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
           <div>
            <p className="text-slate-500 text-base font-semibold uppercase tracking-wide">Liquidity</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-slate-500 text-sm">Invested</span>
                <span className="font-bold text-lg text-blue-600">
                  {isPrivacyMode ? '****' : `RM ${metrics.investedNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-1">
                <span className="text-slate-500 text-sm">Saved</span>
                <span className="font-bold text-lg text-emerald-600">
                   {isPrivacyMode ? '****' : `RM ${metrics.savedNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
            </div>
          </div>
           <div className="mt-4">
              <p className="text-xs text-slate-400 mb-1 flex justify-between">
                  <span>Saving Goal ({savingTarget/1000}k)</span>
                  <span>{savingProgressPercent.toFixed(0)}%</span>
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${savingProgressPercent}%` }}></div>
              </div>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
           <div>
            <p className="text-slate-500 text-base font-semibold uppercase tracking-wide">Total Profit / Loss</p>
            <div className="flex flex-wrap items-baseline gap-3 mt-2">
              <h3 className={`text-3xl md:text-4xl font-extrabold ${metrics.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPrivacyMode ? (
                  metrics.totalProfitLoss >= 0 ? '+ ****' : '- ****'
                ) : (
                  <>
                  {metrics.totalProfitLoss >= 0 ? '+' : ''}RM {Math.abs(metrics.totalProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </>
                )}
              </h3>
              <span className={`text-lg font-bold ${metrics.totalProfitLossPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'} bg-opacity-10 px-2 py-1 rounded`}>
                {metrics.totalProfitLossPercent >= 0 ? '+' : ''}{metrics.totalProfitLossPercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="mt-6 text-sm text-slate-400 flex items-center gap-2">
             <Activity size={16} /> Unrealized Gains (Inv. Only)
          </div>
        </div>

         {/* Target */}
         <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-base font-semibold uppercase tracking-wide">FIRE Target</p>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">
              RM {(financialFreedomTarget / 1000000).toFixed(2)}M
            </h3>
          </div>
          
          {/* Progress Bar: Only visible if NOT in privacy mode */}
          {!isPrivacyMode && (
            <div className="mt-4 space-y-3">
               {/* Total */}
               <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Total (Inc. EPF)</span>
                    <span className="font-semibold text-indigo-600">{fireProgressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${fireProgressPercent}%` }}></div>
                  </div>
               </div>

               {/* Liquid */}
               <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Liquid (Exc. EPF)</span>
                    <span className="font-semibold text-blue-500">{fireLiquidProgressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${fireLiquidProgressPercent}%` }}></div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Investment Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} /> Investment Performance
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {columnOrder.map((colKey) => {
                    const colDef = DEFAULT_DASHBOARD_COLUMNS.find(c => c.key === colKey);
                    if (!colDef) return null;
                    const isActive = sortConfig.key === colKey;
                    const isDragging = draggedColumn === colKey;

                    return (
                        <th 
                            key={colKey}
                            draggable
                            onDragStart={(e) => handleDragStart(e, colKey)}
                            onDragOver={(e) => handleDragOver(e, colKey)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            className={`
                                px-6 py-4 transition-all duration-200 select-none group border-r border-transparent cursor-move
                                ${isDragging ? 'opacity-40 bg-blue-50 border-2 border-dashed border-blue-400' : 'hover:bg-slate-100 hover:border-slate-200'} 
                                text-xs font-bold text-slate-500 uppercase tracking-wider
                            `}
                            onClick={() => handleSort(colKey)}
                        >
                            <div className={`flex items-center gap-1.5 ${colDef.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                <GripVertical size={14} className={`text-slate-300 mr-1 ${isDragging ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100'}`} />
                                {colDef.label}
                                <span className={`text-slate-400 ${isActive ? 'text-blue-600' : 'opacity-0 group-hover:opacity-50'}`}>
                                    {isActive ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                    ) : (
                                    <ArrowUpDown size={14} />
                                    )}
                                </span>
                            </div>
                        </th>
                    );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedInvestments.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    {columnOrder.map((colKey) => {
                        const colDef = DEFAULT_DASHBOARD_COLUMNS.find(c => c.key === colKey);
                        return (
                            <td key={colKey} className={`px-6 py-4 ${colDef?.align === 'right' ? 'text-right' : 'text-left'}`}>
                                {renderCell(asset, colKey)}
                            </td>
                        );
                    })}
                  </tr>
              ))}
              {sortedInvestments.length === 0 && (
                <tr>
                  <td colSpan={columnOrder.length} className="px-6 py-8 text-center text-slate-400 italic">
                    No investment assets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sources Attribution */}
      {dataSources.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm text-slate-500">
          <p className="font-semibold mb-3 text-slate-700">Market Data Sources (Google Search):</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {dataSources.map((source, idx) => (
              <li key={idx}>
                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline flex items-center gap-1.5 transition-colors">
                  {source.title} <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
