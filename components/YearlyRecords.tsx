
import React, { useState, useMemo } from 'react';
import { YearlyRecord, PortfolioMetrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Save, Plus, Trash2, Edit2, TrendingUp, Calendar, FileText, Camera, AlertCircle, Percent, RotateCcw } from 'lucide-react';

interface YearlyRecordsProps {
  records: YearlyRecord[];
  onAddRecord: (record: YearlyRecord) => void;
  onUpdateRecord: (record: YearlyRecord) => void;
  onDeleteRecord: (id: string, year: number) => void;
  currentMetrics: PortfolioMetrics;
  isPrivacyMode: boolean;
}

const YearlyRecords: React.FC<YearlyRecordsProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  currentMetrics,
  isPrivacyMode
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null, year: number | null }>({
    isOpen: false,
    id: null,
    year: null
  });

  // Form State
  const [formYear, setFormYear] = useState<string>(new Date().getFullYear().toString());
  const [formInvest, setFormInvest] = useState<string>('');
  const [formSaving, setFormSaving] = useState<string>('');
  const [formEpf, setFormEpf] = useState<string>('');
  const [formVoo, setFormVoo] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  // Process data for Chart and Table
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => b.year - a.year);
  }, [records]);

  const chartData = useMemo(() => {
    return [...records]
      .sort((a, b) => a.year - b.year)
      .map(rec => ({
        year: rec.year,
        Invest: rec.investAmount,
        Saving: rec.savingAmount,
        EPF: rec.epfAmount,
        Total: rec.investAmount + rec.savingAmount + rec.epfAmount
      }));
  }, [records]);

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const yearNum = parseInt(formYear);

    // Validation
    if (!formYear || isNaN(yearNum)) {
      alert("请输入有效的年份");
      return;
    }

    const newRecord: YearlyRecord = {
      id: editId || `rec-${yearNum}-${Date.now()}`,
      year: yearNum,
      investAmount: parseFloat(formInvest) || 0,
      savingAmount: parseFloat(formSaving) || 0,
      epfAmount: parseFloat(formEpf) || 0,
      vooReturn: formVoo ? parseFloat(formVoo) : undefined,
      note: formNote,
      dateRecorded: new Date().toISOString()
    };

    if (isEditing) {
      onUpdateRecord(newRecord);
      resetForm();
    } else {
      // Check for duplicate year
      const existing = records.find(r => r.year === newRecord.year);
      if (existing) {
        alert(`${newRecord.year} 年的记录已存在。请编辑现有记录或删除后重新添加。`);
        return;
      } else {
        onAddRecord(newRecord);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormYear(new Date().getFullYear().toString());
    setFormInvest('');
    setFormSaving('');
    setFormEpf('');
    setFormVoo('');
    setFormNote('');
  };

  const handleEdit = (rec: YearlyRecord) => {
    setIsEditing(true);
    setEditId(rec.id);
    setFormYear(rec.year.toString());
    setFormInvest(rec.investAmount.toString());
    setFormSaving(rec.savingAmount.toString());
    setFormEpf(rec.epfAmount.toString());
    setFormVoo(rec.vooReturn !== undefined ? rec.vooReturn.toString() : '');
    setFormNote(rec.note || '');

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger Modal
  const requestDelete = (e: React.MouseEvent, id: string, year: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirm({ isOpen: true, id, year });
  };

  // Confirm Delete Action
  const performDelete = () => {
    if (deleteConfirm.id && deleteConfirm.year) {
      onDeleteRecord(deleteConfirm.id, deleteConfirm.year);
    }
    setDeleteConfirm({ isOpen: false, id: null, year: null });
  };

  const handleSnapshot = () => {
    setFormYear(new Date().getFullYear().toString());
    setFormInvest(currentMetrics.investedNetWorth.toFixed(2));
    setFormSaving(currentMetrics.savedNetWorth.toFixed(2));
    setFormEpf(currentMetrics.pensionNetWorth.toFixed(2));
    setFormVoo('');
    setFormNote("年末自动快照");
  };

  return (
    <div className="space-y-6 relative">

      {/* Top Section: Chart & Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Chart - 历史图表 */}
        <div
          className="lg:col-span-2 rounded-2xl shadow-lg p-6 flex flex-col min-h-[400px] transition-all"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={20} className="text-blue-600" /> 财富增长历史
          </h3>
          {chartData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-tertiary)' }}
                    contentStyle={{ borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-default)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                    formatter={(value: number) => isPrivacyMode ? '****' : `RM ${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Invest" stackId="a" fill="#3b82f6" name="投资资产" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Saving" stackId="a" fill="#10b981" name="储蓄资产" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="EPF" stackId="a" fill="#6366f1" name="公积金 (EPF)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp size={48} className="mb-2 opacity-50" />
              <p>暂无历史记录。</p>
            </div>
          )}
        </div>

        {/* Right: Input Form - 输入表单 */}
        <div
          className="lg:col-span-1 rounded-2xl shadow-lg p-6 border transition-all"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} />}
              {isEditing ? '编辑记录' : '添加记录'}
            </h3>
            {!isEditing && (
              <button
                type="button"
                onClick={handleSnapshot}
                title="创建当前资产快照"
                className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-medium cursor-pointer"
              >
                <Camera size={14} /> 快照
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>年份</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number"
                  min="1990" max="2100"
                  required
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  className="input pl-9 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>投资金额 (Investment)</label>
              <input
                type="number" step="0.01"
                value={formInvest}
                onChange={e => setFormInvest(e.target.value)}
                placeholder="0.00"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>储蓄金额 (Saving)</label>
              <input
                type="number" step="0.01"
                value={formSaving}
                onChange={e => setFormSaving(e.target.value)}
                placeholder="0.00"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>公积金 (EPF)</label>
              <input
                type="number" step="0.01"
                value={formEpf}
                onChange={e => setFormEpf(e.target.value)}
                placeholder="0.00"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>VOO / 标普500 回报率 (%)</label>
              <div className="relative">
                <Percent size={14} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="number" step="0.01"
                  value={formVoo}
                  onChange={e => setFormVoo(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>备注 / 大额支出</label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                <textarea
                  rows={3}
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="例如: 购车、婚礼、装修..."
                  className="input pl-9 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center gap-2 text-white py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer shadow-md ${isEditing ? 'btn-primary' : ''}`}
                style={!isEditing ? { background: 'var(--text-primary)', color: 'var(--bg-primary)' } : {}}
              >
                <Save size={16} /> {isEditing ? '更新记录' : '保存记录'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                  title="取消编辑"
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Section: Data Table - 历史记录表格 */}
      <div
        className="rounded-xl shadow-lg overflow-hidden border transition-all"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-light)', background: 'var(--bg-tertiary)' }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>历史记录日志</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead
              className="text-xs font-bold uppercase tracking-wider"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}
            >
              <tr>
                <th className="px-6 py-4">年份</th>
                <th className="px-6 py-4 text-right">净资产</th>
                <th className="px-6 py-4 text-center">同比増长</th>
                <th className="px-6 py-4 text-center">VOO %</th>
                <th className="px-6 py-4 text-right hidden md:table-cell text-blue-500">投资</th>
                <th className="px-6 py-4 text-right hidden md:table-cell text-emerald-500">储蓄</th>
                <th className="px-6 py-4 text-right hidden md:table-cell text-indigo-500">EPF</th>
                <th className="px-6 py-4">备注</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: 'var(--border-light)' }}>
              {sortedRecords.map((record) => {
                const total = record.investAmount + record.savingAmount + record.epfAmount;
                const prevRecord = records.find(r => r.year === record.year - 1);
                let yoyPercent = 0;
                if (prevRecord) {
                  const prevTotal = prevRecord.investAmount + prevRecord.savingAmount + prevRecord.epfAmount;
                  yoyPercent = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
                }

                return (
                  <tr key={`${record.id}_${record.year}`} className="hover:bg-opacity-50 transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-6 py-4 font-bold" style={{ color: 'var(--text-primary)' }}>{record.year}</td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isPrivacyMode ? '****' : `RM ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {prevRecord ? (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold inline-block"
                          style={{
                            background: yoyPercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: yoyPercent >= 0 ? 'var(--success-500)' : 'var(--danger-500)'
                          }}
                        >
                          {yoyPercent > 0 ? '+' : ''}{yoyPercent.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.vooReturn !== undefined ? (
                        <span className="font-bold" style={{ color: record.vooReturn >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>
                          {record.vooReturn > 0 ? '+' : ''}{record.vooReturn}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {isPrivacyMode ? '****' : record.investAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {isPrivacyMode ? '****' : record.savingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {isPrivacyMode ? '****' : record.epfAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {record.note ? (
                        <div className="flex items-center gap-1.5" title={record.note}>
                          <AlertCircle size={14} className="text-orange-400 shrink-0" />
                          <span className="truncate">{record.note}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="p-1.5 rounded transition-colors cursor-pointer hover:bg-blue-50"
                          style={{ color: 'var(--primary-500)' }}
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => requestDelete(e, String(record.id), Number(record.year))}
                          className="p-1.5 rounded transition-colors cursor-pointer hover:bg-rose-50"
                          title="删除"
                          style={{ color: 'var(--danger-500)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedRecords.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center italic" style={{ color: 'var(--text-muted)' }}>
                    尚未添加年度记录。请使用上方表单开始记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal - 删除确认模态框 */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 scale-100 transform transition-all">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-rose-100 rounded-full text-rose-600">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">确认删除记录?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  您确定要删除 <span className="font-bold text-slate-800">{deleteConfirm.year}</span> 年的记录吗？
                  此操作无法撤销。
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null, year: null })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={performDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-sm shadow-rose-200"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearlyRecords;
