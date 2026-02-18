import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, MoreVertical, Phone, Mail, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getPatients, createPatient } from '../services/api';
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
  const { selectedPatient, setSelectedPatient } = usePatient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await createPatient({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        gender: formData.gender,
      });
      setPatients([newPatient, ...patients]);
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', dob: '', gender: 'Other', phone: '+44 ', email: '' });
    } catch (error: any) {
      console.error('Create patient error:', error);
      const message = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to create patient: ${message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500">Manage and view your patient database.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          New Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-lg py-2 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-teal-600 mx-auto" size={32} />
                    <p className="text-slate-500 mt-2">Loading patients...</p>
                  </td>
                </tr>
              ) : filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  onClick={() => setSelectedPatient({
                    id: patient.id,
                    first_name: patient.first_name,
                    last_name: patient.last_name,
                    email: patient.email
                  })}
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer",
                    selectedPatient?.id === patient.id && "bg-teal-50 border-l-4 border-l-teal-500"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patient.first_name} {patient.last_name}</p>
                        <p className="text-xs text-slate-500">ID: {patient.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {patient.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-slate-400" />
                      {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      patient.status === 'Completed' ? "bg-green-100 text-green-700" :
                      patient.status === 'Treatment Pending' ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {patient.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add New Patient</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                  <input
                    required
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">UK Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                    placeholder="+44 7000 000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  Create Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
