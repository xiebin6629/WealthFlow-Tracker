
import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioMetrics, ComputedAsset, GroundingSource } from '../types';
import { DollarSign, Activity, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown, GripVertical, Wallet, Target, PiggyBank, BarChart3 } from 'lucide-react';

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

type DashboardColumnKey = SortKey;

interface DashboardColumnDef {
  key: DashboardColumnKey;
  label: string;
  align: 'left' | 'right';
}

const DEFAULT_DASHBOARD_COLUMNS: DashboardColumnDef[] = [
  { key: 'symbol', label: '资产', align: 'left' },
  { key: 'currentValueUsd', label: '市值 (USD)', align: 'right' },
  { key: 'currentValueMyr', label: '市值 (RM)', align: 'right' },
  { key: 'totalCostUsd', label: '成本 (USD)', align: 'right' },
  { key: 'totalCostMyr', label: '成本 (RM)', align: 'right' },
  { key: 'profitLossUsd', label: '盈亏 (USD)', align: 'right' },
  { key: 'profitLossMyr', label: '盈亏 (RM)', align: 'right' },
  { key: 'profitLossPercent', label: '盈亏 (%)', align: 'right' },
];

const STORAGE_KEY_DASH_COL_ORDER = 'WF_DASH_COL_ORDER';

