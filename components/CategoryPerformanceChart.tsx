import React, { useMemo } from 'react';
import { ComputedAsset } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface CategoryPerformanceChartProps {
    assets: ComputedAsset[];
    isPrivacyMode: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    'ETF': '#3B82F6',
    'Stock': '#10B981',
    'Crypto': '#F59E0B',
    'Cash (Investment)': '#6366F1',
    'Cash (Saving)': '#8B5CF6',
    'Pension': '#EC4899',
    'Money Market Fund': '#14B8A6'
};

const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({
    assets,
    isPrivacyMode
}) => {
    const data = useMemo(() => {
        const categoryData: Record<string, { value: number; cost: number; count: number }> = {};

        assets.forEach(asset => {
            const category = asset.category;
            if (!categoryData[category]) {
                categoryData[category] = { value: 0, cost: 0, count: 0 };
            }
            categoryData[category].value += asset.currentValueMyr;
            categoryData[category].cost += asset.totalCostMyr;
            categoryData[category].count += 1;
        });

        return Object.entries(categoryData)
            .map(([category, data]) => {
                const profitLoss = data.value - data.cost;
                const profitLossPercent = data.cost > 0 ? (profitLoss / data.cost) * 100 : 0;

                return {
                    category,
                    value: Math.round(data.value),
                    cost: Math.round(data.cost),
                    profitLoss: Math.round(profitLoss),
                    profitLossPercent: Math.round(profitLossPercent * 10) / 10,
                    count: data.count,
                    color: CATEGORY_COLORS[category] || '#64748B'
                };
            })
            .filter(d => d.value > 0)
            .sort((a, b) => b.profitLoss - a.profitLoss);
    }, [assets]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div
                    className="p-3 rounded-lg shadow-lg border text-sm"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                    }}
                >
                    <p className="font-bold mb-2" style={{ color: item.color }}>{item.category}</p>
                    <div className="space-y-1">
                        <p style={{ color: 'var(--text-secondary)' }}>
                            市值: {isPrivacyMode ? '****' : `RM ${item.value.toLocaleString()}`}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            成本: {isPrivacyMode ? '****' : `RM ${item.cost.toLocaleString()}`}
                        </p>
                        <p style={{ color: item.profitLoss >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>
                            盈亏: {isPrivacyMode ? '****' : `${item.profitLoss >= 0 ? '+' : ''}RM ${item.profitLoss.toLocaleString()}`}
                        </p>
                        <p style={{ color: item.profitLossPercent >= 0 ? 'var(--success-500)' : 'var(--danger-500)', fontSize: '0.75rem' }}>
                            收益率: {item.profitLossPercent > 0 ? '+' : ''}{item.profitLossPercent}%
                        </p>
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        {item.count} 个资产
                    </p>
                </div>
            );
        }
        return null;
    };

    if (data.length === 0) return null;

    return (
        <div
            className="p-6 rounded-2xl border"
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
            }}
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BarChart3 size={20} className="text-emerald-500" />
                资产类别表现对比 (盈亏额)
            </h3>

            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
                        />
                        <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            width={75}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="profitLoss" radius={[0, 4, 4, 0]} animationDuration={800}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.profitLoss >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Best & Worst Performers */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg" style={{ background: 'var(--success-50)' }}>
                    <p className="text-xs font-bold uppercase" style={{ color: 'var(--success-600)' }}>最佳表现</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--success-700)' }}>
                        {data[0]?.category}
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--success-600)' }}>
                        {isPrivacyMode ? '****' : `+RM ${data[0]?.profitLoss.toLocaleString()}`}
                    </p>
                </div>
                {data.length > 1 && data[data.length - 1].profitLoss < data[0].profitLoss && (
                    <div className="p-3 rounded-lg" style={{ background: data[data.length - 1].profitLoss < 0 ? 'var(--danger-50)' : 'var(--bg-tertiary)' }}>
                        <p className="text-xs font-bold uppercase" style={{ color: data[data.length - 1].profitLoss < 0 ? 'var(--danger-600)' : 'var(--text-muted)' }}>
                            {data[data.length - 1].profitLoss < 0 ? '最差表现' : '最低收益'}
                        </p>
                        <p className="text-lg font-bold" style={{ color: data[data.length - 1].profitLoss < 0 ? 'var(--danger-700)' : 'var(--text-secondary)' }}>
                            {data[data.length - 1]?.category}
                        </p>
                        <p className="text-sm font-mono" style={{ color: data[data.length - 1].profitLoss < 0 ? 'var(--danger-600)' : 'var(--text-muted)' }}>
                            {isPrivacyMode ? '****' : `${data[data.length - 1]?.profitLoss > 0 ? '+' : ''}RM ${data[data.length - 1]?.profitLoss.toLocaleString()}`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPerformanceChart;
