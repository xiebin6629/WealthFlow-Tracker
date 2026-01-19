
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, ComputedAsset, Currency } from '../types';
import { Trash2, Edit2, Check, ArrowUp, ArrowDown, ArrowUpDown, X, Layers, Plus, PlusCircle, Calculator, GripVertical, AlertTriangle } from 'lucide-react';

interface AssetTableProps {
  title?: string;
  assets: ComputedAsset[];
  onUpdateAsset: (id: string, updates: Partial<Asset>) => void;
  onDeleteAsset: (id: string) => void;
  onAddAsset?: () => void;
  isPrivacyMode: boolean;
}

type SortKey = keyof ComputedAsset | 'profitLossPercent' | 'totalCostOriginal';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface EditValues {
  symbol: string;
  name: string;
  currentPrice: number;
  quantity: number;
  totalCostOriginal: number;
  targetAllocation: number;
  category: Asset['category'];
  // Pension specific
  pensionBase?: number;
  pensionMonthly?: number;
  pensionStart?: string;
  groupName?: string;
}

interface TopUpValues {
  asset: ComputedAsset;
  addedQuantity: string;
  buyPrice: string; // Per unit
}

// Define Column Keys for Drag and Drop
type ColumnKey = 'symbol' | 'category' | 'currentPrice' | 'quantity' | 'totalCostOriginal' | 'currentValueUsd' | 'currentValueMyr' | 'currentAllocationPercent' | 'targetAllocation' | 'groupName';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  align: 'left' | 'center' | 'right';
  width?: string;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'symbol', label: '资产', align: 'left', width: 'min-w-[200px]' },
  { key: 'category', label: '类别', align: 'left' },
  { key: 'currentPrice', label: '价格 / 月供', align: 'left' },
  { key: 'quantity', label: '数量 / 开始', align: 'left' },
  { key: 'totalCostOriginal', label: '成本 / 基数', align: 'left' },
  { key: 'currentValueUsd', label: '市值 (USD)', align: 'right' },
  { key: 'currentValueMyr', label: '市值 (RM)', align: 'right' },
  { key: 'currentAllocationPercent', label: '占比 %', align: 'center' },
  { key: 'targetAllocation', label: '目标 %', align: 'center' },
  { key: 'groupName', label: 'Group', align: 'left', width: 'w-[100px]' },
];

const STORAGE_KEY_COL_ORDER = 'WF_COL_ORDER';

