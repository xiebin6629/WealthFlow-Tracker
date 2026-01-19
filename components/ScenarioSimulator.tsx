import React, { useState, useMemo } from 'react';
import { FireProjectionSettings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, Sliders, Play, RotateCcw } from 'lucide-react';

interface ScenarioSimulatorProps {
    baseSettings: FireProjectionSettings;
    currentLiquidNetWorth: number;
    currentEpfNetWorth: number;
    fireTarget: number;
    isPrivacyMode: boolean;
}

interface Scenario {
    id: string;
    name: string;
    color: string;
    monthlyContribution: number;
    annualReturnPercent: number;
    inflationPercent: number;
}

const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
    baseSettings,
    currentLiquidNetWorth,
    currentEpfNetWorth,
    fireTarget,
    isPrivacyMode
}) => {
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - baseSettings.birthYear;

    const [scenarios, setScenarios] = useState<Scenario[]>([
        {
            id: 'base',
            name: '基准情景',
            color: '#3B82F6',
            monthlyContribution: baseSettings.monthlyContribution,
            annualReturnPercent: baseSettings.annualReturnPercent,
            inflationPercent: baseSettings.inflationPercent
        },
        {
            id: 'optimistic',
            name: '乐观情景',
            color: '#10B981',
            monthlyContribution: baseSettings.monthlyContribution * 1.5,
            annualReturnPercent: baseSettings.annualReturnPercent + 2,
            inflationPercent: baseSettings.inflationPercent - 0.5
        },
        {
            id: 'conservative',
            name: '保守情景',
            color: '#F59E0B',
            monthlyContribution: baseSettings.monthlyContribution * 0.7,
            annualReturnPercent: baseSettings.annualReturnPercent - 2,
            inflationPercent: baseSettings.inflationPercent + 1
        }
    ]);

    const [customScenario, setCustomScenario] = useState({
        monthlyContribution: baseSettings.monthlyContribution,
        annualReturnPercent: baseSettings.annualReturnPercent,
        inflationPercent: baseSettings.inflationPercent
    });

    const [showCustom, setShowCustom] = useState(false);

    const projectScenario = (scenario: Scenario | typeof customScenario, years: number) => {
        let liquidBal = currentLiquidNetWorth;
        let epfBal = currentEpfNetWorth;
        const data = [];

        for (let i = 0; i <= years; i++) {
            data.push({
                age: currentAge + i,
                year: currentYear + i,
                total: Math.round(liquidBal + epfBal)
            });

            // Apply changes
            liquidBal += scenario.monthlyContribution * 12;
            epfBal += baseSettings.epfMonthlyContribution * 12;

            const realReturn = (scenario.annualReturnPercent - scenario.inflationPercent) / 100;
            const epfRealReturn = (baseSettings.epfAnnualReturnPercent - scenario.inflationPercent) / 100;

            liquidBal *= (1 + realReturn);
            epfBal *= (1 + epfRealReturn);
        }

        return data;
    };

    const chartData = useMemo(() => {
        const yearsToProject = 60 - currentAge;
        if (yearsToProject <= 0) return [];

        const baseData = projectScenario(scenarios[0], yearsToProject);
        const optimisticData = projectScenario(scenarios[1], yearsToProject);
        const conservativeData = projectScenario(scenarios[2], yearsToProject);
        const customData = showCustom ? projectScenario(customScenario, yearsToProject) : null;

        return baseData.map((item, index) => ({
            age: item.age,
            year: item.year,
            base: item.total,
            optimistic: optimisticData[index]?.total || 0,
            conservative: conservativeData[index]?.total || 0,
            custom: customData ? customData[index]?.total : undefined,
            target: fireTarget
        }));
    }, [scenarios, customScenario, showCustom, currentAge, currentLiquidNetWorth, currentEpfNetWorth, fireTarget, baseSettings]);

    // Find FIRE ages for each scenario
    const fireAges = useMemo(() => {
        const findFireAge = (key: 'base' | 'optimistic' | 'conservative' | 'custom') => {
            const point = chartData.find(d => d[key] && d[key]! >= fireTarget);
            return point ? point.age : null;
        };

        return {
            base: findFireAge('base'),
            optimistic: findFireAge('optimistic'),
            conservative: findFireAge('conservative'),
            custom: showCustom ? findFireAge('custom') : null
        };
    }, [chartData, fireTarget, showCustom]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="p-4 rounded-lg shadow-lg border text-sm"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                    }}
                >
                    <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{label} 岁</p>
                    <div className="space-y-1">
                        {payload.filter((p: any) => p.dataKey !== 'target').map((entry: any) => (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                                <span style={{ color: entry.color }}>{entry.name}</span>
                                <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {isPrivacyMode ? '****' : `RM ${entry.value?.toLocaleString()}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const resetCustom = () => {
        setCustomScenario({
            monthlyContribution: baseSettings.monthlyContribution,
            annualReturnPercent: baseSettings.annualReturnPercent,
            inflationPercent: baseSettings.inflationPercent
        });
    };

    return (
        <div
            className="p-6 rounded-2xl border"
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <TrendingUp size={20} className="text-purple-500" />
                    多情景 FIRE 模拟器
                </h3>
                <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: showCustom ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                        color: showCustom ? 'white' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    <Sliders size={16} />
                    自定义参数
                </button>
            </div>

            {/* Custom Scenario Controls */}
            {showCustom && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>自定义情景参数</h4>
                        <button
                            onClick={resetCustom}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <RotateCcw size={12} /> 重置
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>月投资 (RM)</label>
                            <input
                                type="number"
                                value={customScenario.monthlyContribution}
                                onChange={(e) => setCustomScenario({ ...customScenario, monthlyContribution: parseFloat(e.target.value) || 0 })}
                                className="input text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>年回报率 (%)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={customScenario.annualReturnPercent}
                                onChange={(e) => setCustomScenario({ ...customScenario, annualReturnPercent: parseFloat(e.target.value) || 0 })}
                                className="input text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>通胀率 (%)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={customScenario.inflationPercent}
                                onChange={(e) => setCustomScenario({ ...customScenario, inflationPercent: parseFloat(e.target.value) || 0 })}
                                className="input text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis
                            dataKey="age"
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            tickFormatter={(value) => `${value}岁`}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                            axisLine={{ stroke: 'var(--border-light)' }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine
                            y={fireTarget}
                            stroke="var(--danger-500)"
                            strokeDasharray="5 5"
                            label={{ value: 'FIRE 目标', fill: 'var(--danger-500)', fontSize: 11 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="conservative"
                            name="保守情景"
                            stroke="#F59E0B"
                            fill="url(#colorConservative)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="base"
                            name="基准情景"
                            stroke="#3B82F6"
                            fill="url(#colorBase)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="optimistic"
                            name="乐观情景"
                            stroke="#10B981"
                            fill="url(#colorOptimistic)"
                            strokeWidth={2}
                        />
                        {showCustom && (
                            <Area
                                type="monotone"
                                dataKey="custom"
                                name="自定义"
                                stroke="#8B5CF6"
                                fill="url(#colorCustom)"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* FIRE Age Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <p className="text-xs font-medium" style={{ color: '#3B82F6' }}>基准情景</p>
                    <p className="text-xl font-bold" style={{ color: '#3B82F6' }}>
                        {fireAges.base ? `${fireAges.base} 岁` : '60+'}
                    </p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <p className="text-xs font-medium" style={{ color: '#10B981' }}>乐观情景</p>
                    <p className="text-xl font-bold" style={{ color: '#10B981' }}>
                        {fireAges.optimistic ? `${fireAges.optimistic} 岁` : '60+'}
                    </p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <p className="text-xs font-medium" style={{ color: '#F59E0B' }}>保守情景</p>
                    <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                        {fireAges.conservative ? `${fireAges.conservative} 岁` : '60+'}
                    </p>
                </div>
                {showCustom && (
                    <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                        <p className="text-xs font-medium" style={{ color: '#8B5CF6' }}>自定义</p>
                        <p className="text-xl font-bold" style={{ color: '#8B5CF6' }}>
                            {fireAges.custom ? `${fireAges.custom} 岁` : '60+'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScenarioSimulator;
