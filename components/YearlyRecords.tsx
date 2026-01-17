
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
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string | null, year: number | null}>({
    isOpen: false,
    id: null,
    year: null
  });

  // Form State - Using string for inputs to allow empty state during typing
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
      alert("Please enter a valid year.");
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
        // We can't use window.confirm here either if strict sandbox, but usually adding/updating is less destructive.
        // For consistency, let's just allow overwrite or require manual delete. 
        // But to keep it simple and safe:
        alert(`A record for ${newRecord.year} already exists. Please edit it directly or delete the old one first.`);
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
    setFormYear(new Date().getFullYear().toString()); // Reset to current year
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
    
    // Smooth scroll to top to see form
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
    setFormNote("End of Year Snapshot (Auto)");
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Top Section: Chart & Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600"/> Wealth Growth History
          </h3>
          {chartData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{fill: '#64748b'}} />
                  <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => isPrivacyMode ? '****' : `RM ${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="Invest" stackId="a" fill="#3b82f6" name="Investments" />
                  <Bar dataKey="Saving" stackId="a" fill="#10b981" name="Savings" />
                  <Bar dataKey="EPF" stackId="a" fill="#6366f1" name="EPF / Pension" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <TrendingUp size={48} className="mb-2 opacity-50"/>
               <p>No history records yet.</p>
             </div>
          )}
        </div>

        {/* Right: Input Form */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {isEditing ? <Edit2 size={20} className="text-blue-600"/> : <Plus size={20} />} 
              {isEditing ? 'Edit Record' : 'Add Record'}
            </h3>
            {!isEditing && (
              <button 
                type="button"
                onClick={handleSnapshot}
                title="Snapshot current portfolio values"
                className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-medium cursor-pointer"
              >
                <Camera size={14} /> Snapshot
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                <input 
                  type="number" 
                  min="1990" max="2100"
                  required
                  value={formYear} 
                  onChange={e => setFormYear(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-700"
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Investments (MYR)</label>
               <input 
                  type="number" step="0.01"
                  value={formInvest} 
                  onChange={e => setFormInvest(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
               />
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Savings (MYR)</label>
               <input 
                  type="number" step="0.01"
                  value={formSaving} 
                  onChange={e => setFormSaving(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">EPF / Pension (MYR)</label>
               <input 
                  type="number" step="0.01"
                  value={formEpf} 
                  onChange={e => setFormEpf(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VOO / S&P 500 Return (%)</label>
               <div className="relative">
                 <Percent size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                 <input 
                    type="number" step="0.01"
                    value={formVoo} 
                    onChange={e => setFormVoo(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                 />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Major Expenses / Note</label>
               <div className="relative">
                 <FileText size={16} className="absolute left-3 top-2.5 text-slate-400"/>
                 <textarea 
                    rows={3}
                    value={formNote} 
                    onChange={e => setFormNote(e.target.value)}
                    placeholder="e.g. Bought a car, Wedding, House Reno..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm resize-none"
                 />
               </div>
            </div>

            <div className="pt-2 flex gap-2">
               <button 
                  type="submit" 
                  className={`flex-1 flex items-center justify-center gap-2 text-white py-2.5 rounded-lg transition-colors font-medium text-sm cursor-pointer shadow-md ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
               >
                 <Save size={16} /> {isEditing ? 'Update Record' : 'Save Record'}
               </button>
               {isEditing && (
                 <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer"
                  title="Cancel Edit"
                 >
                   <RotateCcw size={16} />
                 </button>
               )}
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Section: Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
           <h3 className="text-lg font-bold text-slate-800">History Log</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
               <tr>
                 <th className="px-6 py-4">Year</th>
                 <th className="px-6 py-4 text-right">Net Worth</th>
                 <th className="px-6 py-4 text-center">YoY Growth</th>
                 <th className="px-6 py-4 text-center">VOO %</th>
                 <th className="px-6 py-4 text-right hidden md:table-cell text-blue-600">Invest</th>
                 <th className="px-6 py-4 text-right hidden md:table-cell text-emerald-600">Save</th>
                 <th className="px-6 py-4 text-right hidden md:table-cell text-indigo-600">EPF</th>
                 <th className="px-6 py-4">Notes</th>
                 <th className="px-6 py-4 text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm">
               {sortedRecords.map((record) => {
                 const total = record.investAmount + record.savingAmount + record.epfAmount;
                 const prevRecord = records.find(r => r.year === record.year - 1);
                 let yoyPercent = 0;
                 if (prevRecord) {
                   const prevTotal = prevRecord.investAmount + prevRecord.savingAmount + prevRecord.epfAmount;
                   yoyPercent = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
                 }

                 return (
                   // Use composite key to force re-render if ID changes or migration happens
                   <tr key={`${record.id}_${record.year}`} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-800">{record.year}</td>
                     <td className="px-6 py-4 text-right font-bold text-slate-900">
                       {isPrivacyMode ? '****' : `RM ${total.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                     </td>
                     <td className="px-6 py-4 text-center">
                       {prevRecord ? (
                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${yoyPercent >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                           {yoyPercent > 0 ? '+' : ''}{yoyPercent.toFixed(1)}%
                         </span>
                       ) : (
                         <span className="text-slate-300">-</span>
                       )}
                     </td>
                     <td className="px-6 py-4 text-center">
                        {record.vooReturn !== undefined ? (
                           <span className={`font-bold ${record.vooReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {record.vooReturn > 0 ? '+' : ''}{record.vooReturn}%
                           </span>
                        ) : '-'}
                     </td>
                     <td className="px-6 py-4 text-right hidden md:table-cell text-slate-600">
                        {isPrivacyMode ? '****' : record.investAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                     </td>
                     <td className="px-6 py-4 text-right hidden md:table-cell text-slate-600">
                        {isPrivacyMode ? '****' : record.savingAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                     </td>
                     <td className="px-6 py-4 text-right hidden md:table-cell text-slate-600">
                        {isPrivacyMode ? '****' : record.epfAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}
                     </td>
                     <td className="px-6 py-4 max-w-[200px] truncate text-slate-500">
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
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => requestDelete(e, String(record.id), Number(record.year))} 
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                            title="Delete Record"
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
                   <td colSpan={9} className="px-6 py-10 text-center text-slate-400 italic">
                     Start tracking your yearly net worth by adding a record above.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 scale-100 transform transition-all">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-rose-100 rounded-full text-rose-600">
                        <Trash2 size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Delete Record?</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Are you sure you want to delete the history record for <span className="font-bold text-slate-800">{deleteConfirm.year}</span>? 
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button 
                            onClick={() => setDeleteConfirm({isOpen: false, id: null, year: null})}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={performDelete}
                            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors shadow-sm shadow-rose-200"
                        >
                            Delete
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
