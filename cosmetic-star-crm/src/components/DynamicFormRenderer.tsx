import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { 
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  PenTool,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type FieldType = 'Short Text' | 'Long Text' | 'Checkbox' | 'Signature Pad' | 'Multiple Choice';

interface FormField {
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[];
}

interface FormSchema {
  version: string;
  fields: FormField[];
  createdAt: string;
}

interface DynamicFormRendererProps {
  formSchema: FormSchema;
  onSubmit: (data: Record<string, unknown>) => void;
  title?: string;
  description?: string;
}

export default function DynamicFormRenderer({ 
  formSchema, 
  onSubmit, 
  title = "Clinical Intake Form",
  description = "Please provide accurate information for your clinical record."
}: DynamicFormRendererProps) {
  // State to hold all form answers
  // We use the label as the key for the JSON output
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sigCanvasRefs = useRef<Record<string, SignatureCanvas | null>>({});

  const handleInputChange = (label: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [label]: value }));
    // Clear error when user types
    if (errors[label]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[label];
        return newErrors;
      });
    }
  };

  const clearSignature = (label: string) => {
    sigCanvasRefs.current[label]?.clear();
    handleInputChange(label, null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const finalData: Record<string, unknown> = { ...formValues };

    // Validate and process data
    formSchema.fields.forEach(field => {
      // 1. Handle Signatures specifically
      if (field.type === 'Signature Pad') {
        const canvas = sigCanvasRefs.current[field.label];
        if (canvas && !canvas.isEmpty()) {
          finalData[field.label] = canvas.getTrimmedCanvas().toDataURL('image/png');
        } else {
          finalData[field.label] = null;
        }
      }

      // 2. Check required fields
      if (field.required) {
        const val = finalData[field.label];
        if (val === undefined || val === null || val === '' || val === false) {
          newErrors[field.label] = `${field.label} is required.`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementById(`field-${firstError}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Trigger success callback with the JSON data
    onSubmit(finalData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
      {/* Branded Header */}
      <div className="bg-slate-900 p-8 sm:p-12 text-white relative">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-teal-400 font-black uppercase tracking-[0.2em] text-[10px]">
            <CheckCircle2 size={14} />
            Clinical Verification System
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">{title}</h2>
          <p className="text-slate-400 text-sm font-medium max-w-2xl text-balance">{description}</p>
        </div>
        {/* Abstract background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
        {formSchema.fields.map((field, idx) => (
          <div 
            key={idx} 
            id={`field-${field.label}`}
            className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider break-words max-w-[80%]">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {errors[field.label] && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg shrink-0">
                  <AlertCircle size={12} />
                  Missing
                </span>
              )}
            </div>

            {field.type === 'Short Text' && (
              <input
                type="text"
                required={field.required}
                className={cn(
                  "w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-2xl py-4 px-6 outline-none transition-all placeholder:text-slate-300 font-medium",
                  errors[field.label] && "border-red-100 bg-red-50/30"
                )}
                placeholder="Type your response here..."
                onChange={(e) => handleInputChange(field.label, e.target.value)}
              />
            )}

            {field.type === 'Long Text' && (
              <textarea
                rows={4}
                required={field.required}
                className={cn(
                  "w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-2xl py-4 px-6 outline-none transition-all placeholder:text-slate-300 font-medium resize-none",
                  errors[field.label] && "border-red-100 bg-red-50/30"
                )}
                placeholder="Provide detailed information..."
                onChange={(e) => handleInputChange(field.label, e.target.value)}
              />
            )}

            {field.type === 'Checkbox' && (
              <label className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50",
                formValues[field.label] && "bg-teal-50/50 border-teal-500/20",
                errors[field.label] && "border-red-100 bg-red-50/30"
              )}>
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 bg-white transition-all checked:border-teal-500 checked:bg-teal-500 focus:outline-none"
                    onChange={(e) => handleInputChange(field.label, e.target.checked)}
                  />
                  <CheckCircle2 className="pointer-events-none absolute left-1 top-1 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-slate-600 font-bold text-sm select-none">I confirm and agree to the statement above.</span>
              </label>
            )}

            {field.type === 'Multiple Choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field.options?.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleInputChange(field.label, option)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                      formValues[field.label] === option
                        ? "bg-teal-50 border-teal-500 text-teal-900 shadow-sm"
                        : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      formValues[field.label] === option ? "border-teal-500 bg-teal-500" : "border-slate-300 bg-white"
                    )}>
                      {formValues[field.label] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-bold">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {field.type === 'Signature Pad' && (
              <div className={cn(
                "space-y-3 p-2 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all",
                errors[field.label] && "border-red-200 bg-red-50/30"
              )}>
                <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner border border-slate-100 relative group">
                  <SignatureCanvas
                    ref={(ref) => {
                      if (ref) sigCanvasRefs.current[field.label] = ref;
                    }}
                    penColor="#0f172a"
                    canvasProps={{
                      className: "w-full min-h-[12rem] cursor-crosshair"
                    }}
                    onEnd={() => handleInputChange(field.label, 'captured')}
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-300 pointer-events-none group-hover:opacity-0 transition-opacity">
                    <PenTool size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sign inside this box</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearSignature(field.label)}
                    className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm"
                    title="Clear Signature"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="px-4 py-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <Info size={12} className="text-teal-500" />
                  This digital signature is legally binding and stored securely.
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Footer Actions */}
        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            Encryption Active
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all shadow-2xl shadow-teal-600/30 hover:shadow-teal-500/40 active:scale-95 group"
          >
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            Submit Clinical Form
          </button>
        </div>
      </form>
    </div>
  );
}
