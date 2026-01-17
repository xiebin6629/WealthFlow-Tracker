
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
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-xl text-sm z-50 min-w-[200px]">
        <p className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">
           Age {label} <span className="text-slate-400 font-normal ml-1">({data.year})</span>
        </p>
        
        <div className="space-y-2">
           {/* Total Net Worth Highlight */}
           <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-slate-700">Total Net Worth</span>
            <span className="font-extrabold text-slate-900 text-base">
              {isPrivacyMode ? '****' : `RM ${data.total.toLocaleString()}`}
            </span>
          </div>

          {/* Breakdown */}
          <div className="bg-slate-50 p-2 rounded-lg space-y-1.5 mt-1">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Liquid
                </span>
                <span className="font-mono text-slate-600">
                  {isPrivacyMode ? '****' : `RM ${data.liquid.toLocaleString()}`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> EPF
                </span>
                <span className="font-mono text-slate-600">
                  {isPrivacyMode ? '****' : `RM ${data.epf.toLocaleString()}`}
                </span>
              </div>
          </div>
          
          <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
             <span>FIRE Target</span>
             <span>{isPrivacyMode ? '****' : `RM ${data.target.toLocaleString()}`}</span>
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
        
        {/* Input Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600"/> Calculator Inputs
            </h3>
            
            <div className="space-y-6">
              {/* Reverse FIRE Calculator */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                 <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-3">
                   <Calculator size={14} /> Reverse FIRE Calculator
                 </h4>
                 <div className="space-y-3">
                   <div>
                      <label className="block text-sm font-semibold text-emerald-900 mb-1">Desired Monthly Spending</label>
                      <input 
                        type="number"
                        value={settings.desiredMonthlySpending || ''}
                        placeholder="e.g. 5000"
                        onChange={(e) => onUpdateSettings({...settings, desiredMonthlySpending: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-emerald-900 mb-1">Safe Withdrawal Rate (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={settings.withdrawalRate || ''}
                        placeholder="4.0"
                        onChange={(e) => onUpdateSettings({...settings, withdrawalRate: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm bg-white"
                      />
                      <p className="text-[10px] text-emerald-600 mt-1">Standard: 4.0% | Conservative: 3.0-3.5%</p>
                   </div>
                 </div>
                 <div className="mt-3 pt-3 border-t border-emerald-200/50">
                    <p className="text-xs text-emerald-600 mb-1">Required Portfolio Size:</p>
                    <p className="text-lg font-extrabold text-emerald-800">
                      RM {calculatedReverseTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <button 
                      onClick={() => onUpdateGlobalSettings(calculatedReverseTarget)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                    >
                      <Target size={14} /> Apply to Target
                    </button>
                 </div>
              </div>

              {/* Common */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">General</h4>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Current Age</label>
                  <div className="flex items-center">
                    <input 
                      type="number"
                      value={settings.currentAge}
                      onChange={(e) => onUpdateSettings({...settings, currentAge: parseInt(e.target.value) || 0})}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    />
                    <span className="ml-2 text-slate-500 text-sm">years</span>
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Inflation Rate (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={settings.inflationPercent}
                    onChange={(e) => onUpdateSettings({...settings, inflationPercent: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Personal Liquid Investment */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={14}/> Liquid Investment
                </h4>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Monthly Contribution (RM)</label>
                  <input 
                    type="number"
                    value={settings.monthlyContribution}
                    onChange={(e) => onUpdateSettings({...settings, monthlyContribution: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Est. Return Rate (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={settings.annualReturnPercent}
                    onChange={(e) => onUpdateSettings({...settings, annualReturnPercent: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* EPF / Pension */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase size={14}/> EPF / Pension
                </h4>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    Monthly (Employer + Self)
                    {portfolioPensionConfig && (
                      <button 
                        onClick={() => onUpdateSettings({...settings, epfMonthlyContribution: portfolioPensionConfig.monthlyContribution})}
                        className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                        title={`Sync RM ${portfolioPensionConfig.monthlyContribution} from Portfolio`}
                      >
                        <RefreshCw size={12} /> Sync
                      </button>
                    )}
                  </label>
                  <input 
                    type="number"
                    value={settings.epfMonthlyContribution}
                    onChange={(e) => onUpdateSettings({...settings, epfMonthlyContribution: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Est. Dividend Rate (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={settings.epfAnnualReturnPercent}
                    onChange={(e) => onUpdateSettings({...settings, epfAnnualReturnPercent: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
           {/* Key Results */}
           <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">Projection Results</h4>
              
              {/* Result 1: With EPF */}
              <div className="flex justify-between items-center">
                 <div>
                   <p className="text-indigo-400 text-xs font-bold uppercase">Total (With EPF)</p>
                   <p className="text-slate-400 text-xs mt-0.5">Reach Target</p>
                 </div>
                 <div className="text-right">
                    <h3 className="text-2xl font-bold">{reachedFireTotalData ? reachedFireTotalData.age : 'N/A'}</h3>
                    <p className="text-slate-400 text-xs">Years Old</p>
                 </div>
              </div>

              {/* Result 2: Liquid Only */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                 <div>
                   <p className="text-blue-400 text-xs font-bold uppercase">Liquid Only</p>
                   <p className="text-slate-400 text-xs mt-0.5">Reach Target</p>
                 </div>
                 <div className="text-right">
                    <h3 className="text-2xl font-bold">{reachedFireLiquidData ? reachedFireLiquidData.age : '100+'}</h3>
                    <p className="text-slate-400 text-xs">Years Old</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Charts & Milestones Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           {/* Chart */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col min-h-[400px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-500"/> Net Worth Trajectory
              </h3>
              
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorEpf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="age" 
                      label={{ value: 'Age', position: 'insideBottomRight', offset: -5 }} 
                      tick={{fill: '#64748b'}}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                      tick={{fill: '#64748b'}}
                      tickLine={false}
                      domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} />
                    <ReferenceLine y={fireTarget} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', position: 'insideTopRight', fill: '#10b981', fontSize: 12 }} />
                    
                    {/* Stacked Areas: Liquid on Bottom, EPF on Top */}
                    <Area 
                      type="monotone" 
                      dataKey="liquid" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="url(#colorLiquid)" 
                      name="liquid"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="epf" 
                      stackId="1" 
                      stroke="#6366f1" 
                      fill="url(#colorEpf)" 
                      name="epf"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">Liquid Assets</span>
                </div>
                 <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-slate-600">EPF / Pension</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-dashed border-emerald-500"></div>
                  <span className="text-slate-600">FIRE Target</span>
                </div>
              </div>
           </div>

           {/* Milestone Roadmap */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Flag size={20} className="text-orange-500"/> Financial Milestones Roadmap
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {milestoneProjections.map((m, idx) => (
                    <div 
                      key={m.goal} 
                      className={`
                        relative p-4 rounded-xl border transition-all duration-300
                        ${m.isAchieved 
                          ? 'bg-emerald-50 border-emerald-200 shadow-inner' 
                          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                           Milestone {idx + 1}
                         </span>
                         {m.isAchieved ? (
                           <CheckCircle2 size={16} className="text-emerald-500" />
                         ) : (
                           <Clock size={16} className="text-blue-400" />
                         )}
                      </div>
                      
                      <div className={`text-xl font-extrabold mb-3 ${m.isAchieved ? 'text-emerald-700' : 'text-slate-800'}`}>
                         {isPrivacyMode ? 'RM ****' : (m.goal >= 1000000 ? `RM ${m.goal/1000000}M` : `RM ${m.goal/1000}k`)}
                      </div>
                      
                      {m.isAchieved ? (
                        <div className="text-xs font-semibold text-emerald-600 bg-emerald-100 inline-block px-2 py-1 rounded-full">
                           ACHIEVED
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                           <div className="flex flex-col">
                             <span className="text-[10px] text-slate-400 uppercase">Year</span>
                             <span className="font-bold text-slate-700">{m.data ? m.data.year : '> 100'}</span>
                           </div>
                           <div className="w-px h-6 bg-slate-200"></div>
                           <div className="flex flex-col text-right">
                             <span className="text-[10px] text-slate-400 uppercase">Age</span>
                             <span className="font-bold text-slate-700">{m.data ? m.data.age : 'N/A'}</span>
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