const AssetTable: React.FC<AssetTableProps> = ({ title, assets, onUpdateAsset, onDeleteAsset, onAddAsset, isPrivacyMode }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const [topUpState, setTopUpState] = useState<TopUpValues | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'currentValueMyr', direction: 'desc' });

  // Custom Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag and Drop State with Persistence
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COL_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that the saved columns match our current schema (basic check)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMNS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load column order", e);
    }
    return DEFAULT_COLUMNS.map(c => c.key);
  });

  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);

  // Save column order whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COL_ORDER, JSON.stringify(columnOrder));
  }, [columnOrder]);

  // Helper to identify cash-like assets
  const isCashLike = (cat: string) => ['Cash (Investment)', 'Cash (Saving)', 'Money Market Fund', 'Pension'].includes(cat);
  const isPension = (cat: string) => cat === 'Pension';

  // Sorting Logic
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedAssets = useMemo(() => {
    return [...assets].map(a => ({
      ...a,
      totalCostOriginal: a.quantity * a.averageCost // Ensure consistent value
    })).sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [assets, sortConfig]);

  // Calculate Totals for Footer
  const totals = useMemo(() => {
    return assets.reduce((acc, asset) => ({
      costMyr: acc.costMyr + asset.totalCostMyr,
      valueUsd: acc.valueUsd + asset.currentValueUsd,
      valueMyr: acc.valueMyr + asset.currentValueMyr
    }), { costMyr: 0, valueUsd: 0, valueMyr: 0 });
  }, [assets]);

  const hasPension = useMemo(() => assets.some(a => a.category === 'Pension'), [assets]);
  const totalsExclPension = useMemo(() => {
    if (!hasPension) return null;
    return assets
      .filter(a => a.category !== 'Pension')
      .reduce((acc, asset) => ({
        costMyr: acc.costMyr + asset.totalCostMyr,
        valueUsd: acc.valueUsd + asset.currentValueUsd,
        valueMyr: acc.valueMyr + asset.currentValueMyr
      }), { costMyr: 0, valueUsd: 0, valueMyr: 0 });
  }, [assets, hasPension]);

  // Helper to format currency
  const fmt = (val: number, curr: Currency | 'MYR') => {
    if (isPrivacyMode) return '****';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const fmtNum = (val: number) => {
    if (isPrivacyMode) return '****';
    return val.toLocaleString();
  }

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, key: ColumnKey) => {
    setDraggedColumn(key);
    // Setting effectAllowed is good practice for compatibility
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, key: ColumnKey) => {
    e.preventDefault(); // Necessary to allow dropping
    if (!draggedColumn || draggedColumn === key) return;

    // Reorder instantly on hover (DragEnter style logic)
    const newOrder = [...columnOrder];
    const draggedIdx = newOrder.indexOf(draggedColumn);
    const targetIdx = newOrder.indexOf(key);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      // Move the item in the array
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedColumn);
      setColumnOrder(newOrder);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // --- Edit Handlers ---
  const handleEdit = (asset: ComputedAsset) => {
    setEditingId(asset.id);
    setEditValues({
      symbol: asset.symbol,
      name: asset.name,
      currentPrice: asset.currentPrice,
      quantity: asset.quantity,
      totalCostOriginal: asset.quantity * asset.averageCost,
      targetAllocation: asset.targetAllocation,
      category: asset.category,
      pensionBase: asset.pensionConfig?.baseAmount,
      pensionMonthly: asset.pensionConfig?.monthlyContribution,
      pensionStart: asset.pensionConfig?.startDate,
      groupName: asset.groupName || ''
    });
  };

  const handleDoneEdit = () => {
    if (editingId && editValues) {
      const isCash = isCashLike(editValues.category);
      const isPen = isPension(editValues.category);

      const newAverageCost = isCash
        ? 1
        : (editValues.quantity > 0 ? editValues.totalCostOriginal / editValues.quantity : 0);

      const updates: Partial<Asset> = {
        symbol: editValues.symbol,
        name: editValues.name,
        currentPrice: isCash ? 1 : editValues.currentPrice,
        quantity: isPen ? 0 : editValues.quantity,
        averageCost: newAverageCost,
        targetAllocation: editValues.targetAllocation,
        category: editValues.category,
        groupName: editValues.groupName
      };

      if (isPen) {
        updates.pensionConfig = {
          baseAmount: editValues.pensionBase || 0,
          monthlyContribution: editValues.pensionMonthly || 0,
          startDate: editValues.pensionStart || new Date().toISOString().split('T')[0]
        };
      } else {
        updates.pensionConfig = undefined;
      }

      onUpdateAsset(editingId, updates);
    }
    setEditingId(null);
    setEditValues(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  // --- Top Up Handlers ---
  const handleOpenTopUp = (asset: ComputedAsset) => {
    setTopUpState({
      asset,
      addedQuantity: '',
      buyPrice: isCashLike(asset.category) ? '1' : asset.currentPrice.toString()
    });
  };

  const handleConfirmTopUp = () => {
    if (!topUpState) return;
    const { asset, addedQuantity, buyPrice } = topUpState;
    const addQty = parseFloat(addedQuantity);
    const price = parseFloat(buyPrice);

    if (isNaN(addQty) || isNaN(price) || addQty <= 0) {
      alert("Please enter valid positive numbers");
      return;
    }

    const oldTotalCost = asset.quantity * asset.averageCost;
    const newAdditionCost = addQty * price;
    const newTotalQty = asset.quantity + addQty;
    const newAverageCost = (oldTotalCost + newAdditionCost) / newTotalQty;

    onUpdateAsset(asset.id, {
      quantity: newTotalQty,
      averageCost: newAverageCost
    });

    setTopUpState(null);
  };

  // --- Dynamic Cell Rendering ---
  const renderCell = (asset: ComputedAsset, colKey: ColumnKey) => {
    const isEditing = editingId === asset.id && editValues;
    const isCash = isEditing ? isCashLike(editValues!.category) : isCashLike(asset.category);
    const isPen = isEditing ? isPension(editValues!.category) : isPension(asset.category);

    switch (colKey) {
      case 'symbol':
        return isEditing ? (
          <div className="flex flex-col gap-1">
            <input
              value={editValues!.symbol}
              onChange={(e) => setEditValues({ ...editValues!, symbol: e.target.value.toUpperCase() })}
              className="font-bold text-lg bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none w-full pb-0.5"
              placeholder="SYMBOL"
            />
            <input
              value={editValues!.name}
              onChange={(e) => setEditValues({ ...editValues!, name: e.target.value })}
              className="text-xs bg-transparent border-b border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:outline-none w-full pb-0.5"
              placeholder="Asset Name"
            />
            <div className="flex gap-2 mt-1">
              <select
                className="text-xs border rounded p-1 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
                value={asset.currency}
                onChange={(e) => onUpdateAsset(asset.id, { currency: e.target.value as any })}
              >
                <option value="USD">USD</option>
                <option value="MYR">MYR</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <div className="font-bold text-slate-900 dark:text-white text-lg">{asset.symbol}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{asset.name}</div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${asset.currency === 'USD' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'}`}>
              {asset.currency}
            </span>
          </>
        );

      case 'category':
        return isEditing ? (
          <select
            className="text-sm border rounded p-2 max-w-[140px] bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
            value={editValues!.category}
            onChange={(e) => {
              if (!editValues) return;
              const newCat = e.target.value as any;
              const newIsCash = isCashLike(newCat);
              const newIsPen = isPension(newCat);
              let updates: Partial<EditValues> = { category: newCat };

              if (newIsPen) {
                updates = { ...updates, pensionBase: editValues.totalCostOriginal || 0, pensionMonthly: 0, pensionStart: new Date().toISOString().split('T')[0] };
              } else if (newIsCash) {
                updates = { ...updates, currentPrice: 1, quantity: editValues.totalCostOriginal };
              }
              setEditValues({ ...editValues, ...updates });
            }}
          >
            <option value="Stock">Stock</option>
            <option value="ETF">ETF</option>
            <option value="Crypto">Crypto</option>
            <option value="Cash (Investment)">Cash (Inv)</option>
            <option value="Cash (Saving)">Cash (Save)</option>
            <option value="Money Market Fund">MM Fund</option>
            <option value="Pension">Pension (EPF)</option>
          </select>
        ) : (
          <span className="text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {asset.category}
          </span>
        );

      case 'currentPrice':
        return isEditing ? (
          isPen ? (
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Monthly</span>
              <input type="number" className="w-24 p-2 border border-slate-300 bg-white text-slate-900 rounded text-sm" value={editValues!.pensionMonthly} onChange={(e) => setEditValues({ ...editValues!, pensionMonthly: parseFloat(e.target.value) || 0 })} />
            </div>
          ) : isCash ? (
            <span className="text-slate-400 font-mono">1.00</span>
          ) : (
            <input type="number" className="w-24 p-2 border border-slate-300 bg-white text-slate-900 rounded text-sm" value={editValues!.currentPrice} onChange={(e) => setEditValues({ ...editValues!, currentPrice: parseFloat(e.target.value) || 0 })} />
          )
        ) : (
          <div className="text-slate-700 dark:text-slate-200 font-medium">
            {isPen ? (
              <div title="Monthly Contribution"><span className="text-xs text-slate-400 dark:text-slate-500 mr-1">/mo</span>{isPrivacyMode ? '****' : asset.pensionConfig?.monthlyContribution?.toLocaleString()}</div>
            ) : (
              isPrivacyMode ? '****' : asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })
            )}
          </div>
        );

      case 'quantity':
        return isEditing ? (
          isPen ? (
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Start Date</span>
              <input type="date" className="w-32 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm" value={editValues!.pensionStart} onChange={(e) => setEditValues({ ...editValues!, pensionStart: e.target.value })} />
            </div>
          ) : isCash ? (
            <span className="text-slate-400">-</span>
          ) : (
            <input type="number" className="w-24 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm" value={editValues!.quantity} onChange={(e) => setEditValues({ ...editValues!, quantity: parseFloat(e.target.value) || 0 })} />
          )
        ) : (
          <div className="dark:text-slate-200">
            {isPen ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">{asset.pensionConfig?.startDate}</div>
            ) : isCash ? '-' : fmtNum(asset.quantity)}
          </div>
        );

      case 'totalCostOriginal':
        return isEditing ? (
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">{isPen ? 'Base Amount' : asset.currency}</span>
            {isPen ? (
              <input type="number" className="w-28 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm" value={editValues!.pensionBase} onChange={(e) => setEditValues({ ...editValues!, pensionBase: parseFloat(e.target.value) || 0 })} />
            ) : (
              <input type="number" className="w-28 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded text-sm" value={editValues!.totalCostOriginal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (isCashLike(editValues!.category) && !isPen) {
                    setEditValues({ ...editValues!, totalCostOriginal: val, quantity: val });
                  } else {
                    setEditValues({ ...editValues!, totalCostOriginal: val });
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            {isPen ? (
              <div><span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Base</span>{isPrivacyMode ? '****' : asset.pensionConfig?.baseAmount?.toLocaleString()}</div>
            ) : (
              <><span className="text-xs text-slate-400 dark:text-slate-500 mr-1">{asset.currency}</span>{isPrivacyMode ? '****' : asset.totalCostOriginal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
            )}
          </div>
        );

      case 'currentValueUsd':
        return <div className="font-medium text-slate-500 dark:text-slate-400">{fmt(asset.currentValueUsd, 'USD')}</div>;

      case 'currentValueMyr':
        return <div className="font-bold text-slate-900 dark:text-white">{fmt(asset.currentValueMyr, 'MYR')}</div>;

      case 'currentAllocationPercent':
        return <div className="text-sm font-semibold bg-slate-100 dark:bg-slate-700 dark:text-slate-200 py-1.5 px-3 rounded-full inline-block">{asset.currentAllocationPercent.toFixed(1)}%</div>;

      case 'targetAllocation':
        return isEditing ? (
          <input type="number" className="w-20 p-2 border border-slate-300 bg-white text-slate-900 rounded text-center text-sm" value={editValues!.targetAllocation} onChange={(e) => setEditValues({ ...editValues!, targetAllocation: parseFloat(e.target.value) || 0 })} />
        ) : (
          <div className="text-slate-500 font-medium">{asset.targetAllocation}%</div>
        );

      case 'groupName':
        return isEditing ? (
          <input type="text" className="w-24 p-2 border border-slate-300 bg-white text-slate-900 rounded text-sm" placeholder="Group..." value={editValues!.groupName} onChange={(e) => setEditValues({ ...editValues!, groupName: e.target.value })} />
        ) : (
          <div className="text-slate-400 text-xs">{asset.groupName || '-'}</div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden mb-8 relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 backdrop-blur-md"
    >
      {title && (
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <Layers size={20} className="text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          {onAddAsset && (
            <button
              onClick={onAddAsset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"
            >
              <Plus size={16} /> 添加
            </button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {columnOrder.map((colKey) => {
                const colDef = DEFAULT_COLUMNS.find(c => c.key === colKey);
                if (!colDef) return null;
                const isActive = sortConfig.key === colKey;
                const isDragging = draggedColumn === colKey;

                return (
                  <th
                    key={colKey}
                    draggable
                    onDragStart={(e) => handleDragStart(e, colKey)}
                    onDragOver={(e) => handleDragOver(e, colKey)}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    className={`
                      px-6 py-4 transition-all duration-200 select-none group border-r border-transparent 
                      ${isDragging ? 'opacity-40 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'} 
                      cursor-move 
                      ${colDef.width || ''}
                    `}
                    onClick={() => handleSort(colKey as SortKey)}
                  >
                    <div className={`flex items-center gap-1.5 ${colDef.align === 'right' ? 'justify-end' : colDef.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <GripVertical size={14} className={`text-slate-300 mr-1 ${isDragging ? 'text-blue-500' : 'opacity-0 group-hover:opacity-100'}`} />
                      {colDef.label}
                      <span className={`text-slate-400 ${isActive ? 'text-blue-600' : 'opacity-0 group-hover:opacity-50'}`}>
                        {isActive ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-base">
            {sortedAssets.map((asset) => {
              const isEditing = editingId === asset.id;
              return (
                <tr key={asset.id} className={`transition-colors ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  {columnOrder.map(colKey => {
                    const colDef = DEFAULT_COLUMNS.find(c => c.key === colKey);
                    return (
                      <td key={colKey} className={`px-6 py-4 ${colDef?.align === 'right' ? 'text-right' : colDef?.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {renderCell(asset, colKey)}
                      </td>
                    );
                  })}

                  {/* Fixed Actions Column */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button onClick={handleDoneEdit} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm">
                            <Check size={18} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm">
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          {!isPension(asset.category) && (
                            <button onClick={() => handleOpenTopUp(asset)} title="Top Up" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <PlusCircle size={18} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(asset)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(asset.id); }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedAssets.length === 0 && (
              <tr>
                <td colSpan={columnOrder.length + 1} className="px-6 py-8 text-center italic" style={{ color: 'var(--text-muted)' }}>
                  暂无资产数据。点击"添加"开始。
                </td>
              </tr>
            )}
          </tbody>

          {/* Dynamic Footer */}
          {assets.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <tr>
                {columnOrder.map((colKey, index) => {
                  const colDef = DEFAULT_COLUMNS.find(c => c.key === colKey);
                  let content = null;

                  if (colKey === 'totalCostOriginal') content = <>{fmt(totals.costMyr, 'MYR')}</>;
                  else if (colKey === 'currentValueUsd') content = <>{fmt(totals.valueUsd, 'USD')}</>;
                  else if (colKey === 'currentValueMyr') content = <>{fmt(totals.valueMyr, 'MYR')}</>;
                  else if (index === 0) content = <span className="uppercase text-xs tracking-wider text-slate-500">Total (Est)</span>;

                  return (
                    <td key={colKey} className={`px-6 py-4 ${colDef?.align === 'right' ? 'text-right' : colDef?.align === 'center' ? 'text-center' : 'text-left'}`}>
                      {content}
                    </td>
                  )
                })}
                <td></td>{/* Actions spacer */}
              </tr>
              {/* Extra row for Excluding EPF */}
              {hasPension && totalsExclPension && (
                <tr className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                  {columnOrder.map((colKey, index) => {
                    const colDef = DEFAULT_COLUMNS.find(c => c.key === colKey);
                    let content = null;
                    if (colKey === 'totalCostOriginal') content = <>{fmt(totalsExclPension.costMyr, 'MYR')}</>;
                    else if (colKey === 'currentValueUsd') content = <>{fmt(totalsExclPension.valueUsd, 'USD')}</>;
                    else if (colKey === 'currentValueMyr') content = <>{fmt(totalsExclPension.valueMyr, 'MYR')}</>;
                    else if (index === 0) content = <span className="uppercase text-xs tracking-wider text-slate-400">Total (Excl. EPF)</span>;

                    return (
                      <td key={colKey} className={`px-6 py-3 ${colDef?.align === 'right' ? 'text-right' : colDef?.align === 'center' ? 'text-center' : 'text-left'}`}>
                        {content}
                      </td>
                    )
                  })}
                  <td></td>
                </tr>
              )}
            </tfoot>
          )}
        </table>
      </div>

      {/* Top Up Modal - Same as before */}
      {topUpState && (
        <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden animate-slide-in-right">
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Calculator size={20} /> Top Up {topUpState.asset.symbol}
              </h3>
              <button onClick={() => setTopUpState(null)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isCashLike(topUpState.asset.category) ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount to Add ({topUpState.asset.currency})</label>
                  <input type="number" autoFocus className="w-full text-lg p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 5000" value={topUpState.addedQuantity} onChange={(e) => setTopUpState({ ...topUpState, addedQuantity: e.target.value })} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Units Bought</label>
                    <input type="number" autoFocus className="w-full text-lg p-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. 10.5" value={topUpState.addedQuantity} onChange={(e) => setTopUpState({ ...topUpState, addedQuantity: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Buy Price ({topUpState.asset.currency})</label>
                    <input type="number" className="w-full text-lg p-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={topUpState.buyPrice} onChange={(e) => setTopUpState({ ...topUpState, buyPrice: e.target.value })} />
                  </div>
                  <div className="pt-2 text-sm text-slate-500 dark:text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-700">
                    <span>Total Cost Addition:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {((parseFloat(topUpState.addedQuantity) || 0) * (parseFloat(topUpState.buyPrice) || 0)).toLocaleString(undefined, { style: 'currency', currency: topUpState.asset.currency })}
                    </span>
                  </div>
                </>
              )}
              <button onClick={handleConfirmTopUp} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-md mt-2">
                Confirm Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 scale-100 transform transition-all">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Remove Asset?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to remove this asset from your portfolio?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onDeleteAsset(deleteId); setDeleteId(null); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetTable;
