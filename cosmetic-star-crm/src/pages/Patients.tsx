import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Loader2,
  Filter,
  UserCircle2,
  ChevronRight,
  UserCheck,
  MoreHorizontal,
  MailQuestion,
  Trash2,
  Edit
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
  id: string;
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
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Other',
    phone: '+44 ',
    email: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setEditingPatientId(patient.id);
    setFormData({
      firstName: patient.first_name,
      lastName: patient.last_name,
      dob: patient.dob || '',
      gender: patient.gender || 'Other',
      phone: patient.phone,
      email: patient.email,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this patient record? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePatient(patientId);
      setPatients(patients.filter(p => p.id !== patientId));
      if (selectedPatient?.id === patientId) {
        clearPatient();
      }
      alert('Patient deleted successfully.');
    } catch (error) {
      console.error('Delete patient error:', error);
      alert('Failed to delete patient.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patientPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
      };

      if (editingPatientId) {
        const updated = await updatePatient(editingPatientId, patientPayload);
        setPatients(patients.map(p => p.id === editingPatientId ? updated : p));
        if (selectedPatient?.id === editingPatientId) {
          setSelectedPatient(updated);
        }
        alert('Patient record updated successfully!');
      } else {
        const newPatient = await createPatient(patientPayload);
        setPatients([newPatient, ...patients]);
        setSelectedPatient(newPatient);
      }
      
      setIsModalOpen(false);
      setEditingPatientId(null);
      setFormData({ firstName: '', lastName: '', dob: '', gender: 'Other', phone: '+44 ', email: '' });
    } catch (error: any) {
      console.error('Save patient error:', error);
      const message = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to save patient: ${message}`);
    }
  };

  const openNewPatientModal = () => {
    setEditingPatientId(null);
    setFormData({ firstName: '', lastName: '', dob: '', gender: 'Other', phone: '+44 ', email: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-slate-500 font-medium mt-1">Access and manage comprehensive clinical records.</p>
        </div>
        <button 
          onClick={openNewPatientModal}
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-95"
        >
          <Plus size={20} />
          Onboard New Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or record ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
                    <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-xs">Synchronizing Records...</p>
                  </td>
                </tr>
              ) : filteredPatients.map((patient) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={patient.id} 
                  onClick={() => setSelectedPatient({
                    id: patient.id,
                    first_name: patient.first_name,
                    last_name: patient.last_name,
                    email: patient.email
                  })}
                  className={cn(
                    "hover:bg-slate-50/80 transition-all cursor-pointer group relative",
                    selectedPatient?.id === patient.id && "bg-teal-50/50"
                  )}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm",
                        selectedPatient?.id === patient.id 
                          ? "bg-teal-600 text-white scale-110 shadow-teal-200" 
                          : "bg-white border border-slate-200 text-slate-400 group-hover:border-teal-300 group-hover:text-teal-600"
                      )}>
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900">{patient.first_name} {patient.last_name}</p>
                          {selectedPatient?.id === patient.id && (
                            <div className="bg-teal-500 rounded-full p-0.5">
                              <UserCheck size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {patient.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5 text-sm font-medium">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                        {patient.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-500">
                    <div className="flex items-center gap-2 uppercase tracking-tight">
                      <CalendarIcon size={14} className="text-slate-300" />
                      {new Date(patient.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      patient.status === 'Completed' ? "bg-green-50 text-green-700 border-green-100" :
                      patient.status === 'Treatment Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-teal-50 text-teal-700 border-teal-100"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        patient.status === 'Completed' ? "bg-green-500" :
                        patient.status === 'Treatment Pending' ? "bg-amber-500" : "bg-teal-500"
                      )} />
                      {patient.status || 'Active Record'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => handleEditClick(e, patient)}
                        className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                        title="Edit Patient"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(e, patient.id)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Patient"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                  {selectedPatient?.id === patient.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500 rounded-r-full" />
                  )}
                </motion.tr>
              ))}
              {filteredPatients.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300 mb-6 border-2 border-dashed border-slate-200">
                      <MailQuestion size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No records found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">We couldn't find any patient matching your search. Double check the spelling or add a new record.</p>
                    <button 
                      onClick={openNewPatientModal}
                      className="mt-8 text-teal-600 font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-50 px-6 py-3 rounded-2xl transition-all"
                    >
                      Initialize New Record
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Patient Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#FBFBFE] rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-10 border-b border-slate-100 bg-white">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingPatientId ? 'Update Record' : 'Patient Onboarding'}
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">
                    {editingPatientId ? 'Modify existing clinical data.' : 'Register a new clinical profile.'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 text-slate-400 hover:text-slate-900 p-3 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
                    <input
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm"
                      placeholder="e.g. Sarah"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Last Name</label>
                    <input
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm"
                      placeholder="e.g. Johnson"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Date of Birth</label>
                    <input
                      required
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Biological Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">UK Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm"
                      placeholder="+44 7000 000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border-2 border-slate-100 focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-[1.25rem] py-3.5 px-5 text-sm font-bold outline-none transition-all shadow-sm"
                      placeholder="clinical@example.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-10 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-4 text-xs font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 rounded-2xl transition-all shadow-xl shadow-teal-600/20 active:scale-95"
                  >
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
