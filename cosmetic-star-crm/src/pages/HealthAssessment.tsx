import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ChevronRight, 
  ClipboardList, 
  UserCircle2, 
  Stethoscope, 
  Heart, 
  Activity, 
  AlertCircle, 
  Cigarette, 
  Wine, 
  UserCheck,
  Loader2,
  Pill,
  History,
  ShieldAlert,
  Thermometer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { saveAssessment, getAssessment } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuestionProps {
  label: string;
  value: boolean | null;
  details: string;
  onChange: (value: boolean, details: string) => void;
  placeholder?: string;
  detailLabel?: string;
}

const YesNoQuestion: React.FC<QuestionProps> = ({ 
  label, value, details, onChange, placeholder = "Provide details...", detailLabel = "Details" 
}) => {
  return (
    <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all hover:bg-slate-50 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-lg w-fit shrink-0">
          <button type="button" onClick={() => onChange(true, details)} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", value === true ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Yes</button>
          <button type="button" onClick={() => onChange(false, '')} className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-all", value === false ? "bg-white text-slate-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>No</button>
        </div>
      </div>
      {value === true && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">{detailLabel}</label>
          <textarea value={details} onChange={(e) => onChange(true, e.target.value)} placeholder={placeholder} className="w-full bg-white border border-slate-200 focus:border-teal-500 rounded-lg py-2 px-3 text-sm outline-none min-h-[60px] transition-all" />
        </div>
      )}
    </div>
  );
};

export default function HealthAssessment() {
  const { selectedPatient } = usePatient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gpName: '',
    occupation: '',
    currentMedications: '',
    pastSurgeries: '',
    alopeciaGrade: 'N/A',
    skinType: 'Type I',
    questions: {
      psoriasis: { value: null as boolean | null, details: '' },
      keloid: { value: null as boolean | null, details: '' },
      infection: { value: null as boolean | null, details: '' },
      hypertension: { value: null as boolean | null, details: '' },
      bloodThinners: { value: null as boolean | null, details: '' },
      pacemaker: { value: null as boolean | null, details: '' },
      diabetes: { value: null as boolean | null, details: '' },
      hivHepatitis: { value: null as boolean | null, details: '' },
      anaesthesiaAllergy: { value: null as boolean | null, details: '' },
      covidHistory: { value: null as boolean | null, details: '' },
      smoking: { value: null as boolean | null, details: '' },
      alcohol: { value: null as boolean | null, details: '' },
    }
  });

  useEffect(() => { if (selectedPatient) loadAssessment(); }, [selectedPatient]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await getAssessment(selectedPatient!.id);
      if (data && data.data) setFormData(data.data);
    } catch (error) { console.error('Load error:', error); } finally { setLoading(false); }
  };

  const handleQuestionChange = (id: keyof typeof formData.questions, value: boolean, details: string) => {
    setFormData(prev => ({ ...prev, questions: { ...prev.questions, [id]: { value, details } } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setLoading(true);
      await saveAssessment(selectedPatient.id, formData);
      alert('Clinical Assessment Saved Successfully');
    } catch (error: any) { alert('Save failed'); } finally { setLoading(false); }
  };

  if (!selectedPatient) return <div className="py-20 text-center text-slate-500">Please select a patient first.</div>;
  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} /> Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Assessment</h1>
          <p className="text-slate-500 font-medium">Full medical history and diagnostic profile.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-left">
        {/* Section 1: Clinical Identity */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Stethoscope className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">1. Administrative Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">GP Name / Surgery</label>
              <input type="text" value={formData.gpName} onChange={(e) => setFormData({...formData, gpName: e.target.value})} placeholder="e.g. Manchester Central Clinic" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none" />
            </div>
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Occupation</label>
              <input type="text" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} placeholder="Patient occupation" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none" />
            </div>
          </div>
        </section>

        {/* Section 2: Clinical Diagnostics */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <ShieldAlert className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">2. Clinical Diagnostics</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Alopecia Grade (Norwood/Ludwig)</label>
              <select value={formData.alopeciaGrade} onChange={(e) => setFormData({...formData, alopeciaGrade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none">
                <option value="N/A">N/A</option><option value="Grade I">Grade I</option><option value="Grade II">Grade II</option><option value="Grade III">Grade III</option><option value="Grade IV">Grade IV</option><option value="Grade V">Grade V</option>
              </select>
            </div>
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase">Fitzpatrick Skin Type</label>
              <select value={formData.skinType} onChange={(e) => setFormData({...formData, skinType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm outline-none">
                <option value="Type I">Type I (Very Fair)</option><option value="Type II">Type II (Fair)</option><option value="Type III">Type III (Medium)</option><option value="Type IV">Type IV (Olive)</option><option value="Type V">Type V (Brown)</option><option value="Type VI">Type VI (Black)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 3: Medications & History */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Pill className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">3. Medications & Surgical History</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Pill size={14}/> Current Medications</label>
              <textarea value={formData.currentMedications} onChange={(e) => setFormData({...formData, currentMedications: e.target.value})} placeholder="List all current medications and dosages..." className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm outline-none min-h-[80px]" />
            </div>
            <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><History size={14}/> Past Surgeries</label>
              <textarea value={formData.pastSurgeries} onChange={(e) => setFormData({...formData, pastSurgeries: e.target.value})} placeholder="List any previous major surgeries or aesthetic procedures..." className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm outline-none min-h-[80px]" />
            </div>
          </div>
        </section>

        {/* Section 4: Medical Questions */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <AlertCircle className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">4. Medical Screening</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion label="Psoriasis or Eczema on the scalp?" value={formData.questions.psoriasis.value} details={formData.questions.psoriasis.details} onChange={(v, d) => handleQuestionChange('psoriasis', v, d)} />
            <YesNoQuestion label="History of Keloid scarring?" value={formData.questions.keloid.value} details={formData.questions.keloid.details} onChange={(v, d) => handleQuestionChange('keloid', v, d)} />
            <YesNoQuestion label="Allergies to Local Anaesthesia (Lidocaine)?" value={formData.questions.anaesthesiaAllergy.value} details={formData.questions.anaesthesiaAllergy.details} onChange={(v, d) => handleQuestionChange('anaesthesiaAllergy', v, d)} />
            <YesNoQuestion label="Diabetes (Type 1 or 2)?" value={formData.questions.diabetes.value} details={formData.questions.diabetes.details} onChange={(v, d) => handleQuestionChange('diabetes', v, d)} />
            <YesNoQuestion label="Covid-19 History / Respiratory Issues?" value={formData.questions.covidHistory.value} details={formData.questions.covidHistory.details} onChange={(v, d) => handleQuestionChange('covidHistory', v, d)} />
          </div>
        </section>

        {/* Section 5: Lifestyle */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Cigarette className="text-teal-600" size={20} /><h2 className="font-bold text-slate-900">5. Lifestyle Habits</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion label="Do you smoke?" value={formData.questions.smoking.value} details={formData.questions.smoking.details} onChange={(v, d) => handleQuestionChange('smoking', v, d)} detailLabel="Frequency" placeholder="e.g. 10 per day" />
            <YesNoQuestion label="Do you drink alcohol?" value={formData.questions.alcohol.value} details={formData.questions.alcohol.details} onChange={(v, d) => handleQuestionChange('alcohol', v, d)} detailLabel="Units" placeholder="e.g. 14 units/week" />
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40">
          <div className="max-w-4xl mx-auto flex justify-end px-6"><button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-600/20 transition-all active:scale-95">Save Clinical Assessment</button></div>
        </div>
      </form>
    </div>
  );
}
