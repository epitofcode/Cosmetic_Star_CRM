import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ChevronRight, 
  Loader2,
  Table as TableIcon,
  RefreshCw,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { adminGetTableData, adminUpdateRow, adminDeleteRow } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TABLES = [
  { id: 'patients', label: 'Patients Registry' },
  { id: 'medical_intakes', label: 'Medical Intakes' },
  { id: 'treatment_plans', label: 'Treatment Plans' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'bookings', label: 'Surgery Bookings' },
  { id: 'transactions', label: 'Transactions' },
];

export default function Settings() {
  const [selectedTable, setSelectedTable] = useState(TABLES[0].id);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Security State
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Edit State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    fetchTableData();
  }, [selectedTable]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const tableData = await adminGetTableData(selectedTable);
      setData(tableData);
    } catch (error) {
      console.error('Failed to fetch table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'access') {
      setIsEditingUnlocked(true);
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('Invalid administrative password.');
    }
  };

  const handleEditInit = (row: any) => {
    if (!isEditingUnlocked) {
      setShowPasswordModal(true);
      return;
    }
    setEditingRowId(row.id);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const updatedRow = await adminUpdateRow(selectedTable, editingRowId!, editFormData);
      setData(data.map(r => r.id === editingRowId ? updatedRow : r));
      setEditingRowId(null);
      alert('Record updated successfully.');
    } catch (error) {
      alert('Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isEditingUnlocked) {
      setShowPasswordModal(true);
      return;
    }
    if (!window.confirm('Are you sure? This will permanently delete this record from the core database.')) return;
    
    try {
      setLoading(true);
      await adminDeleteRow(selectedTable, id);
      setData(data.filter(r => r.id !== id));
    } catch (error) {
      alert('Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-slate-400 bg-slate-100 w-fit px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-2">
            <Database size={12} />
            System Administration
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Database Explorer</h1>
          <p className="text-slate-500 font-medium mt-1">Direct access to raw clinical and financial data tables.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => isEditingUnlocked ? setIsEditingUnlocked(false) : setShowPasswordModal(true)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-lg",
              isEditingUnlocked 
                ? "bg-red-50 text-red-600 shadow-red-100" 
                : "bg-slate-900 text-white shadow-slate-200"
            )}
          >
            {isEditingUnlocked ? <Lock size={18} /> : <Unlock size={18} />}
            {isEditingUnlocked ? 'Lock Database' : 'Unlock Editing'}
          </button>
          <button 
            onClick={fetchTableData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Table Selection & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
          {TABLES.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                selectedTable === table.id 
                  ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200" 
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300"
              )}
            >
              <TableIcon size={14} className="inline mr-2 mb-0.5" />
              {table.label}
            </button>
          ))}
        </div>
        <div className="h-8 w-[1px] bg-slate-100 hidden lg:block mx-2" />
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search across all fields in ${selectedTable}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Database Grid */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {data.length > 0 ? Object.keys(data[0]).map(key => (
                  <th key={key} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{key.replace('_', ' ')}</th>
                )) : (
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Field</th>
                )}
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-8 py-24 text-center">
                    <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
                    <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-xs">Accessing Supabase Engine...</p>
                  </td>
                </tr>
              ) : filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-all group">
                  {Object.entries(row).map(([key, value]) => (
                    <td key={key} className="px-6 py-4">
                      {editingRowId === row.id && !['id', 'created_at', 'signed_at', 'patient_id'].includes(key) ? (
                        key === 'data' ? (
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px]">
                            <FileJson size={14} /> JSON Object (Protected)
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={String(editFormData[key] || '')}
                            onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
                            className="bg-white border border-teal-500 rounded px-2 py-1 text-sm outline-none focus:ring-2 ring-teal-100"
                          />
                        )
                      ) : (
                        <div className="max-w-[200px] truncate text-xs font-bold text-slate-600">
                          {key === 'data' ? '{ JSON Object }' : String(value || '-')}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingRowId === row.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Save size={18} /></button>
                          <button onClick={() => setEditingRowId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditInit(row)} className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(row.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-10"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Administrative Access</h2>
                <p className="text-sm text-slate-500 font-medium">Entering Restricted Mode. Please provide the system override password to enable database editing.</p>
                
                <form onSubmit={handleUnlock} className="pt-6 space-y-4">
                  <input
                    autoFocus
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-red-500/20 focus:ring-4 focus:ring-red-500/5 rounded-2xl py-4 px-6 text-center text-lg font-black tracking-[0.5em] outline-none transition-all"
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all"
                    >
                      Unlock
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
