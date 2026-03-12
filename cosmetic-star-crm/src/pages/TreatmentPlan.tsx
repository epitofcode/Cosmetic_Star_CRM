import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  PoundSterling, 
  Tag, 
  CheckCircle2, 
  FileText,
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Loader2,
  Clock,
  Clipboard,
  Scissors,
  Locate,
  Save,
  Calendar as CalendarIcon,
  Settings2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { getTreatmentPlan, saveTreatmentPlan, getBooking } from '../services/api';
import TreatmentDocumentChecklist from '../components/TreatmentDocumentChecklist';
import ClinicalPhotoManager from '../components/ClinicalPhotoManager';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  includedItems: string[];
}

const SERVICES: Service[] = [
  { id: 'fue', name: 'FUE Hair Transplant', defaultPrice: 2500, includedItems: ['Medical Report', 'Surgery', 'Post-op Meds', '1 Year Follow-up', 'Hair Wash Set'] },
  { id: 'prp', name: 'PRP Therapy', defaultPrice: 800, includedItems: ['Consultation', 'PRP Session', 'Post-treatment Care Kit'] },
  { id: 'micro', name: 'Scalp Micropigmentation', defaultPrice: 1800, includedItems: ['Design Consultation', 'Full Session', 'Touch-up Session'] },
  { id: 'botox', name: 'Anti-Wrinkle Treatment', defaultPrice: 300, includedItems: ['Consultation', 'Treatment', '2-week Review'] }
];

