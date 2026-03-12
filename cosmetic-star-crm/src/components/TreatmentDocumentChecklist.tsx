import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
  X,
  FileCheck,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import DynamicFormRenderer from './DynamicFormRenderer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface DocumentItem {
  id: string;
  title: string;
  form_type: string;
  form_schema: any;
  status: 'Completed' | 'Pending';
}

interface TreatmentDocumentChecklistProps {
  dynamicForms: any[];
  patientId: number | string;
}

export default function TreatmentDocumentChecklist({ dynamicForms, patientId }: TreatmentDocumentChecklistProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeForm, setActiveForm] = useState<DocumentItem | null>(null);

  useEffect(() => {
    // Transform the raw dynamicForms from DB into the UI DocumentItem structure
    const docs: DocumentItem[] = dynamicForms.map(f => ({
      id: f.id,
      title: f.title,
      form_type: f.form_type,
      form_schema: f.form_schema,
      status: 'Pending' // Initial state, logic can be added to check completion
    }));
    setDocuments(docs);
  }, [dynamicForms]);

  const handleFillForm = (doc: DocumentItem) => {
    setActiveForm(doc);
  };

  const handleFormSubmit = (data: any) => {
    console.log('Form Submitted for:', activeForm?.title, data);
    
    // Update local state to show 'Completed' for demonstration
    if (activeForm) {
      setDocuments(prev => prev.map(d => 
        d.id === activeForm.id ? { ...d, status: 'Completed' } : d
      ));
    }
    
    setActiveForm(null);
    alert(`${activeForm?.title} processed successfully.`);
  };

  // Helper to get icon based on form type
  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'medical questionnaire': return Stethoscope;
      case 'consent form': return ShieldCheck;
      case 'pre-op checklist': return ClipboardList;
      case 'discharge summary': return FileCheck;
      default: return FileText;
    }
  };

  if (dynamicForms.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">
          No automated documents linked to this service yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="text-left">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Compliance Lifecycle</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] mt-1 italic">Service-Specific Protocols</p>
        </div>
        <div className="bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest">Active Check</span>
        </div>
      </div>

      <div className="space-y-3">
        {documents.map((doc, idx) => {
          const IconComp = getIcon(doc.form_type);
          
          return (
            <div 
              key={doc.id}
              className={cn(
                "group bg-white rounded-[2rem] border-2 p-5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                doc.status === 'Completed' 
                  ? "border-teal-50 shadow-sm opacity-80" 
                  : "border-slate-100 shadow-lg hover:border-teal-500/20 shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    doc.status === 'Completed' ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  )}>
                    {doc.status === 'Completed' ? <CheckCircle2 size={20} /> : <IconComp size={20} />}
                  </div>
                  {idx < documents.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-slate-100" />
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">{doc.form_type}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-600 transition-colors break-words leading-snug">{doc.title}</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {doc.status === 'Completed' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg font-black text-[8px] uppercase tracking-widest border border-teal-100 whitespace-nowrap">
                    <CheckCircle2 size={12} />
                    Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg font-black text-[8px] uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                      <Clock size={12} />
                      Pending
                    </div>
                    <button 
                      onClick={() => handleFillForm(doc)}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all active:scale-95 shadow-md whitespace-nowrap"
                    >
                      Fill Form
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Form Modal */}
      <AnimatePresence>
        {activeForm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveForm(null)} 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-transparent"
            >
              <button 
                onClick={() => setActiveForm(null)}
                className="absolute top-6 right-6 z-[160] p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all border border-white/10 shadow-xl"
              >
                <X size={20} />
              </button>
              
              <div className="py-10 px-2 sm:px-6">
                <DynamicFormRenderer 
                  formSchema={activeForm.form_schema}
                  title={activeForm.title}
                  description={`Regulatory requirement for: ${activeForm.form_type}`}
                  onSubmit={handleFormSubmit}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
