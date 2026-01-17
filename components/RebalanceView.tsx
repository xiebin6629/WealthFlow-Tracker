
import React, { useMemo } from 'react';
import { ComputedAsset, RebalanceAction } from '../types';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface RebalanceViewProps {
  assets: ComputedAsset[];
  exchangeRate: number;
  isPrivacyMode: boolean;
}

const RebalanceView: React.FC<RebalanceViewProps> = ({ assets, exchangeRate, isPrivacyMode }) => {
  // 逻辑: 现金注入现在通过查找 "Cash (Investment)" 类型且目标为 0% 的资产来处理。
  // 我们计算所有资产的当期总价值。如果存在目标为 0% 的现金，它会贡献到总价值，但其目标价值为 0，
  // 因此差额为负（卖出），这实际上意味着“使用这笔现金购买”。

  const actions: RebalanceAction[] = useMemo(() => {
    // 逻辑升级：支持 Asset Grouping (组合权重)
    // 1. 计算总投资组合价值
    const currentTotalValue = assets.reduce((sum, a) => sum + a.currentValueMyr, 0);

    const generatedActions: RebalanceAction[] = [];
    const processedAssetIds = new Set<string>();

    for (const asset of assets) {
      if (processedAssetIds.has(asset.id)) continue;

      let groupMembers = [asset];
      // 如果有 Group Name，找到所有组员
      if (asset.groupName) {
        groupMembers = assets.filter(a => a.groupName === asset.groupName);
      }

      // 标记已处理
      groupMembers.forEach(m => processedAssetIds.add(m.id));

      // 2. 计算组的合计数据
      const groupCurrentValue = groupMembers.reduce((sum, m) => sum + m.currentValueMyr, 0);
      const groupTargetPercent = groupMembers.reduce((sum, m) => sum + m.targetAllocation, 0);

      const groupTargetValue = currentTotalValue * (groupTargetPercent / 100);
      const groupDiff = groupTargetValue - groupCurrentValue;

      // 3. 分配差额给组员
      groupMembers.forEach(member => {
        let memberDiff = 0;

        if (groupTargetPercent > 0) {
          // 按目标权重比例分配
          // 例如: BTC(0%), IBIT(2%). Group(2%). Diff(+1000).
          // BTC Alloc = 0/2 * 1000 = 0.
          // IBIT Alloc = 2/2 * 1000 = 1000. -> Buy IBIT.
          // 这完美实现了 "不加仓 BTC，只买 IBIT" 的需求
          const weight = member.targetAllocation / groupTargetPercent;
          memberDiff = groupDiff * weight;
        } else {
          // 如果目标是 0%，则建议清仓 (或者如果这就是用户想要的 Hold，则逻辑正确导出 Sell)
          // 但通常 RebalanceView 只显示 Buy/Sell。如果 diff 是负数，就是 Sell。
          memberDiff = -member.currentValueMyr;
        }

        // 4. 生成操作
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        // 阈值 (RM 50)
        if (memberDiff > 50) action = 'BUY';
        else if (memberDiff < -50) action = 'SELL';

        if (action !== 'HOLD') {
          // 计算 USD
          const isUsd = member.currency === 'USD';
          const usdAmount = isUsd ? Math.abs(memberDiff / exchangeRate) : undefined;
          const price = member.currentPrice || 1;
          const amountUnits = isUsd
            ? (usdAmount! / price)
            : (Math.abs(memberDiff) / price);

          generatedActions.push({
            symbol: member.symbol,
            action,
            amountMyr: Math.abs(memberDiff),
            amountUnits,
            currentWeight: member.currentAllocationPercent,
            targetWeight: member.targetAllocation,
            isUsd,
            usdAmount
          });
        }
      });
    }

    return generatedActions.sort((a, b) => {
      // 主要排序: 操作优先级 (买入 > 卖出)
      const score = (x: string) => (x === 'BUY' ? 2 : x === 'SELL' ? 1 : 0);
      const priorityDiff = score(b.action) - score(a.action);
      if (priorityDiff !== 0) return priorityDiff;

      // 次要排序: 金额 (降序)
      return b.amountMyr - a.amountMyr;
    });
  }, [assets, exchangeRate]);

  if (actions.length === 0) return null;

  return (
    <div
      className="rounded-xl shadow-lg overflow-hidden mb-8 transition-all animate-fade-in"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)'
      }}
    >
      <div
        className="p-6 border-b flex justify-between items-center"
        style={{ borderColor: 'var(--border-light)', background: 'var(--bg-tertiary)' }}
      >
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <RefreshCw size={20} className="text-blue-500 animate-spin-slow" /> 再平衡行动计划
        </h3>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}
        >
          {actions.length} 项操作
        </span>
      </div>

      <div className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
        {actions.map((item) => (
          <div key={item.symbol} className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between hover:bg-opacity-50 transition-colors" style={{ hover: { background: 'var(--bg-tertiary)' } }}>

            {/* Asset */}
            <div className="flex items-center gap-4 w-full md:w-1/3 mb-2 md:mb-0">
              <div
                className="w-2 h-10 rounded-full"
                style={{ background: item.action === 'BUY' ? 'var(--success-500)' : 'var(--danger-500)' }}
              ></div>
              <div>
                <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{item.symbol}</h4>
                <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span>{item.currentWeight.toFixed(1)}%</span>
                  <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.targetWeight}%</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="w-full md:w-1/3 flex justify-start md:justify-center mb-2 md:mb-0">
              <span
                className="px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide uppercase"
                style={{
                  background: item.action === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: item.action === 'BUY' ? 'var(--success-600)' : 'var(--danger-600)'
                }}
              >
                {item.action === 'BUY' ? '买入' : '卖出'}
              </span>
            </div>

            {/* Amount */}
            <div className="w-full md:w-1/3 text-left md:text-right">
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {item.isUsd ? '$' : 'RM'}
                {isPrivacyMode ? '****' : (item.isUsd ? item.usdAmount! : item.amountMyr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                ~{item.amountUnits.toFixed(2)} 单位
              </div>
            </div>
          </div>
        ))}
      </div>
    </div >
  );
};

export default RebalanceView;
