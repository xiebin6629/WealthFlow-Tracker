import React, { useState, useMemo } from 'react';
import { Loan, ComputedLoan, LoanType } from '../types';
import { CreditCard, Plus, Trash2, Home, Car, GraduationCap, Wallet, HelpCircle, TrendingDown, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LoanTrackerProps {
    loans: Loan[];
    onAddLoan: (loan: Loan) => void;
    onUpdateLoan: (loan: Loan) => void;
    onDeleteLoan: (id: string) => void;
    isPrivacyMode: boolean;
}

const LOAN_TYPE_CONFIG: Record<LoanType, { label: string; icon: React.ReactNode; color: string }> = {
    house: { label: '房贷', icon: <Home size={18} />, color: '#64748B' },
    car: { label: '车贷', icon: <Car size={18} />, color: '#64748B' },
    education: { label: '教育贷款', icon: <GraduationCap size={18} />, color: '#64748B' },
    personal: { label: '个人贷款', icon: <Wallet size={18} />, color: '#64748B' },
    credit_card: { label: '信用卡', icon: <CreditCard size={18} />, color: '#64748B' },
    other: { label: '其他', icon: <HelpCircle size={18} />, color: '#64748B' },
};

// Helper function to calculate months between two dates
const monthsBetween = (startDate: string, endDate: Date): number => {
    const start = new Date(startDate);
    const end = endDate;

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();

    // If start day is after end day, subtract one month
    if (end.getDate() < start.getDate()) {
        months--;
    }

    return Math.max(0, months);
};

// Compute loan details including remaining balance
const computeLoan = (loan: Loan): ComputedLoan => {
    const now = new Date();
    const monthsPaid = Math.min(monthsBetween(loan.startDate, now), loan.tenureMonths);
    const monthsRemaining = Math.max(0, loan.tenureMonths - monthsPaid);
    const isCompleted = monthsRemaining === 0;

    const totalPaid = monthsPaid * loan.monthlyPayment;

    // Simple calculation (not amortized - for simplicity)
    // For accurate calculation, would need amortization schedule
    const monthlyInterestRate = loan.interestRatePercent / 100 / 12;
    const totalInterest = loan.principalAmount * monthlyInterestRate * loan.tenureMonths;
    const totalPayable = loan.principalAmount + totalInterest;
    const remainingBalance = Math.max(0, totalPayable - totalPaid);

    const progressPercent = loan.tenureMonths > 0
        ? (monthsPaid / loan.tenureMonths) * 100
        : 100;

    return {
        ...loan,
        monthsPaid,
        remainingBalance: Math.round(remainingBalance),
        totalPaid: Math.round(totalPaid),
        totalInterest: Math.round(totalInterest),
        progressPercent: Math.min(100, progressPercent),
        isCompleted,
        monthsRemaining,
    };
};

const LoanTracker: React.FC<LoanTrackerProps> = ({
    loans,
    onAddLoan,
    onUpdateLoan,
    onDeleteLoan,
    isPrivacyMode
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLoan, setNewLoan] = useState<Partial<Loan>>({
        name: '',
        type: 'personal',
        principalAmount: 0,
        interestRatePercent: 5,
        monthlyPayment: 0,
        startDate: new Date().toISOString().split('T')[0],
        tenureMonths: 12,
        note: ''
    });

    const computedLoans = useMemo(() => {
        return loans.map(computeLoan).sort((a, b) => b.remainingBalance - a.remainingBalance);
    }, [loans]);

    const totalDebt = useMemo(() => {
        return computedLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    }, [computedLoans]);

    const totalMonthlyPayment = useMemo(() => {
        return computedLoans
            .filter(l => !l.isCompleted)
            .reduce((sum, loan) => sum + loan.monthlyPayment, 0);
    }, [computedLoans]);

    const activeLoans = computedLoans.filter(l => !l.isCompleted);
    const completedLoans = computedLoans.filter(l => l.isCompleted);

    const handleAddLoan = () => {
        if (!newLoan.name || !newLoan.principalAmount || !newLoan.monthlyPayment) return;

        onAddLoan({
            id: Date.now().toString(),
            name: newLoan.name!,
            type: newLoan.type as LoanType,
            principalAmount: newLoan.principalAmount!,
            interestRatePercent: newLoan.interestRatePercent || 0,
            monthlyPayment: newLoan.monthlyPayment!,
            startDate: newLoan.startDate!,
            tenureMonths: newLoan.tenureMonths || 12,
            note: newLoan.note
        });

        setNewLoan({
            name: '',
            type: 'personal',
            principalAmount: 0,
            interestRatePercent: 5,
            monthlyPayment: 0,
            startDate: new Date().toISOString().split('T')[0],
            tenureMonths: 12,
            note: ''
        });
        setShowAddForm(false);
    };

    const formatCurrency = (amount: number) => {
        if (isPrivacyMode) return 'RM ****';
        return `RM ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    const getTypeConfig = (type: LoanType) => LOAN_TYPE_CONFIG[type] || LOAN_TYPE_CONFIG.other;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-3">
                    <TrendingDown className="text-red-500" size={28} />
                    贷款追踪
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    添加贷款
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>添加新贷款</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>贷款名称</label>
                            <input
                                type="text"
                                placeholder="如：汽车贷款"
                                value={newLoan.name || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>贷款类型</label>
                            <select
                                value={newLoan.type}
                                onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as LoanType })}
                                className="input"
                            >
                                {Object.entries(LOAN_TYPE_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>贷款金额 (RM)</label>
                            <input
                                type="number"
                                value={newLoan.principalAmount || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, principalAmount: parseFloat(e.target.value) || 0 })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>年利率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newLoan.interestRatePercent || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, interestRatePercent: parseFloat(e.target.value) || 0 })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>每月还款 (RM)</label>
                            <input
                                type="number"
                                value={newLoan.monthlyPayment || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, monthlyPayment: parseFloat(e.target.value) || 0 })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>贷款期限 (月)</label>
                            <input
                                type="number"
                                value={newLoan.tenureMonths || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, tenureMonths: parseInt(e.target.value) || 0 })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>开始日期</label>
                            <input
                                type="date"
                                value={newLoan.startDate || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, startDate: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>备注 (可选)</label>
                            <input
                                type="text"
                                placeholder="如：Bank Islam 分期付款"
                                value={newLoan.note || ''}
                                onChange={(e) => setNewLoan({ ...newLoan, note: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">取消</button>
                        <button
                            onClick={handleAddLoan}
                            className="btn btn-success"
                            disabled={!newLoan.name || !newLoan.principalAmount || !newLoan.monthlyPayment}
                        >
                            保存
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>总负债</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(totalDebt)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{activeLoans.length} 笔活跃贷款</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>每月总还款</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(totalMonthlyPayment)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>固定支出</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>已还清</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success-500)' }}>
                        {completedLoans.length} 笔
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        共 {loans.length} 笔贷款
                    </p>
                </div>
            </div>

            {/* Active Loans */}
            {activeLoans.length > 0 && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <AlertTriangle size={20} className="text-orange-500" />
                        进行中的贷款
                    </h3>
                    <div className="space-y-4">
                        {activeLoans.map(loan => {
                            const config = getTypeConfig(loan.type);
                            return (
                                <div
                                    key={loan.id}
                                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                {config.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{loan.name}</h4>
                                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{config.label}</span>
                                                    <span>{loan.interestRatePercent}% 年利率</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteLoan(loan.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>剩余本金</p>
                                            <p className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                                                {formatCurrency(loan.remainingBalance)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>每月还款</p>
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {formatCurrency(loan.monthlyPayment)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>进度</p>
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {loan.monthsPaid} <span className="text-sm font-normal text-slate-400">/ {loan.tenureMonths} 月</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>剩余时间</p>
                                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {loan.monthsRemaining} <span className="text-sm font-normal text-slate-400">月</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <span>还款进度</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{loan.progressPercent.toFixed(0)}%</span>
                                        </div>
                                        <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out bg-blue-600 dark:bg-blue-500"
                                                style={{ width: `${loan.progressPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
                                            <span>已付 {formatCurrency(loan.totalPaid)}</span>
                                            <span>总额 {formatCurrency(loan.remainingBalance + loan.totalPaid)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completed Loans */}
            {completedLoans.length > 0 && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--success-400)' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={20} className="text-green-500" />
                        已还清的贷款
                    </h3>
                    <div className="space-y-2">
                        {completedLoans.map(loan => {
                            const config = getTypeConfig(loan.type);
                            return (
                                <div
                                    key={loan.id}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ background: 'var(--success-50)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div style={{ color: config.color }}>{config.icon}</div>
                                        <div>
                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{loan.name}</span>
                                            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                                                原贷款 {formatCurrency(loan.principalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--success-100)', color: 'var(--success-600)' }}>
                                            已还清
                                        </span>
                                        <button
                                            onClick={() => onDeleteLoan(loan.id)}
                                            className="p-1 rounded hover:bg-red-100 transition-colors"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {loans.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                    <p>暂无贷款记录</p>
                    <p className="text-sm mt-1">点击"添加贷款"开始追踪您的负债</p>
                </div>
            )}
        </div>
    );
};

export default LoanTracker;