const Dashboard: React.FC<DashboardProps> = ({ metrics, assets, financialFreedomTarget, savingTarget, dataSources, isPrivacyMode }) => {

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'profitLossMyr',
    direction: 'desc'
  });

  const [columnOrder, setColumnOrder] = useState<DashboardColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DASH_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
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

  const investmentAssets = useMemo(() => {
    return assets.filter(a => ['ETF', 'Stock', 'Crypto', 'Cash (Investment)'].includes(a.category));
  }, [assets]);

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

    switch (colKey) {
      case 'symbol':
        return (
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{asset.symbol}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{asset.name}</div>
          </div>
        );
      case 'currentValueUsd':
        return (
          <div className="font-medium" style={{ color: 'var(--text-muted)' }}>
            {isPrivacyMode ? '****' : asset.currentValueUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </div>
        );
      case 'currentValueMyr':
        return (
          <div className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isPrivacyMode ? '****' : asset.currentValueMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}
          </div>
        );
      case 'totalCostUsd':
        return (
          <div style={{ color: 'var(--text-muted)' }}>
            {isPrivacyMode ? '****' : asset.totalCostUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
          </div>
        );
      case 'totalCostMyr':
        return (
          <div style={{ color: 'var(--text-muted)' }}>
            {isPrivacyMode ? '****' : asset.totalCostMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}
          </div>
        );
      case 'profitLossUsd':
        return (
          <div className="font-bold" style={{ color: isPositiveUsd ? 'var(--success-500)' : 'var(--danger-500)' }}>
            {isPrivacyMode ? (isPositiveUsd ? '+ ****' : '- ****') :
              `${isPositiveUsd ? '+' : ''}${asset.profitLossUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}`}
          </div>
        );
      case 'profitLossMyr':
        return (
          <div className="font-bold" style={{ color: isPositive ? 'var(--success-500)' : 'var(--danger-500)' }}>
            {isPrivacyMode ? (isPositive ? '+ ****' : '- ****') :
              `${isPositive ? '+' : ''}${asset.profitLossMyr.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 })}`}
          </div>
        );
      case 'profitLossPercent':
        return (
          <span
            className="stat-badge px-2.5 py-1 rounded-lg text-sm font-bold inline-flex items-center gap-1"
            style={{
              background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isPositive ? 'var(--success-500)' : 'var(--danger-500)'
            }}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {asset.profitLossPercent.toFixed(2)}%
          </span>
        );
      default:
        return null;
    }
  };

  // 卡片通用样式
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    backdropFilter: 'blur(12px)',
  };

  return (
    <div className="space-y-8">
      {/* Top Cards - 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* 总净资产 */}
        <div
          className="p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1"
          style={cardStyle}
        >
          {/* 背景装饰 */}
          <div
            className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--cyan-500) 100%)' }}
          />
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={60} style={{ color: 'var(--primary-500)' }} />
          </div>

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              总净资产
            </p>
            <h3 className="text-3xl md:text-4xl font-extrabold mt-2 gradient-text">
              {isPrivacyMode ? 'RM ****' : `RM ${metrics.totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </h3>
          </div>

          <div className="mt-4 space-y-1.5 relative">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>投资 + 储蓄</span>
              <span className="font-semibold" style={{ color: 'var(--success-500)' }}>
                {isPrivacyMode ? '+ ****' : `+ RM ${(metrics.investedNetWorth + metrics.savedNetWorth).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>公积金 / 养老金</span>
              <span className="font-semibold" style={{ color: 'var(--success-500)' }}>
                {isPrivacyMode ? '+ ****' : `+ RM ${metrics.pensionNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
          </div>
        </div>

        {/* 流动性分析 */}
        <div
          className="p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          style={cardStyle}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <PiggyBank size={50} style={{ color: 'var(--success-500)' }} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            流动性分析
          </p>
          <div className="mt-3 space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>投资金额</span>
              <span className="font-bold text-lg" style={{ color: 'var(--primary-500)' }}>
                {isPrivacyMode ? '****' : `RM ${metrics.investedNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <div className="flex justify-between items-end pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>储蓄金额</span>
              <span className="font-bold text-lg" style={{ color: 'var(--success-500)' }}>
                {isPrivacyMode ? '****' : `RM ${metrics.savedNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-muted)' }}>储蓄目标 ({(savingTarget / 1000).toFixed(0)}k)</span>
              <span className="font-semibold" style={{ color: 'var(--success-500)' }}>{savingProgressPercent.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${savingProgressPercent}%`,
                  background: 'linear-gradient(90deg, var(--success-500) 0%, var(--cyan-500) 100%)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 总盈亏 */}
        <div
          className="p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={cardStyle}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <BarChart3 size={50} style={{ color: metrics.totalProfitLoss >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            投资盈亏
          </p>
          <div className="flex flex-wrap items-baseline gap-3 mt-2">
            <h3
              className="text-3xl md:text-4xl font-extrabold"
              style={{ color: metrics.totalProfitLoss >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}
            >
              {isPrivacyMode ? (metrics.totalProfitLoss >= 0 ? '+ ****' : '- ****') : (
                <>{metrics.totalProfitLoss >= 0 ? '+' : ''}RM {Math.abs(metrics.totalProfitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}</>
              )}
            </h3>
            <span
              className="text-lg font-bold px-2 py-1 rounded-lg"
              style={{
                color: metrics.totalProfitLossPercent >= 0 ? 'var(--success-500)' : 'var(--danger-500)',
                background: metrics.totalProfitLossPercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'
              }}
            >
              {metrics.totalProfitLossPercent >= 0 ? '+' : ''}{metrics.totalProfitLossPercent.toFixed(2)}%
            </span>
          </div>

          <div className="mt-6 text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <Activity size={14} /> 未实现收益 (仅投资)
          </div>
        </div>

        {/* FIRE 目标 */}
        <div
          className="p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          style={cardStyle}
        >
          <div className="absolute top-4 right-4 opacity-10">
            <Target size={50} style={{ color: 'var(--primary-500)' }} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            FIRE 目标
          </p>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2 gradient-text">
            RM {(financialFreedomTarget / 1000000).toFixed(2)}M
          </h3>

          {!isPrivacyMode && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>总进度 (含公积金)</span>
                  <span className="font-semibold" style={{ color: 'var(--primary-500)' }}>{fireProgressPercent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${fireProgressPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>流动资产进度</span>
                  <span className="font-semibold" style={{ color: 'var(--cyan-500)' }}>{fireLiquidProgressPercent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${fireLiquidProgressPercent}%`,
                      background: 'var(--cyan-500)'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 投资表现表格 */}
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
        style={cardStyle}
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border-light)' }}
        >
          <h4 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="text-blue-500" size={20} /> 投资表现
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
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
                      className={`px-6 py-4 transition-all duration-200 select-none group cursor-move ${isDragging ? 'opacity-40' : ''}`}
                      onClick={() => handleSort(colKey)}
                      style={{
                        color: 'var(--text-muted)',
                        background: isDragging ? 'var(--primary-50)' : undefined
                      }}
                    >
                      <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${colDef.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                        <GripVertical size={14} className={`mr-1 ${isDragging ? '' : 'opacity-0 group-hover:opacity-50'}`} style={{ color: 'var(--text-muted)' }} />
                        {colDef.label}
                        <span style={{ color: isActive ? 'var(--primary-500)' : 'var(--text-muted)', opacity: isActive ? 1 : 0 }} className="group-hover:opacity-50">
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
            <tbody>
              {sortedInvestments.map((asset, idx) => (
                <tr
                  key={asset.id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: idx % 2 === 1 ? 'var(--bg-tertiary)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 1 ? 'var(--bg-tertiary)' : 'transparent'}
                >
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
                  <td colSpan={columnOrder.length} className="px-6 py-8 text-center italic" style={{ color: 'var(--text-muted)' }}>
                    暂无投资资产数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 数据来源 */}
      {dataSources.length > 0 && (
        <div
          className="p-6 rounded-xl text-sm"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-muted)'
          }}
        >
          <p className="font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>市场数据来源 (Google Search):</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {dataSources.map((source, idx) => (
              <li key={idx}>
                <a
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1.5 transition-colors"
                  style={{ color: 'var(--primary-500)' }}
                >
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