export default function TreatmentPlan() {
  const { selectedPatient } = usePatient();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(1);
  const [graftCount, setGraftCount] = useState('');
  const [treatmentArea, setTreatmentArea] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlanExisting, setIsPlanExisting] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  useEffect(() => { 
    if (selectedPatient) {
      fetchExistingPlan();
      fetchNextAppointment();
    }
  }, [selectedPatient]);

  const fetchExistingPlan = async () => {
    try {
      setLoading(true);
      const plan = await getTreatmentPlan(selectedPatient!.id);
      if (plan) {
        setSelectedServiceId(plan.service_id);
        setCost(Number(plan.base_cost));
        setDiscount(Number(plan.discount));
        setTotalSessions(plan.total_sessions || 1);
        setGraftCount((plan as any).graft_count || '');
        setTreatmentArea((plan as any).treatment_area || '');
        setNotes((plan as any).notes || '');
        setStatus(plan.status || 'Active');
        setIsPlanExisting(true);
      } else { setIsPlanExisting(false); }
    } catch (error) { console.error('Load error:', error); } finally { setLoading(false); }
  };

  const fetchNextAppointment = async () => {
    try {
      const bookings = await getBooking(selectedPatient!.id);
      if (bookings && bookings.length > 0) {
        const now = new Date();
        const future = bookings
          .filter((b: any) => new Date(b.date) >= now)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setNextAppointment(future[0] || bookings[0]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const selectedService = SERVICES.find(s => s.id === selectedServiceId);
  const totalToPay = Math.max(0, cost - discount);

  useEffect(() => {
    if (selectedService && !loading && !isPlanExisting) {
      setCost(selectedService.defaultPrice);
      setDiscount(0);
    }
  }, [selectedServiceId]);

  const handleSavePlan = async (targetStatus = 'Active') => {
    if (!selectedPatient || !selectedService) return;
    try {
      setIsSaving(true);
      await saveTreatmentPlan({
        patient_id: selectedPatient.id,
        service_id: selectedService.id,
        service_name: selectedService.name,
        base_cost: cost,
        discount: discount,
        total_to_pay: totalToPay,
        total_sessions: totalSessions,
        graft_count: graftCount,
        treatment_area: treatmentArea,
        notes: notes,
        status: targetStatus
      });
      setStatus(targetStatus);
      setIsPlanExisting(true);
      alert('Treatment plan saved successfully!');
    } catch (error: any) { 
      console.error('Save failed:', error);
      alert(`Save failed: ${error.response?.data?.error || error.message}`); 
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPatient) return <div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Please select a patient first.</div>;
  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  return (
    <div className="space-y-10 pb-32">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start text-left">
        
        {/* Left Column: Main Workspace */}
        <div className="xl:col-span-8 space-y-10 min-w-0">
          
          {/* 1. Patient Header Card */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center text-teal-600 font-black text-2xl shadow-inner">
                  {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-black text-slate-900">{selectedPatient.first_name} {selectedPatient.last_name}</h1>
                    <span className="bg-teal-500 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><UserCircle2 size={14} className="text-teal-500" /> ID: {selectedPatient.id}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-teal-500" /> Clinical Session</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-right">System Status</div>
                <div className="text-xs font-black text-teal-600 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 uppercase tracking-widest animate-pulse">Live Synchronization</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          </div>

          {/* 2. Procedure & Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Stethoscope className="text-teal-600" size={20} />
                  <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Procedure Setup</h2>
                </div>
                <Settings2 size={16} className="text-slate-300" />
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Service</label>
                  <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20">
                    <option value="" disabled>Select Procedure...</option>
                    {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Grafts</div>
                    <input type="text" value={graftCount} onChange={(e) => setGraftCount(e.target.value)} placeholder="0" className="w-full bg-transparent border-none p-0 text-lg font-black text-slate-900 outline-none placeholder:text-slate-300" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Area</div>
                    <input type="text" value={treatmentArea} onChange={(e) => setTreatmentArea(e.target.value)} placeholder="None" className="w-full bg-transparent border-none p-0 text-lg font-black text-slate-900 outline-none placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                <CalendarIcon className="text-teal-600" size={20} />
                <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Next Session</h2>
              </div>
              <div className="p-8">
                {nextAppointment ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-teal-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-teal-600/20">
                        <span className="text-[10px] font-black uppercase">{format(new Date(nextAppointment.date), 'MMM')}</span>
                        <span className="text-xl font-black">{format(new Date(nextAppointment.date), 'dd')}</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{nextAppointment.time_slot}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Clinic • Room 04</p>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UserCheck size={14} /></div>
                        <span className="text-xs font-bold text-slate-600">Kavya Sangameswara</span>
                      </div>
                      <button onClick={() => window.location.href = '/calendar'} className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700 transition-colors">Reschedule</button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">No sessions booked yet</p>
                    <button onClick={() => window.location.href = '/calendar'} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">Schedule Now</button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* 3. Clinical Observations Workspace */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[400px]">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clipboard className="text-teal-600" size={20} />
                <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Clinical Observations & Consultant Instructions</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Draft Mode
              </div>
            </div>
            <div className="p-8">
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Start typing clinical observations, procedure notes, or specific post-operative instructions for the discharge summary..." 
                className="w-full bg-slate-50/50 border-2 border-transparent focus:border-teal-500/10 focus:bg-white rounded-[2rem] p-8 text-slate-700 font-medium leading-relaxed outline-none min-h-[300px] resize-none transition-all placeholder:text-slate-300 shadow-inner" 
              />
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => handleSavePlan('Active')} 
                  disabled={isSaving} 
                  className="bg-slate-900 hover:bg-teal-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                >
                  <Save size={18} />
                  {isSaving ? 'Synchronizing...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </section>

          {/* 4. Clinical Media Gallery */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-10 overflow-hidden">
            <ClinicalPhotoManager patientId={selectedPatient.id} />
          </section>
        </div>

        {/* Right Column: Compliance Sidebar (Sticky) */}
        <div className="xl:col-span-4 space-y-10 xl:sticky xl:top-[104px] pb-10">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-teal-400">
                <ShieldCheck size={20} />
                Billing
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-500/20 bg-teal-500/10 text-teal-400">{status}</span>
            </div>
            <div className="space-y-4 text-left relative z-10">
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider"><span>Balance Due</span><span className="text-white text-base">£{totalToPay.toLocaleString()}</span></div>
              <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider"><span>Sessions</span><span className="text-white text-base">{totalSessions} Units</span></div>
              
              <div className="pt-6 mt-4 border-t border-white/5 space-y-3">
                <button 
                  onClick={() => handleSavePlan('Active')} 
                  disabled={!selectedService || isSaving || status === 'Completed'} 
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl", 
                    (!selectedService || isSaving || status === 'Completed') ? "bg-slate-800 text-slate-500" : "bg-teal-500 text-slate-900 hover:bg-teal-400"
                  )}
                >
                  {isSaving ? 'Processing...' : status === 'Completed' ? 'Plan Finalised' : 'Save & Finalise Plan'}
                </button>
                {isPlanExisting && status === 'Active' && (
                  <button onClick={() => handleSavePlan('Completed')} disabled={isSaving} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                    <CheckCircle2 size={16} /> Finalise Patient Exit
                  </button>
                )}
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-2 overflow-hidden">
            <TreatmentDocumentChecklist />
          </div>
        </div>
      </div>
    </div>
  );
}
