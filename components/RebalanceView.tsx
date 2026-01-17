
import React, { useMemo } from 'react';
import { ComputedAsset, RebalanceAction } from '../types';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface RebalanceViewProps {
  assets: ComputedAsset[];
  exchangeRate: number;
  isPrivacyMode: boolean;
}

const RebalanceView: React.FC<RebalanceViewProps> = ({ assets, exchangeRate, isPrivacyMode }) => {
  // Logic: Cash Injection is now handled by looking for "Cash (Investment)" type assets with 0% target.
  // We sum up the current value of all assets. If there is cash with 0% target, it contributes to the total value
  // but its target value is 0, so the difference is negative (SELL), which effectively means "Use this cash to buy".

  const actions: RebalanceAction[] = useMemo(() => {
    // 1. Calculate Total Portfolio Value
    const currentTotalValue = assets.reduce((sum, a) => sum + a.currentValueMyr, 0);

    return assets.map(asset => {
      // 2. Determine Target Value based on Total Value
      const targetValueMyr = currentTotalValue * (asset.targetAllocation / 100);
      
      // 3. Calculate Difference
      const diffMyr = targetValueMyr - asset.currentValueMyr;
      
      // 4. Determine Action
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      // Threshold
      if (diffMyr > 50) action = 'BUY';
      else if (diffMyr < -50) action = 'SELL';

      // 5. Calculate USD specifics
      const isUsd = asset.currency === 'USD';
      const usdAmount = isUsd ? Math.abs(diffMyr / exchangeRate) : undefined;
      
      // Prevent division by zero if price is missing
      const price = asset.currentPrice || 1; 
      const amountUnits = isUsd 
        ? (usdAmount! / price)
        : (Math.abs(diffMyr) / price);

      return {
        symbol: asset.symbol,
        action,
        amountMyr: Math.abs(diffMyr),
        amountUnits,
        currentWeight: asset.currentAllocationPercent,
        targetWeight: asset.targetAllocation,
        isUsd,
        usdAmount
      };
    })
    .filter(a => a.action !== 'HOLD') // Only show actionable items
    .sort((a, b) => {
      // Primary Sort: Action Priority (BUY > SELL)
      const score = (x: string) => (x === 'BUY' ? 2 : x === 'SELL' ? 1 : 0);
      const priorityDiff = score(b.action) - score(a.action);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary Sort: Amount (Descending)
      return b.amountMyr - a.amountMyr;
    });
  }, [assets, exchangeRate]);

  if (actions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-blue-100 flex justify-between items-center bg-white/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw size={20} className="text-blue-600"/> Rebalance Action Plan
        </h3>
        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
          {actions.length} Actions
        </span>
      </div>
      
      <div className="divide-y divide-blue-100/50">
        {actions.map((item) => (
          <div key={item.symbol} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between hover:bg-white/60 transition-colors">
            
            {/* Asset */}
            <div className="flex items-center gap-4 w-full md:w-1/3 mb-2 md:mb-0">
              <div className={`w-2 h-10 rounded-full ${item.action === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{item.symbol}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{item.currentWeight.toFixed(1)}%</span>
                  <ArrowRight size={12} className="text-slate-300"/>
                  <span className="font-semibold text-slate-700">{item.targetWeight}%</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="w-full md:w-1/3 flex justify-start md:justify-center mb-2 md:mb-0">
              <span className={`
                px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide uppercase
                ${item.action === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
              `}>
                {item.action}
              </span>
            </div>

            {/* Amount */}
            <div className="w-full md:w-1/3 text-left md:text-right">
              <div className="font-bold text-slate-900 text-lg">
                {item.isUsd ? '$' : 'RM'}
                {isPrivacyMode ? '****' : (item.isUsd ? item.usdAmount! : item.amountMyr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500">
                ~{item.amountUnits.toFixed(2)} units
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RebalanceView;
