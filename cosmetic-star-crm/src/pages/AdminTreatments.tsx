import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Stethoscope,
  PoundSterling,
  Loader2,
  Tag,
  Palette,
  ClipboardList
} from 'lucide-react';
import { adminGetServices, adminCreateService, adminUpdateService, adminDeleteService } from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Service {
  id: string;
  name: string;
  base_price: number;
  description: string;
  color_code: string;
  is_active: boolean;
}

export default function AdminTreatments() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    description: '',
    color_code: '#0d9488'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await adminGetServices();
      setServices(data);
    } catch {
      /* fetch error */
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        name: service.name,
        base_price: service.base_price.toString(),
        description: service.description || '',
        color_code: service.color_code
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', base_price: '', description: '', color_code: '#0d9488' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price)
      };

      if (editingId) {
        await adminUpdateService(editingId, payload);
      } else {
        await adminCreateService(payload);
      }
      
      setIsModalOpen(false);
      fetchServices();
    } catch (error) {
      alert('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this service? This may affect existing treatment plans.')) return;
    try {
      await adminDeleteService(id);
      fetchServices();
    } catch (error) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-2">
            <Stethoscope size={12} />
            Clinical Configuration
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Management</h1>
          <p className="text-slate-500 font-medium">Define clinic treatments, pricing models, and visual branding.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Treatment
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
                  </td>
                </tr>
              ) : services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: s.color_code }} />
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-lg leading-tight break-words">{s.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate max-w-[300px]">{s.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 text-slate-900 font-black">
                      <PoundSterling size={16} className="text-slate-300" />
                      {s.base_price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <code className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">{s.color_code}</code>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/form-builder/${s.id}`)} 
                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Design Clinical Form"
                      >
                        <ClipboardList size={18} />
                      </button>
                      <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-8">
              <div className="text-left">
                <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Service' : 'New Service'}</h2>
                <p className="text-slate-500 font-medium text-sm">Configure the core details of this treatment.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Treatment Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20" placeholder="e.g. PRP Hair Therapy" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Price (£)</label>
                  <div className="relative">
                    <PoundSterling className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="number" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold outline-none" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Color</label>
                  <div className="relative">
                    <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="color" value={formData.color_code} onChange={(e) => setFormData({...formData, color_code: e.target.value})} className="w-full h-[52px] bg-slate-50 border-none rounded-2xl p-1 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none resize-none" placeholder="Brief overview of the treatment..." />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-teal-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editingId ? 'Update Service' : 'Create Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
