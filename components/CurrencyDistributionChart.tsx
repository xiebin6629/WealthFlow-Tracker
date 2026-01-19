import React, { useMemo } from 'react';
import { ComputedAsset } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Globe } from 'lucide-react';

interface CurrencyDistributionChartProps {
    assets: ComputedAsset[];
    exchangeRate: number;
    isPrivacyMode: boolean;
}

const COLORS = {
    USD: '#3B82F6',
    MYR: '#10B981',
    OTHER: '#8B5CF6'
};

const CurrencyDistributionChart: React.FC<CurrencyDistributionChartProps> = ({
    assets,
    exchangeRate,
    isPrivacyMode
}) => {
    const data = useMemo(() => {
        const currencyTotals: Record<string, number> = {};

        assets.forEach(asset => {
            const valueMyr = asset.currentValueMyr;
            const currency = asset.currency;

            if (!currencyTotals[currency]) {
                currencyTotals[currency] = 0;
            }
            currencyTotals[currency] += valueMyr;
        });

        const total = Object.values(currencyTotals).reduce((a, b) => a + b, 0);

        return Object.entries(currencyTotals).map(([currency, value]) => ({
            name: currency,
            value: Math.round(value),
            percentage: total > 0 ? (value / total) * 100 : 0,
            color: COLORS[currency as keyof typeof COLORS] || COLORS.OTHER
        })).sort((a, b) => b.value - a.value);
    }, [assets]);

    const totalValue = data.reduce((sum, d) => sum + d.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
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
                    <p className="font-bold mb-1" style={{ color: item.color }}>{item.name}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isPrivacyMode ? '****' : `RM ${item.value.toLocaleString()}`}
                    </p>
                    <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.percentage.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Don't show label for very small slices

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-sm font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div
            className="p-6 rounded-2xl border"
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
            }}
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Globe size={20} className="text-indigo-500" />
                货币分布
            </h3>

            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={80}
                            innerRadius={40}
                            dataKey="value"
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {item.name}
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            ({item.percentage.toFixed(1)}%)
                        </span>
                    </div>
                ))}
            </div>

            {/* Risk Note */}
            {data.find(d => d.name === 'USD' && d.percentage > 70) && (
                <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                    ⚠️ 美元资产占比超过 70%，请注意汇率波动风险
                </div>
            )}
        </div>
    );
};

export default CurrencyDistributionChart;
