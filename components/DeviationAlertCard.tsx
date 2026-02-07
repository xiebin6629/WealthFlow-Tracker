import React, { useMemo } from 'react';
import { ComputedAsset } from '../types';
import { AlertTriangle, CheckCircle2, ArrowUpCircle, ArrowDownCircle, Target } from 'lucide-react';

interface DeviationAlertProps {
    assets: ComputedAsset[];
    isPrivacyMode: boolean;
    threshold?: number; // Default 5%
}

interface DeviationItem {
    asset: ComputedAsset;
    currentWeight: number;
    targetWeight: number;
    deviation: number;
    severity: 'ok' | 'warning' | 'critical';
    action: 'BUY' | 'SELL' | 'HOLD';
}

const DeviationAlertCard: React.FC<DeviationAlertProps> = ({
    assets,
    isPrivacyMode,
    threshold = 5
}) => {
    const investmentAssets = useMemo(() => {
        return assets.filter(a =>
            ['ETF', 'Stock', 'Crypto', 'Cash (Investment)'].includes(a.category) &&
            a.targetAllocation > 0
        );
    }, [assets]);

    const totalValue = useMemo(() => {
        return investmentAssets.reduce((sum, a) => sum + a.currentValueMyr, 0);
    }, [investmentAssets]);

    const deviations: DeviationItem[] = useMemo(() => {
        if (totalValue === 0) return [];

        return investmentAssets.map(asset => {
            const currentWeight = (asset.currentValueMyr / totalValue) * 100;
            const targetWeight = asset.targetAllocation;
            const deviation = currentWeight - targetWeight;
            const absDeviation = Math.abs(deviation);

            let severity: 'ok' | 'warning' | 'critical' = 'ok';
            if (absDeviation >= threshold * 2) {
                severity = 'critical';
            } else if (absDeviation >= threshold) {
                severity = 'warning';
            }

            let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
            if (deviation < -threshold) {
                action = 'BUY';
            } else if (deviation > threshold) {
                action = 'SELL';
            }

            return {
                asset,
                currentWeight,
                targetWeight,
                deviation,
                severity,
                action
            };
        }).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
    }, [investmentAssets, totalValue, threshold]);

    const criticalCount = deviations.filter(d => d.severity === 'critical').length;
    const warningCount = deviations.filter(d => d.severity === 'warning').length;
    const isBalanced = criticalCount === 0 && warningCount === 0;

    if (investmentAssets.length === 0) return null;

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'var(--danger-500)';
            case 'warning': return 'var(--warning-500)';
            default: return 'var(--success-500)';
        }
    };

    const getActionBadge = (action: string, severity: string) => {
        if (action === 'HOLD') {
            return (
                <span className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap flex-shrink-0" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                    ✓ 平衡
                </span>
            );
        }
        if (action === 'BUY') {
            return (
                <span className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                    <ArrowUpCircle size={12} /> 加仓
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0" style={{ background: 'var(--danger-50)', color: 'var(--danger-600)' }}>
                <ArrowDownCircle size={12} /> 减仓
            </span>
        );
    };

    return (
        <div
            className="p-6 rounded-2xl border"
            style={{
                background: 'var(--card-bg)',
                border: `1px solid ${isBalanced ? 'var(--success-400)' : criticalCount > 0 ? 'var(--danger-400)' : 'var(--warning-400)'}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Target size={20} className="text-blue-500" />
                    资产配置偏离度
                </h3>
                <div className="flex items-center gap-2">
                    {isBalanced ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                            <CheckCircle2 size={16} />
                            配置均衡
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: criticalCount > 0 ? 'var(--danger-50)' : 'var(--warning-50)', color: criticalCount > 0 ? 'var(--danger-600)' : 'var(--warning-600)' }}>
                            <AlertTriangle size={16} />
                            {criticalCount > 0 ? `${criticalCount} 项严重偏离` : `${warningCount} 项需关注`}
                        </div>
                    )}
                </div>
            </div>

            {/* Deviation List */}
            <div className="space-y-2">
                {deviations.map((item) => (
                    <div
                        key={item.asset.id}
                        className="flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.01]"
                        style={{
                            background: 'var(--bg-tertiary)',
                            borderLeft: `4px solid ${getSeverityColor(item.severity)}`
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.asset.symbol}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.asset.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Current vs Target */}
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-sm">
                                    <span style={{ color: 'var(--text-muted)' }}>现:</span>
                                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {item.currentWeight.toFixed(1)}%
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <span style={{ color: 'var(--text-muted)' }}>目:</span>
                                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                                        {item.targetWeight.toFixed(0)}%
                                    </span>
                                </div>
                                <p className="text-xs font-mono" style={{ color: getSeverityColor(item.severity) }}>
                                    {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}% 偏离
                                </p>
                            </div>

                            {/* Action Badge */}
                            {getActionBadge(item.action, item.severity)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Threshold Info */}
            <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                警告阈值: ±{threshold}% | 严重阈值: ±{threshold * 2}%
            </p>
        </div>
    );
};

export default DeviationAlertCard;
