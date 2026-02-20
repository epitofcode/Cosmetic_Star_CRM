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
  Loader2
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
  type?: 'text' | 'number';
  detailLabel?: string;
}

const YesNoQuestion: React.FC<QuestionProps> = ({ 
  label, value, details, onChange, placeholder = "Provide relevant medical information...", detailLabel = "Please specify details" 
}) => {
  return (
    <div className="space-y-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 transition-all hover:bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => onChange(true, details)}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
              value === true 
                ? "bg-white text-teal-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false, '')}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
              value === false 
                ? "bg-white text-slate-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            No
          </button>
        </div>
      </div>
      
      {value === true && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            {detailLabel}
          </label>
          <textarea
            value={details}
            onChange={(e) => onChange(true, e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3 text-sm outline-none min-h-[80px] transition-all"
          />
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
    questions: {
      // Dermatological
      psoriasis: { value: null as boolean | null, details: '' },
      keloid: { value: null as boolean | null, details: '' },
      infection: { value: null as boolean | null, details: '' },
      // Cardiovascular
      hypertension: { value: null as boolean | null, details: '' },
      bloodThinners: { value: null as boolean | null, details: '' },
      pacemaker: { value: null as boolean | null, details: '' },
      // General Health
      diabetes: { value: null as boolean | null, details: '' },
      hivHepatitis: { value: null as boolean | null, details: '' },
      anesthesiaAllergy: { value: null as boolean | null, details: '' },
      // Lifestyle
      smoking: { value: null as boolean | null, details: '' },
      alcohol: { value: null as boolean | null, details: '' },
    }
  });

  useEffect(() => {
    if (selectedPatient) {
      loadAssessment();
    }
  }, [selectedPatient]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await getAssessment(selectedPatient!.id);
      if (data && data.data) {
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (id: keyof typeof formData.questions, value: boolean, details: string) => {
    setFormData(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [id]: { value, details }
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setLoading(true);
      await saveAssessment(selectedPatient.id, formData);
      alert('Assessment saved successfully!');
    } catch (error) {
      console.error('Save assessment error:', error);
      alert('Failed to save assessment.');
    } finally {
      setLoading(false);
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
          <p className="text-slate-500 max-w-xs mx-auto">Please go to the Patients page and select a patient to start an assessment.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium font-black uppercase tracking-widest text-xs">Accessing Medical Records...</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Health Assessment</h1>
          <p className="text-slate-500">Comprehensive medical consultation form.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Patients</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">New Assessment</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-24">
        {/* Section 1: General Info */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <UserCircle2 className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Section 1: General Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">GP Name / Surgery</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.gpName}
                  onChange={(e) => setFormData({ ...formData, gpName: e.target.value })}
                  placeholder="Enter GP details"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Enter current occupation"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 px-4 text-sm outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Dermatological */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Activity className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Section 2: Dermatological</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion
              label="Do you suffer from Psoriasis or Eczema on the scalp?"
              value={formData.questions.psoriasis.value}
              details={formData.questions.psoriasis.details}
              onChange={(v, d) => handleQuestionChange('psoriasis', v, d)}
            />
            <YesNoQuestion
              label="Do you have a history of Keloid scarring?"
              value={formData.questions.keloid.value}
              details={formData.questions.keloid.details}
              onChange={(v, d) => handleQuestionChange('keloid', v, d)}
            />
            <YesNoQuestion
              label="Do you have an active scalp infection or folliculitis?"
              value={formData.questions.infection.value}
              details={formData.questions.infection.details}
              onChange={(v, d) => handleQuestionChange('infection', v, d)}
            />
          </div>
        </section>

        {/* Section 3: Cardiovascular */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Heart className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Section 3: Cardiovascular</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion
              label="Do you have high blood pressure?"
              value={formData.questions.hypertension.value}
              details={formData.questions.hypertension.details}
              onChange={(v, d) => handleQuestionChange('hypertension', v, d)}
            />
            <YesNoQuestion
              label="Are you taking any blood thinners (e.g., Aspirin, Warfarin)?"
              value={formData.questions.bloodThinners.value}
              details={formData.questions.bloodThinners.details}
              onChange={(v, d) => handleQuestionChange('bloodThinners', v, d)}
            />
            <YesNoQuestion
              label="Do you have a pacemaker?"
              value={formData.questions.pacemaker.value}
              details={formData.questions.pacemaker.details}
              onChange={(v, d) => handleQuestionChange('pacemaker', v, d)}
            />
          </div>
        </section>

        {/* Section 4: General Health */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <AlertCircle className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Section 4: General Health</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion
              label="Do you have Diabetes (Type 1 or 2)?"
              value={formData.questions.diabetes.value}
              details={formData.questions.diabetes.details}
              onChange={(v, d) => handleQuestionChange('diabetes', v, d)}
            />
            <YesNoQuestion
              label="Have you tested positive for Hepatitis B/C or HIV?"
              value={formData.questions.hivHepatitis.value}
              details={formData.questions.hivHepatitis.details}
              onChange={(v, d) => handleQuestionChange('hivHepatitis', v, d)}
            />
            <YesNoQuestion
              label="Do you have any allergies to local anesthesia (Lidocaine)?"
              value={formData.questions.anesthesiaAllergy.value}
              details={formData.questions.anesthesiaAllergy.details}
              onChange={(v, d) => handleQuestionChange('anesthesiaAllergy', v, d)}
            />
          </div>
        </section>

        {/* Section 5: Lifestyle */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Cigarette className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Section 5: Lifestyle</h2>
          </div>
          <div className="p-6 space-y-4">
            <YesNoQuestion
              label="Do you smoke?"
              value={formData.questions.smoking.value}
              details={formData.questions.smoking.details}
              onChange={(v, d) => handleQuestionChange('smoking', v, d)}
              detailLabel="How many per day?"
              placeholder="e.g. 10 cigarettes per day"
            />
            <YesNoQuestion
              label="Do you drink alcohol?"
              value={formData.questions.alcohol.value}
              details={formData.questions.alcohol.details}
              onChange={(v, d) => handleQuestionChange('alcohol', v, d)}
              detailLabel="Units per week?"
              placeholder="e.g. 14 units per week"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40">
          <div className="max-w-4xl mx-auto flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Save size={20} />
              Save Assessment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
