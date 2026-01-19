import React, { useMemo } from 'react';
import { YearlyRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface ReturnsComparisonChartProps {
    yearlyRecords: YearlyRecord[];
    isPrivacyMode: boolean;
}

const ReturnsComparisonChart: React.FC<ReturnsComparisonChartProps> = ({ yearlyRecords, isPrivacyMode }) => {
    const chartData = useMemo(() => {
        if (!yearlyRecords || yearlyRecords.length === 0) return [];

        // Sort records by year
        const sortedRecords = [...yearlyRecords].sort((a, b) => a.year - b.year);

        // Calculate portfolio returns (YoY net worth change)
        return sortedRecords.map((record, index) => {
            const total = record.investAmount + record.savingAmount + record.epfAmount;
            const prevRecord = index > 0 ? sortedRecords[index - 1] : null;
            let portfolioReturn = 0;

            if (prevRecord) {
                const prevTotal = prevRecord.investAmount + prevRecord.savingAmount + prevRecord.epfAmount;
                portfolioReturn = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
            }

            return {
                year: record.year,
                portfolioReturn: Math.round(portfolioReturn * 10) / 10,
                vooReturn: record.vooReturn ?? null,
            };
        }).filter((_, index) => index > 0); // Remove first year (no YoY data)
    }, [yearlyRecords]);

    if (chartData.length < 2) {
        return (
            <div
                className="p-6 rounded-2xl border h-[300px] flex items-center justify-center"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                }}
            >
                <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                    <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">需要至少 3 年的历史记录才能生成对比图</p>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="p-3 rounded-lg shadow-lg border text-sm"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                    }}
                >
                    <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{label}年</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-mono font-bold" style={{ color: entry.value >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>
                                {entry.value > 0 ? '+' : ''}{entry.value}%
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
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
                <TrendingUp size={20} className="text-blue-500" />
                收益率对比 (Portfolio vs VOO)
            </h3>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                        />
                        <Line
                            type="monotone"
                            dataKey="portfolioReturn"
                            name="您的组合"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 7, fill: '#3B82F6' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="vooReturn"
                            name="VOO (S&P 500)"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
                基于历史记录中的年度净资产变化计算
            </p>
        </div>
    );
};

export default ReturnsComparisonChart;
