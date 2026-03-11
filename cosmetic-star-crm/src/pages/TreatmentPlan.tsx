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
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { getTreatmentPlan, saveTreatmentPlan } from '../services/api';

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
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlanExisting, setIsPlanExisting] = useState(false);

  useEffect(() => { if (selectedPatient) fetchExistingPlan(); }, [selectedPatient]);

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
        setNextPaymentDate((plan as any).next_payment_due_date || '');
        setStatus(plan.status || 'Active');
        setIsPlanExisting(true);
      } else { setIsPlanExisting(false); }
    } catch (error) { console.error('Load error:', error); } finally { setLoading(false); }
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
        next_payment_due_date: nextPaymentDate,
        status: targetStatus
      });
      setStatus(targetStatus);
      setIsPlanExisting(true);
      alert('Clinical Treatment Plan Finalised Successfully');
    } catch (error: any) { alert('Save failed'); } finally { setIsSaving(false); }
  };

  if (!selectedPatient) return <div className="py-20 text-center text-slate-500">Please select a patient first.</div>;
  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} /> Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Treatment Configuration</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:order-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="text-teal-400" size={20} />Summary</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-teal-500/20 text-teal-400">{status}</span>
            </div>
            <div className="space-y-4 text-left">
              <div className="flex justify-between text-slate-400 text-sm"><span>Base Cost</span><span>£{cost.toLocaleString()}</span></div>
              <div className="flex justify-between text-slate-400 text-sm"><span>Total Discount</span><span className="text-teal-400">- £{discount.toLocaleString()}</span></div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-medium text-slate-300">Total to Pay</span>
                <span className="text-2xl font-bold text-teal-400">£{totalToPay.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-3 mt-8">
              <button onClick={() => handleSavePlan('Active')} disabled={!selectedService || isSaving || status === 'Completed'} className={cn("w-full py-3 rounded-xl font-bold transition-all active:scale-95", (!selectedService || isSaving || status === 'Completed') ? "bg-slate-800 text-slate-500" : "bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/20")}>
                {isSaving ? 'Processing...' : status === 'Completed' ? 'Plan Finalised' : 'Save & Finalise Plan'}
              </button>
              {isPlanExisting && status === 'Active' && (
                <button onClick={() => handleSavePlan('Completed')} disabled={isSaving} className="w-full py-3 rounded-xl font-bold border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Complete Journey
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 lg:order-1 space-y-8 text-left">
          {/* Procedure Configuration */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Stethoscope className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">1. Service Selection</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Procedure</label>
                <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none">
                  <option value="" disabled>Choose a service...</option>
                  {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Graft Count (For Hair Procedures)</label>
                  <div className="relative"><Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={graftCount} onChange={(e) => setGraftCount(e.target.value)} placeholder="e.g. 2500 Grafts" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Treatment Area</label>
                  <div className="relative"><Locate className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={treatmentArea} onChange={(e) => setTreatmentArea(e.target.value)} placeholder="e.g. Frontal Hairline / Crown" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Financial Specifics */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <PoundSterling className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">2. Financial Configuration</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Base Cost (£)</label>
                  <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none" />
                </div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Discount (£)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none" />
                </div>
                <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Total Sessions</label>
                  <input type="number" value={totalSessions} onChange={(e) => setTotalSessions(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none" />
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Calendar size={14} className="text-teal-600" /> Next Balance Collection Date</label>
                <input type="date" value={nextPaymentDate} onChange={(e) => setNextPaymentDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none focus:border-teal-500 transition-all" />
              </div>
            </div>
          </section>

          {/* Consultant Notes */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Clipboard className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">3. Consultant Notes</h2>
            </div>
            <div className="p-6">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter specific clinical instructions or consultant notes here..." className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm outline-none min-h-[120px]" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
