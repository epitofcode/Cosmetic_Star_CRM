import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Loader2,
  Filter,
  UserCircle2,
  ChevronRight,
  UserCheck,
  Trash2,
  Edit,
  MapPin,
  MessageSquare,
  Contact
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/api';
import { usePatient } from '../context/PatientContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
  status?: string;
  dob?: string;
  gender?: string;
}

export default function Patients() {
  const { selectedPatient, setSelectedPatient, clearPatient } = usePatient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Other',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    leadSource: 'Google'
  });

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const openNewPatientModal = () => {
    setEditingPatientId(null);
    setFormData({ firstName: '', lastName: '', dob: '', gender: 'Other', phone: '', alternatePhone: '', email: '', address: '', city: '', postcode: '', leadSource: 'Google' });
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setEditingPatientId(patient.id);
    setFormData({
      firstName: patient.first_name,
      lastName: patient.last_name,
      dob: patient.dob || '',
      gender: patient.gender || 'Other',
      phone: patient.phone,
      alternatePhone: (patient as any).alternate_phone || '',
      email: patient.email,
      address: (patient as any).address || '',
      city: (patient as any).city || '',
      postcode: (patient as any).postcode || '',
      leadSource: (patient as any).lead_source || 'Google'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, patientId: number) => {
    e.stopPropagation();
    if (!window.confirm('Permanent deletion?')) return;
    try {
      await deletePatient(patientId);
      setPatients(patients.filter(p => p.id !== patientId));
      if (selectedPatient?.id === patientId) clearPatient();
    } catch (error) { alert('Delete failed'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
        alternate_phone: formData.alternatePhone,
        address: formData.address,
        city: formData.city,
        postcode: formData.postcode,
        lead_source: formData.leadSource
      };

      if (editingPatientId) {
        const updated = await updatePatient(editingPatientId, payload);
        setPatients(patients.map(p => p.id === editingPatientId ? updated : p));
      } else {
        const newPatient = await createPatient(payload);
        setPatients([newPatient, ...patients]);
      }
      setIsModalOpen(false);
    } catch (error: any) { 
      console.error('Detailed Save Error:', error);
      const serverMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Save failed: ${serverMessage}`); 
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-slate-500 font-medium">Manage the clinic's digital clinical directory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPatients}
            className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-teal-600 rounded-2xl transition-all hover:shadow-md active:scale-95"
            title="Refresh Registry"
          >
            <Loader2 className={cn(loading && "animate-spin")} size={20} />
          </button>
          <button onClick={openNewPatientModal} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-teal-600/30 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Onboard New Patient
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20 transition-all" 
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></td></tr>
              ) : filteredPatients.map(p => (
                <tr key={p.id} onClick={() => setSelectedPatient({id: p.id, first_name: p.first_name, last_name: p.last_name, email: p.email, dob: p.dob || ''})} className={cn("hover:bg-slate-50 cursor-pointer transition-all", selectedPatient?.id === p.id && "bg-teal-50/50")}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0", selectedPatient?.id === p.id ? "bg-teal-600 text-white shadow-lg" : "bg-slate-100 text-slate-400")}>{p.first_name[0]}{p.last_name[0]}</div>
                      <div className="text-left min-w-0">
                        <p className="font-black text-slate-900 break-words">{p.first_name} {p.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell text-left min-w-[200px]">
                    <p className="text-sm font-bold text-slate-600 whitespace-nowrap">{p.phone}</p>
                    <p className="text-xs text-slate-400 break-all">{p.email}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => handleEditClick(e, p)} className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"><Edit size={18} /></button>
                      <button onClick={(e) => handleDeleteClick(e, p.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW CLEANER MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editingPatientId ? 'Update Record' : 'Patient Onboarding'}</h2>
                  <p className="text-slate-500 font-medium">Capture comprehensive clinical demographics.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 text-left">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* Section 1: Identity */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <UserCircle2 className="text-teal-600" size={20} />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal Identity</h3>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-teal-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-teal-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                        <input required type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-teal-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                        <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none cursor-pointer">
                          <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-1 mt-10">
                      <MessageSquare className="text-indigo-600" size={20} />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Marketing Attribution</h3>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Lead Source</label>
                      <select value={formData.leadSource} onChange={(e) => setFormData({...formData, leadSource: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none cursor-pointer">
                        <option value="Google">Google Search</option><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="Referral">Patient Referral</option><option value="Walk-in">Walk-in</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 2: Contact & Geography */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <Contact className="text-teal-600" size={20} />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Channels</h3>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                        <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="+44" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alt Phone</label>
                        <input type="tel" value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="Optional" />
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="patient@example.com" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-1 mt-10">
                      <MapPin className="text-orange-600" size={20} />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Postal Geography</h3>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Street Address</label>
                        <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="House no. and street" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                          <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="City" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postcode</label>
                          <input type="text" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="e.g. M1 2WD" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end gap-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                  <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-600/20 transition-all active:scale-95">
                    {editingPatientId ? 'Update Record' : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
