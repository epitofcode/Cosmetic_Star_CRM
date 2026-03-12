import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
  X,
  FileCheck
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
  type: string;
  status: 'Completed' | 'Pending';
  icon: React.ElementType;
  schema?: any; // To be passed to DynamicFormRenderer
}

// --- Mock Data for Visual Representation ---
const MOCK_DOCUMENTS: DocumentItem[] = [
  { 
    id: '1', 
    title: 'Medical Questionnaire', 
    type: 'Intake', 
    status: 'Completed', 
    icon: Stethoscope 
  },
  { 
    id: '2', 
    title: 'Stage 1 Consent', 
    type: 'Legal', 
    status: 'Pending', 
    icon: ShieldCheck,
    schema: {
      version: '1.0',
      fields: [
        { type: 'Checkbox', label: 'I understand the risks of the procedure.', required: true },
        { type: 'Signature Pad', label: 'Patient Signature', required: true }
      ]
    }
  },
  { 
    id: '3', 
    title: 'Pre-Op Checklist', 
    type: 'Clinical', 
    status: 'Pending', 
    icon: ClipboardList 
  },
  { 
    id: '4', 
    title: 'Treatment Record', 
    type: 'Clinical', 
    status: 'Pending', 
    icon: FileText 
  },
  { 
    id: '5', 
    title: 'Discharge Summary', 
    type: 'Clinical', 
    status: 'Pending', 
    icon: FileCheck 
  }
];

export default function TreatmentDocumentChecklist() {
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [activeForm, setActiveForm] = useState<DocumentItem | null>(null);

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
    
    // Close modal
    setActiveForm(null);
    alert(`${activeForm?.title} marked as Completed.`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Document Lifecycle</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Procedure Chronology & Compliance</p>
        </div>
        <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">In Progress</span>
        </div>
      </div>

      <div className="space-y-4">
        {documents.map((doc, idx) => (
          <div 
            key={doc.id}
            className={cn(
              "group bg-white rounded-[2rem] border-2 p-6 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6",
              doc.status === 'Completed' 
                ? "border-teal-50 shadow-sm opacity-80" 
                : "border-slate-100 shadow-xl hover:border-teal-500/20 shadow-slate-200/50"
            )}
          >
            <div className="flex items-center gap-6 min-w-0">
              {/* Chronological Connector Line Logic (Simplified for CSS) */}
              <div className="relative shrink-0">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  doc.status === 'Completed' ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                )}>
                  {doc.status === 'Completed' ? <CheckCircle2 size={24} /> : <doc.icon size={24} />}
                </div>
                {idx < documents.length - 1 && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-slate-100" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{doc.type}</span>
                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Step {idx + 1}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-600 transition-colors break-words">{doc.title}</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              {doc.status === 'Completed' ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-teal-100 whitespace-nowrap">
                  <CheckCircle2 size={14} />
                  Completed
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                    <Clock size={14} />
                    Pending
                  </div>
                  <button 
                    onClick={() => handleFillForm(doc)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-teal-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200 whitespace-nowrap"
                  >
                    Fill Form
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Form Modal */}
      <AnimatePresence>
        {activeForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveForm(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setActiveForm(null)}
                className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
              >
                <X size={24} />
              </button>
              
              <DynamicFormRenderer 
                formSchema={activeForm.schema || {
                  version: '1.0',
                  fields: [
                    { type: 'Short Text', label: 'Patient Verification ID', required: true },
                    { type: 'Long Text', label: 'Clinical Observations', required: false },
                    { type: 'Checkbox', label: 'Safe to Proceed', required: true }
                  ],
                  createdAt: new Date().toISOString()
                }}
                title={activeForm.title}
                description={`Finalizing clinical documentation for: ${activeForm.title}`}
                onSubmit={handleFormSubmit}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
