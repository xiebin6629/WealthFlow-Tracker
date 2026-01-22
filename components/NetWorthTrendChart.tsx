import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { YearlyRecord } from '../types';
import { TrendingUp } from 'lucide-react';

interface NetWorthTrendChartProps {
    records: YearlyRecord[];
    isPrivacyMode: boolean;
}

const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({ records, isPrivacyMode }) => {
    const data = useMemo(() => {
        return [...records]
            .sort((a, b) => a.year - b.year)
            .map(rec => ({
                year: rec.year,
                total: rec.investAmount + rec.savingAmount + rec.epfAmount
            }));
    }, [records]);

    if (data.length === 0) {
        return (
            <div
                className="p-6 rounded-2xl shadow-lg border backdrop-blur-xl flex flex-col h-full items-center justify-center opacity-70"
                style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)'
                }}
            >
                <TrendingUp size={48} className="mb-2 text-slate-400" />
                <p className="text-sm text-slate-500">尚无历史数据</p>
                <p className="text-xs text-slate-400">请在 "History Log" 页面添加记录</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="p-3 rounded-lg shadow-xl border backdrop-blur-md"
                    style={{ background: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    <p className="font-bold text-white mb-1">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
                        {isPrivacyMode ? '****' : `RM ${payload[0].value.toLocaleString()}`}
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
                <TrendingUp size={20} className="text-emerald-500" /> 净值增长趋势
            </h3>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            hide={true}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                            offset={40}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default NetWorthTrendChart;
