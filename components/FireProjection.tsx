
import React, { useMemo } from 'react';
import { FireProjectionSettings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Target, DollarSign, AlertCircle, Briefcase, RefreshCw, Calculator, Flag, CheckCircle2, Clock } from 'lucide-react';

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
  const projectionData = useMemo(() => {
    const data = [];
    let liquidBalance = currentLiquidNetWorth;
    let epfBalance = currentEpfNetWorth;

    let age = settings.currentAge;
    const currentYear = new Date().getFullYear();

    // Real Return Rates (Nominal - Inflation)
    const realLiquidReturnRate = (settings.annualReturnPercent - settings.inflationPercent) / 100;
    const realEpfReturnRate = (settings.epfAnnualReturnPercent - settings.inflationPercent) / 100;

    const maxAge = 100;

    // Initial Point
    data.push({
      age,
      year: currentYear,
      liquid: liquidBalance,
      epf: epfBalance,
      total: liquidBalance + epfBalance,
      target: fireTarget
    });

    // Loop until both criteria (Liquid > Target OR Total > Target) are potentially met, or max age
    // We run until we are well past the target to show the crossover clearly
    while (age < maxAge && (liquidBalance < fireTarget * 1.5)) {
      age++;
      const year = currentYear + (age - settings.currentAge);

      // 1. Grow Liquid
      const liquidGrowth = liquidBalance * realLiquidReturnRate;
      const liquidContribution = settings.monthlyContribution * 12;
      liquidBalance = liquidBalance + liquidGrowth + liquidContribution;

      // 2. Grow EPF
      const epfGrowth = epfBalance * realEpfReturnRate;
      const epfContribution = settings.epfMonthlyContribution * 12;
      epfBalance = epfBalance + epfGrowth + epfContribution;

      data.push({
        age,
        year,
        liquid: Math.round(liquidBalance),
        epf: Math.round(epfBalance),
        total: Math.round(liquidBalance + epfBalance),
        target: fireTarget
      });

      // Safety break
      if (data.length > 70) break;
    }

    return data;
  }, [currentLiquidNetWorth, currentEpfNetWorth, fireTarget, settings]);

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
      const currentTotal = projectionData[0].total;
      const isAchieved = currentTotal >= goal;

      return {
        goal,
        data: achievedData,
        isAchieved
      };
    }).filter(m => m.data !== undefined || m.isAchieved); // Only show reachable milestones
  }, [projectionData]);

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
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: 'var(--primary-50)',
                  borderColor: 'var(--primary-100)'
                }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-3" style={{ color: 'var(--primary-700)' }}>
                  <Calculator size={14} /> 逆向 FIRE 计算器
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--primary-700)' }}>目标月支出 (RM)</label>
                    <input
                      type="number"
                      value={settings.desiredMonthlySpending || ''}
                      placeholder="例如: 5000"
                      onChange={(e) => onUpdateSettings({ ...settings, desiredMonthlySpending: parseFloat(e.target.value) || 0 })}
                      className="input"
                      style={{ background: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--primary-700)' }}>安全提款率 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.withdrawalRate || ''}
                      placeholder="4.0"
                      onChange={(e) => onUpdateSettings({ ...settings, withdrawalRate: parseFloat(e.target.value) || 0 })}
                      className="input"
                      style={{ background: 'var(--bg-primary)' }}
                    />
                    <p className="text-[10px] mt-1 opacity-80" style={{ color: 'var(--primary-600)' }}>标准: 4.0% | 保守: 3.0-3.5%</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--primary-200)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--primary-600)' }}>所需投资组合规模:</p>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--primary-700)' }}>
                    RM {calculatedReverseTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <button
                    onClick={() => onUpdateGlobalSettings(calculatedReverseTarget)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-colors btn-primary"
                  >
                    <Target size={14} /> 应用到目标
                  </button>
                </div>
              </div>

              {/* Common - 通用设置 */}
              <div className="space-y-3 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>基础设置</h4>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>当前年龄</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.currentAge}
                      onChange={(e) => onUpdateSettings({ ...settings, currentAge: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                    <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>岁</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>通货膨胀率 (%)</label>
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
              <div className="space-y-3 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={14} /> 流动投资 (Liquid)
                </h4>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>月投入金额 (RM)</label>
                  <input
                    type="number"
                    value={settings.monthlyContribution}
                    onChange={(e) => onUpdateSettings({ ...settings, monthlyContribution: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>预期年化回报率 (%)</label>
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
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp size={20} className="text-emerald-500" /> 净值增长轨迹
            </h3>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            </div>
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
    </div>
  );
};

export default FireProjection;
