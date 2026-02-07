
import React, { useMemo } from 'react';
import { FireProjectionSettings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Target, DollarSign, AlertCircle, Briefcase, RefreshCw, Calculator, Flag, CheckCircle2, Clock, Download, Unlock } from 'lucide-react';
import ScenarioSimulator from './ScenarioSimulator';
import { calculateTrueLiquidity, getLatestTopUpStartAge, EPF_DEFAULT_THRESHOLD } from '../utils/epfEnhancedSavings';

interface FireProjectionProps {
  settings: FireProjectionSettings;
  onUpdateSettings: (settings: FireProjectionSettings) => void;
  onUpdateGlobalSettings: (newTarget: number) => void;
  currentLiquidNetWorth: number; // Invested + Saved
  currentEpfNetWorth: number; // EPF Only
  fireTarget: number;
  isPrivacyMode: boolean;
  portfolioPensionConfig?: { monthlyContribution: number };
}

const CustomTooltip = ({ active, payload, label, isPrivacyMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="p-4 rounded-xl shadow-xl min-w-[200px] border"
        style={{
          background: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <p className="font-bold mb-3 border-b pb-2 flex justify-between items-center" style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
          <span>{label} 岁</span>
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>({data.year})</span>
        </p>

        <div className="space-y-2">
          {/* Total Net Worth Highlight */}
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>总净资产</span>
            <span className="font-extrabold text-base" style={{ color: 'var(--text-primary)' }}>
              {isPrivacyMode ? '****' : `RM ${data.total.toLocaleString()}`}
            </span>
          </div>

          {/* Breakdown */}
          <div className="p-2 rounded-lg space-y-1.5 mt-1" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: '#3b82f6' }}>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 流动资产
              </span>
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                {isPrivacyMode ? '****' : `RM ${data.liquid.toLocaleString()}`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: '#6366f1' }}>
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> EPF
              </span>
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                {isPrivacyMode ? '****' : `RM ${data.epf.toLocaleString()}`}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>FIRE 目标</span>
            <span style={{ color: '#10b981' }}>{isPrivacyMode ? '****' : `RM ${data.target.toLocaleString()}`}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const FireProjection: React.FC<FireProjectionProps> = ({
  settings,
  onUpdateSettings,
  onUpdateGlobalSettings,
  currentLiquidNetWorth,
  currentEpfNetWorth,
  fireTarget,
  isPrivacyMode,
  portfolioPensionConfig
}) => {

  // --- Projection Engine ---
  const epfThreshold = settings.epfWithdrawalThreshold || EPF_DEFAULT_THRESHOLD;

  const projectionData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - settings.birthYear;
    const yearsToProject = 60 - currentAge; // Project up to age 60

    let liquidBal = currentLiquidNetWorth;
    let epfBal = currentEpfNetWorth;

    const data = [];
    // Start from current year
    for (let i = 0; i <= yearsToProject; i++) {
      // Calculate true liquidity with EPF overflow
      const trueLiquidityInfo = calculateTrueLiquidity(liquidBal, epfBal, epfThreshold);

      data.push({
        year: currentYear + i,
        age: Number(currentAge) + i, // Ensure numeric addition
        liquid: Math.round(liquidBal),
        epf: Math.round(epfBal),
        total: Math.round(liquidBal + epfBal),
        target: fireTarget, // Include target for tooltip
        // EPF Enhanced Savings fields
        accessibleEpf: Math.round(trueLiquidityInfo.accessibleEpf),
        trueLiquid: Math.round(trueLiquidityInfo.totalLiquid),
        isEpfUnlocked: trueLiquidityInfo.isEpfUnlocked
      });

      // Apply annual contributions
      liquidBal += (settings.monthlyContribution * 12);
      epfBal += (settings.epfMonthlyContribution * 12);

      // Apply Compound Interest (adjusted for inflation)
      const realLiquidReturnRate = (settings.annualReturnPercent - settings.inflationPercent) / 100;
      const realEpfReturnRate = (settings.epfAnnualReturnPercent - settings.inflationPercent) / 100;

      liquidBal = liquidBal * (1 + realLiquidReturnRate);
      epfBal = epfBal * (1 + realEpfReturnRate);
    }
    return data;
  }, [settings, currentLiquidNetWorth, currentEpfNetWorth, fireTarget, epfThreshold]);

  // --- Findings ---
  const reachedFireTotalIndex = projectionData.findIndex(d => d.total >= fireTarget);
  const reachedFireTotalData = reachedFireTotalIndex !== -1 ? projectionData[reachedFireTotalIndex] : null;

  const reachedFireLiquidIndex = projectionData.findIndex(d => d.liquid >= fireTarget);
  const reachedFireLiquidData = reachedFireLiquidIndex !== -1 ? projectionData[reachedFireLiquidIndex] : null;

  // --- Withdrawal Rate Calculation ---
  const withdrawalRatePercent = settings.withdrawalRate || 4.0;
  // Ensure we don't divide by zero
  const safeRate = withdrawalRatePercent > 0 ? withdrawalRatePercent / 100 : 0.04;
  const calculatedReverseTarget = settings.desiredMonthlySpending * 12 / safeRate;

  // --- Milestone Logic ---
  const milestonesToTrack = [500000, 800000, 1000000, 1250000, 1500000, 2000000, 3000000, 5000000];

  const milestoneProjections = useMemo(() => {
    return milestonesToTrack.map(goal => {
      // Find the first year where total net worth crosses the goal
      const achievedData = projectionData.find(d => d.total >= goal);
      const currentTotal = projectionData.length > 0 ? projectionData[0].total : 0;
      const isAchieved = currentTotal >= goal;

      return {
        goal,
        data: achievedData,
        isAchieved
      };
    }).filter(m => m.data !== undefined || m.isAchieved); // Only show reachable milestones
  }, [projectionData]);

  // --- EPF Enhanced Savings Calculations ---
  const epfEnhancedInfo = useMemo(() => {
    if (!settings.enableEnhancedSavingsStrategy) return null;

    // Find first year when EPF is unlocked
    const epfUnlockedData = projectionData.find(d => d.isEpfUnlocked);

    // Calculate top-up start age if EPF won't reach threshold naturally
    const targetAge = 45; // Target early retirement age for RIA benefit
    const targetYearData = projectionData.find(d => d.age === targetAge);
    const topUpInfo = targetYearData
      ? getLatestTopUpStartAge(targetAge, targetYearData.epf, epfThreshold)
      : null;

    // Current status
    const currentData = projectionData.length > 0 ? projectionData[0] : null;

    return {
      epfUnlockedData,
      topUpInfo,
      currentAccessibleEpf: currentData?.accessibleEpf || 0,
      currentTrueLiquid: currentData?.trueLiquid || 0,
      isCurrentlyUnlocked: currentData?.isEpfUnlocked || false
    };
  }, [projectionData, settings.enableEnhancedSavingsStrategy, epfThreshold]);

  const handleExport = () => {
    if (!projectionData || projectionData.length === 0) return;

    const headers = ['Year', 'Age', 'Liquid Net Worth', 'EPF Net Worth', 'Total Net Worth'];
    const rows = projectionData.map(item => [
      item.year,
      item.age,
      item.liquid,
      item.epf,
      item.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fire_projection_trajectory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Input Controls - 输入控制区 */}
        <div className="lg:col-span-1 space-y-6">
          <div
            className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto rounded-2xl border transition-all"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar size={20} className="text-indigo-600" /> 计算器参数
            </h3>

            <div className="space-y-6">
              {/* Reverse FIRE Calculator - 逆向计算器 */}
              {/* Reverse FIRE Calculator - 逆向计算器 */}
              <div className="p-4 rounded-xl border bg-blue-50/50 border-blue-100 dark:bg-slate-800 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-3 text-blue-700 dark:text-blue-300">
                  <Calculator size={14} /> 逆向 FIRE 计算器
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">目标月支出 (RM)</label>
                    <input
                      type="number"
                      value={settings.desiredMonthlySpending || ''}
                      placeholder="例如: 5000"
                      onChange={(e) => onUpdateSettings({ ...settings, desiredMonthlySpending: parseFloat(e.target.value) || 0 })}
                      className="input bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">安全提款率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.withdrawalRate || ''}
                      placeholder="4.0"
                      onChange={(e) => onUpdateSettings({ ...settings, withdrawalRate: parseFloat(e.target.value) || 0 })}
                      className="input bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 focus:border-blue-500"
                    />
                    <p className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 opacity-90">标准: 4.0% | 保守: 3.0-3.5%</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200 dark:border-slate-600">
                  <p className="text-xs mb-1 text-slate-600 dark:text-slate-400">所需投资组合规模:</p>
                  <p className="text-lg font-extrabold text-blue-800 dark:text-blue-300">
                    RM {calculatedReverseTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <button
                    onClick={() => onUpdateGlobalSettings(calculatedReverseTarget)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-colors btn-primary shadow-sm hover:shadow"
                  >
                    <Target size={14} /> 应用到目标
                  </button>
                </div>
              </div>

              {/* Common - 通用设置 */}
              <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">基础设置</h4>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">出生年份 (Birth Year)</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={settings.birthYear}
                      onChange={(e) => onUpdateSettings({ ...settings, birthYear: parseInt(e.target.value) || 1990 })}
                      className="input"
                    />
                    <span className="ml-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                      {new Date().getFullYear() - settings.birthYear} 岁
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">通货膨胀率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.inflationPercent}
                    onChange={(e) => onUpdateSettings({ ...settings, inflationPercent: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>

              {/* Personal Liquid Investment - 个人流动投资 */}
              <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={14} /> 流动投资 (Liquid)
                </h4>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">月投入金额 (RM)</label>
                  <input
                    type="number"
                    value={settings.monthlyContribution}
                    onChange={(e) => onUpdateSettings({ ...settings, monthlyContribution: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">预期年化回报率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.annualReturnPercent}
                    onChange={(e) => onUpdateSettings({ ...settings, annualReturnPercent: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>

              {/* EPF / Pension - 公积金 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase size={14} /> 公积金 (EPF)
                </h4>
                <div>
                  <label className="block text-sm font-semibold mb-1 flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                    每月缴纳 (雇主+个人)
                    {portfolioPensionConfig && (
                      <button
                        onClick={() => onUpdateSettings({ ...settings, epfMonthlyContribution: portfolioPensionConfig.monthlyContribution })}
                        className="text-xs flex items-center gap-1 px-2 py-0.5 rounded transition-colors"
                        style={{ color: 'var(--primary-600)', background: 'var(--primary-50)' }}
                        title={`从投资组合同步 RM ${portfolioPensionConfig.monthlyContribution}`}
                      >
                        <RefreshCw size={12} /> 同步
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    value={settings.epfMonthlyContribution}
                    onChange={(e) => onUpdateSettings({ ...settings, epfMonthlyContribution: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>预期派息率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.epfAnnualReturnPercent}
                    onChange={(e) => onUpdateSettings({ ...settings, epfAnnualReturnPercent: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Results - 关键结果 */}
          <div
            className="rounded-xl shadow-lg p-6 space-y-4"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <h4 className="text-sm font-bold uppercase tracking-wider border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>预测结果</h4>

            {/* Result 1: With EPF */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-indigo-400 text-xs font-bold uppercase">总资产 (含公积金)</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>达成目标年龄</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold">{reachedFireTotalData ? reachedFireTotalData.age : 'N/A'}</h3>
                <p className="text-xs" style={{ color: '#94a3b8' }}>岁</p>
              </div>
            </div>

            {/* Result 2: Liquid Only */}
            <div className="flex justify-between items-center border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase">仅流动资产</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>达成目标年龄</p>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold">{reachedFireLiquidData ? reachedFireLiquidData.age : '100+'}</h3>
                <p className="text-xs" style={{ color: '#94a3b8' }}>岁</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Milestones Section - 图表与里程碑 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Chart */}
          <div
            className="rounded-2xl shadow-lg p-6 flex-1 flex flex-col min-h-[400px] transition-all"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp size={20} className="text-emerald-500" /> 净值增长轨迹
              </h3>
              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
                title="Export Chart Data"
              >
                <Download size={16} />
              </button>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorEpf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis
                    dataKey="age"
                    label={{ value: '年龄', position: 'insideBottomRight', offset: -5, fill: 'var(--text-muted)' }}
                    tick={{ fill: 'var(--text-muted)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                    tick={{ fill: 'var(--text-muted)' }}
                    tickLine={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} />
                  <ReferenceLine y={fireTarget} stroke="#10b981" strokeDasharray="5 5" label={{ value: '目标', position: 'insideTopRight', fill: '#10b981', fontSize: 12 }} />

                  {/* EPF 1.3M Threshold Line */}
                  {settings.enableEnhancedSavingsStrategy && (
                    <ReferenceLine
                      y={epfThreshold}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{ value: `EPF ${(epfThreshold / 1000000).toFixed(1)}M`, position: 'insideBottomRight', fill: '#f59e0b', fontSize: 11 }}
                    />
                  )}

                  {/* Stacked Areas: Liquid on Bottom, EPF on Top */}
                  <Area
                    type="monotone"
                    dataKey="liquid"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#colorLiquid)"
                    name="流动资产"
                  />
                  <Area
                    type="monotone"
                    dataKey="epf"
                    stackId="1"
                    stroke="#6366f1"
                    fill="url(#colorEpf)"
                    name="EPF"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span style={{ color: 'var(--text-secondary)' }}>流动资产</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span style={{ color: 'var(--text-secondary)' }}>公积金 (EPF)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-dashed border-emerald-500"></div>
                <span style={{ color: 'var(--text-secondary)' }}>FIRE 目标线</span>
              </div>
              {settings.enableEnhancedSavingsStrategy && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-dashed border-amber-500"></div>
                  <span style={{ color: 'var(--text-secondary)' }}>EPF 门槛</span>
                </div>
              )}
            </div>

            {/* EPF Enhanced Savings Status */}
            {settings.enableEnhancedSavingsStrategy && epfEnhancedInfo && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Liquidity Unlocked Status */}
                  <div
                    className={`p-3 rounded-xl flex items-center gap-3 ${epfEnhancedInfo.isCurrentlyUnlocked
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Unlock size={20} className={epfEnhancedInfo.isCurrentlyUnlocked ? 'text-emerald-500' : 'text-slate-400'} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: epfEnhancedInfo.isCurrentlyUnlocked ? '#059669' : 'var(--text-muted)' }}>
                        {epfEnhancedInfo.isCurrentlyUnlocked ? 'Liquidity Unlocked' : '尚未解锁'}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {epfEnhancedInfo.isCurrentlyUnlocked
                          ? `可提领 RM ${epfEnhancedInfo.currentAccessibleEpf.toLocaleString()}`
                          : `距门槛 RM ${(epfThreshold - currentEpfNetWorth).toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* True Liquidity */}
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">真实流动性</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {isPrivacyMode ? 'RM ****' : `RM ${epfEnhancedInfo.currentTrueLiquid.toLocaleString()}`}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>流动资产 + 可提领EPF</p>
                  </div>

                  {/* Top-up Deadline */}
                  {epfEnhancedInfo.topUpInfo && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">搬家倒计时</p>
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {epfEnhancedInfo.topUpInfo.startAge} 岁开始
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        需 {epfEnhancedInfo.topUpInfo.yearsNeeded} 年填补 RM {epfEnhancedInfo.topUpInfo.totalRequired.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Milestone Roadmap - 里程碑 */}
          <div
            className="rounded-xl shadow-lg p-6 border transition-all"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Flag size={20} className="text-orange-500" /> 财务里程碑路线图
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {milestoneProjections.map((m, idx) => (
                <div
                  key={m.goal}
                  className={`
                        relative p-4 rounded-xl border transition-all duration-300
                        ${m.isAchieved
                      ? 'bg-emerald-50 border-emerald-200 shadow-inner'
                      : 'shadow-sm hover:shadow-md hover:-translate-y-1'
                    }
                      `}
                  style={!m.isAchieved ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' } : {}}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: m.isAchieved ? '#059669' : 'var(--text-muted)' }}>
                      里程碑 {idx + 1}
                    </span>
                    {m.isAchieved ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <Clock size={16} className="text-blue-400" />
                    )}
                  </div>

                  <div className={`text-xl font-extrabold mb-3 ${m.isAchieved ? 'text-emerald-700' : ''}`} style={!m.isAchieved ? { color: 'var(--text-primary)' } : {}}>
                    {isPrivacyMode ? 'RM ****' : (m.goal >= 1000000 ? `RM ${m.goal / 1000000}M` : `RM ${m.goal / 1000}k`)}
                  </div>

                  {m.isAchieved ? (
                    <div className="text-xs font-semibold text-emerald-600 bg-emerald-100 inline-block px-2 py-1 rounded-full">
                      已达成
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>年份</span>
                        <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{m.data ? m.data.year : '> 100'}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200"></div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>年龄</span>
                        <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{m.data ? m.data.age : 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Scenario Simulator - 多情景模拟器 */}
      <ScenarioSimulator
        baseSettings={settings}
        currentLiquidNetWorth={currentLiquidNetWorth}
        currentEpfNetWorth={currentEpfNetWorth}
        fireTarget={fireTarget}
        isPrivacyMode={isPrivacyMode}
      />
    </div>
  );
};

export default FireProjection;
