import React, { useState, useEffect } from 'react';
import { GlobalSettings, FireProjectionSettings } from '../types';
import { Settings, Save, RefreshCw, DollarSign, PieChart, TrendingUp, Calendar, Target, Briefcase, Calculator } from 'lucide-react';

interface SettingsPageProps {
    settings: GlobalSettings;
    fireSettings: FireProjectionSettings;
    onUpdateSettings: (settings: GlobalSettings) => void;
    onUpdateFireSettings: (settings: FireProjectionSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    settings,
    fireSettings,
    onUpdateSettings,
    onUpdateFireSettings
}) => {
    // Local state for smoother inputs
    const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
    const [localFireSettings, setLocalFireSettings] = useState<FireProjectionSettings>(fireSettings);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
        setLocalFireSettings(fireSettings);
    }, [settings, fireSettings]);

    const handleGlobalChange = (key: keyof GlobalSettings, value: any) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        setHasChanges(true); // Can also auto-save if preferred
        // Auto-save logic
        onUpdateSettings(newSettings);
    };

    const handleFireChange = (key: keyof FireProjectionSettings, value: any) => {
        const newSettings = { ...localFireSettings, [key]: value };
        setLocalFireSettings(newSettings);
        setHasChanges(true);
        // Auto-save logic
        onUpdateFireSettings(newSettings);
    };

    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - localFireSettings.birthYear;

    const sectionStyle = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        backdropFilter: 'blur(12px)'
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                        <Settings className="text-blue-500" size={32} />
                        设置中心
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        统一管理您的个人参数、财务目标和系统配置
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. 个人档案 (Personal Profile) */}
                <div className="p-6 rounded-2xl shadow-lg border" style={sectionStyle}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Calendar size={20} className="text-indigo-500" /> 个人档案
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label">出生年份 (Birth Year)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1950"
                                    max={currentYear}
                                    value={localFireSettings.birthYear}
                                    onChange={(e) => handleFireChange('birthYear', parseInt(e.target.value) || 1990)}
                                    className="input flex-1"
                                />
                                <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 font-bold text-indigo-400 min-w-[80px] text-center">
                                    {currentAge} 岁
                                </div>
                            </div>
                            <p className="text-xs mt-1.5 opacity-60" style={{ color: 'var(--text-muted)' }}>
                                系统将根据出生年份自动计算您的当前年龄，用于 FIRE 推演。
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. 系统参数 (System Params) */}
                <div className="p-6 rounded-2xl shadow-lg border" style={sectionStyle}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <RefreshCw size={20} className="text-emerald-500" /> 系统参数
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label">USD / MYR 汇率</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localSettings.exchangeRateUsdMyr}
                                    onChange={(e) => handleGlobalChange('exchangeRateUsdMyr', parseFloat(e.target.value))}
                                    className="input !pl-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">预估股息收益率 (Dividend Yield)</label>
                            <div className="relative">
                                <PieChart size={16} className="absolute left-3 top-3 text-slate-500" />
                                <input
                                    type="number"
                                    step="0.1"
                                    value={localSettings.dividendYieldPercent || 0}
                                    onChange={(e) => handleGlobalChange('dividendYieldPercent', parseFloat(e.target.value))}
                                    className="input !pl-12"
                                />
                                <span className="absolute right-3 top-2.5 font-bold text-slate-500">%</span>
                            </div>
                            <p className="text-xs mt-1.5 opacity-60" style={{ color: 'var(--text-muted)' }}>
                                用于估算 Dashboard 上的被动收入。
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. 财务目标 (Financial Goals) */}
                <div className="p-6 rounded-2xl shadow-lg border md:col-span-2" style={sectionStyle}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Target size={20} className="text-rose-500" /> 财务目标
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">财务自由目标 (FIRE Number)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    step="1000"
                                    value={localSettings.financialFreedomTarget}
                                    onChange={(e) => handleGlobalChange('financialFreedomTarget', parseFloat(e.target.value))}
                                    className="input !pl-20 font-bold text-lg"
                                    style={{ color: 'var(--primary-500)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">年度储蓄目标 (Saving Target)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    step="1000"
                                    value={localSettings.savingTarget}
                                    onChange={(e) => handleGlobalChange('savingTarget', parseFloat(e.target.value))}
                                    className="input !pl-20"
                                />
                            </div>
                        </div>
                        {/* Reverse FIRE Settings */}
                        <div>
                            <label className="label">理想月支出 (Desired Monthly Spending)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    value={localFireSettings.desiredMonthlySpending}
                                    onChange={(e) => handleFireChange('desiredMonthlySpending', parseFloat(e.target.value))}
                                    className="input !pl-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">安全提款率 (SWR)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={localFireSettings.withdrawalRate || 4.0}
                                    onChange={(e) => handleFireChange('withdrawalRate', parseFloat(e.target.value))}
                                    className="input pr-10"
                                />
                                <span className="absolute right-3 top-2.5 font-bold text-slate-500">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Investment Targets - 投资目标 */}
                    <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>投资目标追踪</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label min-h-[48px] flex items-end pb-1">月度投资目标</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                    <input
                                        type="number"
                                        step="100"
                                        value={localSettings.monthlyInvestmentTarget || 0}
                                        onChange={(e) => handleGlobalChange('monthlyInvestmentTarget', parseFloat(e.target.value))}
                                        className="input !pl-20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label min-h-[48px] flex items-end pb-1">年度投资目标</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                    <input
                                        type="number"
                                        step="1000"
                                        value={localSettings.annualInvestmentTarget || 0}
                                        onChange={(e) => handleGlobalChange('annualInvestmentTarget', parseFloat(e.target.value))}
                                        className="input !pl-20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. FIRE 推演假设 (Projection Assumptions) */}
                <div className="p-6 rounded-2xl shadow-lg border md:col-span-2" style={sectionStyle}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={20} className="text-orange-500" /> FIRE 推演假设
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label min-h-[48px] flex items-end pb-1">年化投资回报率 (Return Rate)</label>
                            <input
                                type="number" step="0.1"
                                value={localFireSettings.annualReturnPercent}
                                onChange={(e) => handleFireChange('annualReturnPercent', parseFloat(e.target.value))}
                                className="input"
                            />
                            <p className="note">流动资产的预期年华回报率</p>
                        </div>
                        <div>
                            <label className="label min-h-[48px] flex items-end pb-1">EPF 年化回报率</label>
                            <input
                                type="number" step="0.1"
                                value={localFireSettings.epfAnnualReturnPercent}
                                onChange={(e) => handleFireChange('epfAnnualReturnPercent', parseFloat(e.target.value))}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label min-h-[48px] flex items-end pb-1">通货膨胀率 (Inflation)</label>
                            <input
                                type="number" step="0.1"
                                value={localFireSettings.inflationPercent}
                                onChange={(e) => handleFireChange('inflationPercent', parseFloat(e.target.value))}
                                className="input"
                            />
                            <p className="note">用于计算“实际”回报率</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label min-h-[48px] flex items-end pb-1">每月额外投资 (Liquid Contribution)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    value={localFireSettings.monthlyContribution}
                                    onChange={(e) => handleFireChange('monthlyContribution', parseFloat(e.target.value))}
                                    className="input !pl-20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label min-h-[48px] flex items-end pb-1">每月 EPF 缴纳 (Emp + Self)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 font-bold text-slate-500">RM</span>
                                <input
                                    type="number"
                                    value={localFireSettings.epfMonthlyContribution}
                                    onChange={(e) => handleFireChange('epfMonthlyContribution', parseFloat(e.target.value))}
                                    className="input !pl-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
