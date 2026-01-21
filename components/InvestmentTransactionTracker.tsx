import React, { useState, useMemo } from 'react';
import { InvestmentTransaction, Asset, ComputedAsset, Currency } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, TrendingUp, Calendar, Filter, Receipt } from 'lucide-react';

interface InvestmentTransactionTrackerProps {
    transactions: InvestmentTransaction[];
    assets: ComputedAsset[];
    cashAccounts: ComputedAsset[]; // Cash (Investment) accounts
    onAddTransaction: (transaction: InvestmentTransaction, assetUpdates: { id: string; quantity: number; averageCost: number } | null, cashUpdate: { id: string; quantity: number } | null, isNewAsset?: Asset) => void;
    onDeleteTransaction: (id: string) => void;
    exchangeRate: number;
    isPrivacyMode: boolean;
}

const InvestmentTransactionTracker: React.FC<InvestmentTransactionTrackerProps> = ({
    transactions,
    assets,
    cashAccounts,
    onAddTransaction,
    onDeleteTransaction,
    exchangeRate,
    isPrivacyMode
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'BUY' as 'BUY' | 'SELL',
        symbol: '',
        quantity: 0,
        pricePerUnit: 0,
        currency: 'USD' as Currency,
        cashAccountId: '',
        note: ''
    });
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

    // Filter transactions by year
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => new Date(t.date).getFullYear() === filterYear)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterYear]);

    // Get available years from transactions
    const availableYears = useMemo(() => {
        const yearSet = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
        const years = Array.from(yearSet);
        if (!years.includes(new Date().getFullYear())) {
            years.push(new Date().getFullYear());
        }
        return years.sort((a, b) => b - a);
    }, [transactions]);

    // Calculate stats
    const stats = useMemo(() => {
        const yearTransactions = filteredTransactions;
        const buyTotal = yearTransactions.filter(t => t.type === 'BUY').reduce((sum, t) => sum + t.totalAmount, 0);
        const sellTotal = yearTransactions.filter(t => t.type === 'SELL').reduce((sum, t) => sum + t.totalAmount, 0);
        return { buyTotal, sellTotal, count: yearTransactions.length };
    }, [filteredTransactions]);

    // Get investment assets (ETF, Stock, Crypto)
    const investmentAssets = useMemo(() => {
        return assets.filter(a => ['ETF', 'Stock', 'Crypto'].includes(a.category));
    }, [assets]);

    // Handle form submission
    const handleSubmit = () => {
        const { date, type, symbol, quantity, pricePerUnit, currency, cashAccountId, note } = newTransaction;

        if (!symbol || quantity <= 0 || pricePerUnit <= 0) {
            alert('请填写完整的交易信息');
            return;
        }

        const totalAmount = quantity * pricePerUnit;

        // Find existing asset
        const existingAsset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());

        // Calculate asset updates
        let assetUpdates: { id: string; quantity: number; averageCost: number } | null = null;
        let isNewAsset: Asset | undefined = undefined;

        if (type === 'BUY') {
            if (existingAsset) {
                // Update existing asset with weighted average cost
                const oldTotalCost = existingAsset.quantity * existingAsset.averageCost;
                const newTotalCost = quantity * pricePerUnit;
                const newTotalQty = existingAsset.quantity + quantity;
                const newAvgCost = (oldTotalCost + newTotalCost) / newTotalQty;

                assetUpdates = {
                    id: existingAsset.id,
                    quantity: newTotalQty,
                    averageCost: newAvgCost
                };
            } else {
                // Create new asset
                isNewAsset = {
                    id: Date.now().toString(),
                    symbol: symbol.toUpperCase(),
                    name: symbol.toUpperCase(),
                    category: 'Stock', // Default to Stock, user can change later
                    currency,
                    quantity,
                    averageCost: pricePerUnit,
                    currentPrice: pricePerUnit,
                    targetAllocation: 0
                };
            }
        } else {
            // SELL
            if (!existingAsset) {
                alert('卖出失败：找不到该资产');
                return;
            }
            if (existingAsset.quantity < quantity) {
                alert(`卖出失败：持有数量不足 (持有: ${existingAsset.quantity})`);
                return;
            }
            assetUpdates = {
                id: existingAsset.id,
                quantity: existingAsset.quantity - quantity,
                averageCost: existingAsset.averageCost // Keep original cost basis
            };
        }

        // Calculate cash account updates
        let cashUpdate: { id: string; quantity: number } | null = null;
        if (cashAccountId) {
            const cashAccount = cashAccounts.find(c => c.id === cashAccountId);
            if (cashAccount) {
                // Convert to same currency if needed
                let amountInCashCurrency = totalAmount;
                if (currency !== cashAccount.currency) {
                    if (currency === 'USD' && cashAccount.currency === 'MYR') {
                        amountInCashCurrency = totalAmount * exchangeRate;
                    } else if (currency === 'MYR' && cashAccount.currency === 'USD') {
                        amountInCashCurrency = totalAmount / exchangeRate;
                    }
                }

                if (type === 'BUY') {
                    if (cashAccount.quantity < amountInCashCurrency) {
                        alert(`现金不足：${cashAccount.symbol} 余额为 ${cashAccount.quantity.toFixed(2)}`);
                        return;
                    }
                    cashUpdate = {
                        id: cashAccountId,
                        quantity: cashAccount.quantity - amountInCashCurrency
                    };
                } else {
                    cashUpdate = {
                        id: cashAccountId,
                        quantity: cashAccount.quantity + amountInCashCurrency
                    };
                }
            }
        }

        // Create transaction record
        const transaction: InvestmentTransaction = {
            id: Date.now().toString(),
            date,
            type,
            symbol: symbol.toUpperCase(),
            quantity,
            pricePerUnit,
            currency,
            totalAmount,
            cashAccountId: cashAccountId || undefined,
            note: note || undefined
        };

        onAddTransaction(transaction, assetUpdates, cashUpdate, isNewAsset);

        // Reset form
        setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'BUY',
            symbol: '',
            quantity: 0,
            pricePerUnit: 0,
            currency: 'USD',
            cashAccountId: '',
            note: ''
        });
        setShowAddForm(false);
    };

    // Auto-fill current price when selecting existing asset
    const handleSymbolChange = (symbol: string) => {
        const asset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
        if (asset) {
            setNewTransaction(prev => ({
                ...prev,
                symbol,
                pricePerUnit: asset.currentPrice,
                currency: asset.currency
            }));
        } else {
            setNewTransaction(prev => ({ ...prev, symbol }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text flex items-center gap-3">
                    <Receipt className="text-blue-500" size={28} />
                    投资交易记录
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    记录交易
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>添加交易记录</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>日期</label>
                            <input
                                type="date"
                                value={newTransaction.date}
                                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                className="input"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>类型</label>
                            <select
                                value={newTransaction.type}
                                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'BUY' | 'SELL' })}
                                className="input"
                            >
                                <option value="BUY">买入 (BUY)</option>
                                <option value="SELL">卖出 (SELL)</option>
                            </select>
                        </div>

                        {/* Symbol */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>股票代码</label>
                            <input
                                type="text"
                                list="asset-symbols"
                                placeholder="VOO"
                                value={newTransaction.symbol}
                                onChange={(e) => handleSymbolChange(e.target.value)}
                                className="input"
                            />
                            <datalist id="asset-symbols">
                                {investmentAssets.map(a => (
                                    <option key={a.id} value={a.symbol}>{a.name}</option>
                                ))}
                            </datalist>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>数量</label>
                            <input
                                type="number"
                                step="0.000001"
                                min="0"
                                placeholder="10.5"
                                value={newTransaction.quantity === 0 ? '' : newTransaction.quantity}
                                onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseFloat(e.target.value) || 0 })}
                                className="input"
                            />
                        </div>

                        {/* Price per unit */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>单价</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="100.00"
                                    value={newTransaction.pricePerUnit === 0 ? '' : newTransaction.pricePerUnit}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, pricePerUnit: parseFloat(e.target.value) || 0 })}
                                    className="input"
                                    style={{ flex: '1 1 auto', minWidth: '80px' }}
                                />
                                <select
                                    value={newTransaction.currency}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, currency: e.target.value as Currency })}
                                    className="input"
                                    style={{ width: '70px', flex: '0 0 auto' }}
                                >
                                    <option value="USD">USD</option>
                                    <option value="MYR">MYR</option>
                                </select>
                            </div>
                        </div>

                        {/* Cash Account */}
                        <div>
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>现金账户</label>
                            <select
                                value={newTransaction.cashAccountId}
                                onChange={(e) => setNewTransaction({ ...newTransaction, cashAccountId: e.target.value })}
                                className="input"
                            >
                                <option value="">不扣除现金</option>
                                {cashAccounts.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.symbol} ({c.currency} {isPrivacyMode ? '****' : c.quantity.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Note */}
                        <div className="md:col-span-2">
                            <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>备注 (可选)</label>
                            <input
                                type="text"
                                placeholder="定期定额买入..."
                                value={newTransaction.note}
                                onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Total Preview */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                        <div>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>交易总额：</span>
                            <span className="text-lg font-bold ml-2" style={{ color: newTransaction.type === 'BUY' ? 'var(--danger-500)' : 'var(--success-500)' }}>
                                {newTransaction.type === 'BUY' ? '-' : '+'}{newTransaction.currency} {isPrivacyMode ? '****' : (newTransaction.quantity * newTransaction.pricePerUnit).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">取消</button>
                            <button
                                onClick={handleSubmit}
                                className={`btn ${newTransaction.type === 'BUY' ? 'btn-primary' : 'btn-success'}`}
                                disabled={!newTransaction.symbol || newTransaction.quantity <= 0 || newTransaction.pricePerUnit <= 0}
                            >
                                确认{newTransaction.type === 'BUY' ? '买入' : '卖出'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <ArrowDownCircle size={16} className="text-red-500" /> 年度买入
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger-500)' }}>
                        {isPrivacyMode ? '****' : `$${stats.buyTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                </div>
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <ArrowUpCircle size={16} className="text-green-500" /> 年度卖出
                    </p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success-500)' }}>
                        {isPrivacyMode ? '****' : `$${stats.sellTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                </div>
                <div className="p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <p className="text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>交易笔数</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                        {stats.count}
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
                    {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Transactions Table */}
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={20} className="text-indigo-500" />
                    交易记录明细
                </h3>
                {filteredTransactions.length === 0 ? (
                    <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>暂无 {filterYear} 年的交易记录</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>日期</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>类型</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>股票</th>
                                    <th className="text-right py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>数量</th>
                                    <th className="text-right py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>单价</th>
                                    <th className="text-right py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>总额</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase" style={{ color: 'var(--text-muted)' }}>备注</th>
                                    <th className="py-2 px-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td className="py-3 px-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {new Date(tx.date).toLocaleDateString('zh-CN')}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                {tx.type === 'BUY' ? '买入' : '卖出'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>{tx.symbol}</td>
                                        <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                                            {isPrivacyMode ? '****' : tx.quantity.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                                            {isPrivacyMode ? '****' : `${tx.currency} ${tx.pricePerUnit.toFixed(2)}`}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-bold" style={{ color: tx.type === 'BUY' ? 'var(--danger-500)' : 'var(--success-500)' }}>
                                            {isPrivacyMode ? '****' : `${tx.type === 'BUY' ? '-' : '+'}${tx.currency} ${tx.totalAmount.toFixed(2)}`}
                                        </td>
                                        <td className="py-3 px-3 text-sm" style={{ color: 'var(--text-muted)' }}>{tx.note || '-'}</td>
                                        <td className="py-3 px-3">
                                            <button
                                                onClick={() => onDeleteTransaction(tx.id)}
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
        </div>
    );
};

export default InvestmentTransactionTracker;
