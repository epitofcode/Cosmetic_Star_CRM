import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { getFormsForService, staffCreatePatientForm } from '../services/api';
import type { FormTemplate } from '../services/api';
import DynamicFormRenderer from './DynamicFormRenderer';

interface PatientFormFillerProps {
  serviceId: string;
  patientId: number | string;
  onComplete?: () => void;
}

export default function PatientFormFiller({ serviceId, patientId, onComplete }: PatientFormFillerProps) {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFormIdx, setActiveFormIdx] = useState<number | null>(null);

  useEffect(() => {
    if (serviceId) {
      fetchForms();
    }
  }, [serviceId]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const data = await getFormsForService(serviceId);
      setForms(data || []);
    } catch {
      /* fetch error */
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (answers: Record<string, unknown>) => {
    if (activeFormIdx === null) return;
    
    const template = forms[activeFormIdx];
    try {
      setLoading(true);
      await staffCreatePatientForm({
        patient_id: patientId,
        template_id: template.id,
        answers: answers,
        // Assume staff ID is handled by Supabase Auth or a global state
        filled_by_staff_id: null 
      });
      
      alert(`Form "${template.title}" submitted successfully.`);
      setActiveFormIdx(null);
      if (onComplete) onComplete();
    } catch (err) {
      alert('Failed to save form response.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && forms.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  if (activeFormIdx !== null) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setActiveFormIdx(null)}
          className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
        >
          ← Back to forms
        </button>
        <DynamicFormRenderer 
          formSchema={forms[activeFormIdx].fields as any}
          title={forms[activeFormIdx].title}
          onSubmit={handleFormSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="text-teal-600" size={24} />
        <div>
          <h2 className="text-xl font-black text-slate-900">Required Clinical Documents</h2>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Service Specific Protocols</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {forms.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-bold italic">No dynamic forms defined for this service.</p>
          </div>
        ) : forms.map((form, idx) => (
          <button
            key={form.id}
            onClick={() => setActiveFormIdx(idx)}
            className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-teal-500/30 hover:shadow-md transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{form.form_type}</p>
                <h3 className="font-black text-slate-900">{form.title}</h3>
              </div>
            </div>
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Pending</div>
          </button>
        ))}
      </div>
    </div>
  );
}
