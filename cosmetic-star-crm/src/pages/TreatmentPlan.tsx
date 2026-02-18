import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  PoundSterling, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import api from '../services/api';

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
  { 
    id: 'fue', 
    name: 'FUE Hair Transplant', 
    defaultPrice: 2500, 
    includedItems: ['Medical Report', 'Surgery', 'Post-op Meds', '1 Year Follow-up', 'Hair Wash Set'] 
  },
  { 
    id: 'prp', 
    name: 'PRP Therapy', 
    defaultPrice: 800, 
    includedItems: ['Consultation', 'PRP Session', 'Post-treatment Care Kit'] 
  },
  { 
    id: 'micro', 
    name: 'Scalp Micropigmentation', 
    defaultPrice: 1800, 
    includedItems: ['Design Consultation', 'Full Session', 'Touch-up Session'] 
  },
  { 
    id: 'botox', 
    name: 'Anti-Wrinkle Treatment', 
    defaultPrice: 300, 
    includedItems: ['Consultation', 'Treatment', '2-week Review'] 
  }
];

export default function TreatmentPlan() {
  const { selectedPatient } = usePatient();
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const selectedService = SERVICES.find(s => s.id === selectedServiceId);
  const totalToPay = Math.max(0, cost - discount);
  const needsApproval = totalToPay < 1500 && selectedServiceId !== '';

  useEffect(() => {
    if (selectedService) {
      setCost(selectedService.defaultPrice);
      setDiscount(0);
    }
  }, [selectedServiceId]);

  const handleGenerateContract = async () => {
    if (!selectedPatient || !selectedService) return;

    try {
      setIsSaving(true);
      await api.post('/treatment-plan', {
        patient_id: selectedPatient.id,
        service_id: selectedService.id,
        service_name: selectedService.name,
        base_cost: cost,
        discount: discount,
        total_to_pay: totalToPay
      });
      alert('Treatment plan saved! Proceed to contract signature.');
    } catch (error: any) {
      console.error('Error saving treatment plan:', error);
      const message = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to save treatment plan: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-slate-100 p-6 rounded-full text-slate-400">
          <UserCircle2 size={48} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">No Patient Selected</h2>
          <p className="text-slate-500 max-w-xs mx-auto">Please select a patient first to create a treatment plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} />
            Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Treatment Plan</h1>
          <p className="text-slate-500">Configure services and financial breakdown for the patient.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Assessment</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">New Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Selection & Pricing */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Stethoscope className="text-teal-600" size={20} />
              <h2 className="font-bold text-slate-900 text-lg">Service Selection</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Select Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 px-4 text-sm outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>Choose a service...</option>
                  {SERVICES.map(service => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Cost (£)</label>
                  <div className="relative">
                    <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Discount (£)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Included Items Section */}
          {selectedService && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <FileText className="text-teal-600" size={20} />
                <h2 className="font-bold text-slate-900 text-lg">Included in Package</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedService.includedItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="text-teal-500" size={18} />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Summary Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 sticky top-24">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShieldCheck className="text-teal-400" size={20} />
              Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Base Cost</span>
                <span>£{cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Total Discount</span>
                <span className="text-teal-400">- £{discount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">Total to Pay</span>
                  <span className="text-3xl font-bold text-teal-400">£{totalToPay.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {needsApproval && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertCircle className="text-red-400 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-bold text-red-400">Manager Approval Required</p>
                  <p className="text-xs text-red-400/80 mt-0.5">Total price is below the £1,500 threshold for this clinic.</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleGenerateContract}
              disabled={needsApproval || !selectedService || isSaving}
              className={cn(
                "w-full mt-8 py-3 rounded-xl font-bold transition-all active:scale-95",
                (needsApproval || !selectedService || isSaving)
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-lg shadow-teal-500/20"
              )}
            >
              {isSaving ? 'Saving...' : 'Generate Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
