import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ComputedAsset } from '../types';
import { PieChart as PieChartIcon, Layers } from 'lucide-react';

interface AllocationChartProps {
    assets: ComputedAsset[];
    isPrivacyMode: boolean;
}

const COLORS = {
    'Stock': '#3b82f6', // Blue
    'ETF': '#0ea5e9',   // Sky
    'Crypto': '#f59e0b', // Amber/Orange
    'Cash (Investment)': '#10b981', // Emerald
    'Cash (Saving)': '#059669',     // Darker Emerald
    'Money Market Fund': '#34d399', // Cyan/Green
    'Pension': '#6366f1', // Indigo
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const AllocationChart: React.FC<AllocationChartProps> = ({ assets, isPrivacyMode }) => {

    const data = useMemo(() => {
        const categoryMap: Record<string, number> = {};

        assets.forEach(asset => {
            // Group all Cash types if needed, or keep separate. Let's keep separate but maybe simplify visuals
            const category = asset.category;
            if (!categoryMap[category]) {
                categoryMap[category] = 0;
            }
            categoryMap[category] += asset.currentValueMyr;
        });

        return Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value); // Sort descending
    }, [assets]);

    const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

    // Custom Legend Renderer
    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs">
                {payload.map((entry: any, index: number) => {
                    const item = data.find(d => d.name === entry.value);
                    const percent = item ? (item.value / totalValue) * 100 : 0;
                    return (
                        <li key={`item-${index}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                <span style={{ color: 'var(--text-secondary)' }}>{entry.value}</span>
                            </div>
                            <span className="font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
                                {percent.toFixed(1)}%
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const percent = (d.value / totalValue) * 100;
            return (
                <div
                    className="p-3 rounded-lg shadow-xl border backdrop-blur-md"
                    style={{ background: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }} // Hardcoded dark style for tooltip for contrast
                >
                    <p className="font-bold text-white mb-1">{d.name}</p>
                    <p className="text-sm text-gray-300">
                        {isPrivacyMode ? '****' : `RM ${d.value.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-blue-400 mt-1 font-bold">
                        {percent.toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="p-6 rounded-2xl shadow-lg border backdrop-blur-xl flex flex-col h-full"
            style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
            }}
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PieChartIcon size={20} className="text-purple-500" /> 资产分布
            </h3>

            <div className="flex-1 min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={100}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={2}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={(COLORS as any)[entry.name] || '#94a3b8'}
                                    stroke="rgba(0,0,0,0.1)"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={renderLegend} verticalAlign="bottom" height={100} />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-12 text-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold tracking-widest block opacity-50" style={{ color: 'var(--text-primary)' }}>Total</span>
                </div>
            </div>
        </div>
    );
};

export default AllocationChart;
