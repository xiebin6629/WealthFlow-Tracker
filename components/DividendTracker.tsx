import React, { useState, useMemo } from 'react';
import { DividendRecord } from '../types';
import { DollarSign, Plus, Trash2, TrendingUp, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DividendTrackerProps {
    records: DividendRecord[];
    onAddRecord: (record: DividendRecord) => void;
    onDeleteRecord: (id: string) => void;
    exchangeRate: number;
    isPrivacyMode: boolean;
}

const DividendTracker: React.FC<DividendTrackerProps> = ({
    records,
    onAddRecord,
    onDeleteRecord,
    exchangeRate,
    isPrivacyMode
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRecord, setNewRecord] = useState({
        date: new Date().toISOString().split('T')[0],
        symbol: '',
        amount: 0,
        currency: 'USD' as 'USD' | 'MYR',
        note: ''
    });
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    const filteredRecords = useMemo(() => {
        return records
            .filter(r => new Date(r.date).getFullYear() === filterYear)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, filterYear]);

    const yearlyStats = useMemo(() => {
        const yearMap: Record<number, number> = {};
        records.forEach(r => {
            const year = new Date(r.date).getFullYear();
            if (!yearMap[year]) yearMap[year] = 0;
            yearMap[year] += r.amountMyr;
        });

        return Object.entries(yearMap)
            .map(([year, total]) => ({ year: parseInt(year), total: Math.round(total) }))
            .sort((a, b) => a.year - b.year);
    }, [records]);

    const monthlyData = useMemo(() => {
        const monthMap: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        months.forEach((m, i) => {
            monthMap[m] = 0;
        });

        filteredRecords.forEach(r => {
            const monthIndex = new Date(r.date).getMonth();
            const monthName = months[monthIndex];
            monthMap[monthName] += r.amountMyr;
        });

        return months.map(month => ({
            month,
            amount: Math.round(monthMap[month])
        }));
    }, [filteredRecords]);

    const totalThisYear = filteredRecords.reduce((sum, r) => sum + r.amountMyr, 0);
    const availableYears = [...new Set(records.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a);

    const handleAddRecord = () => {
        const amountMyr = newRecord.currency === 'MYR'
            ? newRecord.amount
            : newRecord.amount * exchangeRate;

        onAddRecord({
            id: Date.now().toString(),
            date: newRecord.date,
            symbol: newRecord.symbol.toUpperCase(),
            amount: newRecord.amount,
            currency: newRecord.currency,
            amountMyr,
            note: newRecord.note || undefined
        });

        setNewRecord({
            date: new Date().toISOString().split('T')[0],
            symbol: '',
            amount: 0,
            currency: 'USD',
            note: ''
        });
        setShowAddForm(false);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 rounded-lg shadow-lg border text-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p style={{ color: 'var(--success-500)' }}>
                        RM {isPrivacyMode ? '****' : payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-3">
                    <DollarSign className="text-green-500" size={28} />
                    股息追踪
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    记录股息
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>添加股息记录</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>日期</label>
                            <input
                                type="date"
                                value={newRecord.date}
                                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>股票代码</label>
                            <input
                                type="text"
                                placeholder="VOO"
                                value={newRecord.symbol}
                                onChange={(e) => setNewRecord({ ...newRecord, symbol: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>金额</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newRecord.amount}
                                    onChange={(e) => setNewRecord({ ...newRecord, amount: parseFloat(e.target.value) || 0 })}
                                    className="input flex-1"
                                />
                                <select
                                    value={newRecord.currency}
                                    onChange={(e) => setNewRecord({ ...newRecord, currency: e.target.value as 'USD' | 'MYR' })}
                                    className="input w-24"
                                >
                                    <option value="USD">USD</option>
                                    <option value="MYR">MYR</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>备注 (可选)</label>
                        <input
                            type="text"
                            placeholder="季度分红..."
                            value={newRecord.note}
                            onChange={(e) => setNewRecord({ ...newRecord, note: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">取消</button>
                        <button onClick={handleAddRecord} className="btn btn-success" disabled={!newRecord.symbol || newRecord.amount <= 0}>
                            保存
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>今年股息总额</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success-500)' }}>
                        {isPrivacyMode ? 'RM ****' : `RM ${totalThisYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                </div>
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>月均股息</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--primary-500)' }}>
                        {isPrivacyMode ? 'RM ****' : `RM ${Math.round(totalThisYear / 12).toLocaleString()}`}
                    </p>
                </div>
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>记录笔数</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                        {filteredRecords.length}
                    </p>
                </div>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-3">
                <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="input w-32"
                >
                    {availableYears.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Monthly Chart */}
            {records.length > 0 && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp size={20} className="text-green-500" />
                        {filterYear} 年月度股息
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="amount" fill="var(--success-500)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={20} className="text-indigo-500" />
                    股息记录明细
                </h3>
                {filteredRecords.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无 {filterYear} 年的股息记录</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>日期</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>股票</th>
                                    <th className="text-right py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>金额</th>
                                    <th className="text-right py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>折合 (RM)</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>备注</th>
                                    <th className="py-2 px-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td className="py-3 px-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(record.date).toLocaleDateString('zh-CN')}
                                        </td>
                                        <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>{record.symbol}</td>
                                        <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                                            {isPrivacyMode ? '****' : `${record.currency} ${record.amount.toFixed(2)}`}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-bold" style={{ color: 'var(--success-500)' }}>
                                            {isPrivacyMode ? '****' : `RM ${record.amountMyr.toFixed(2)}`}
                                        </td>
                                        <td className="py-3 px-3 text-sm" style={{ color: 'var(--text-muted)' }}>{record.note || '-'}</td>
                                        <td className="py-3 px-3">
                                            <button
                                                onClick={() => onDeleteRecord(record.id)}
                                                className="p-1.5 rounded hover:bg-red-100 transition-colors"
                                                style={{ color: 'var(--danger-500)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Yearly Trend */}
            {yearlyStats.length > 1 && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>年度股息趋势</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                                <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DividendTracker;
