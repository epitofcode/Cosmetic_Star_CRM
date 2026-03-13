import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  ClipboardList,
  Layout,
  CheckCircle2,
  AlertCircle,
  Type,
  AlignLeft,
  CheckSquare,
  PenTool,
  Loader2,
  ListOrdered
} from 'lucide-react';
import { adminGetServices, adminCreateFormTemplate, adminUpdateFormTemplate, getFormsForService } from '../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Service {
  id: string;
  name: string;
}

interface FieldSchema {
  type: 'Short Text' | 'Long Text' | 'Checkbox' | 'Signature Pad' | 'Multiple Choice';
  label: string;
  required: boolean;
  options?: string[]; // For choice fields
}

export default function AdminFormBuilder() {
  const { serviceId } = useParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [existingTemplateId, setExistingTemplateId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'consent' | 'intake' | 'contract'>('consent');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<FieldSchema[]>([]);

  useEffect(() => {
    fetchServices();
    if (serviceId) {
      fetchExistingTemplate(serviceId);
    }
  }, [serviceId]);

  const fetchServices = async () => {
    try {
      const data = await adminGetServices();
      setServices(data);
    } catch (err) { console.error(err); }
  };

  const fetchExistingTemplate = async (sid: string) => {
    try {
      setLoading(true);
      const data = await getFormsForService(sid);
      if (data && data.length > 0) {
        const t = data[0]; // Assuming primary form for now
        setExistingTemplateId(t.id);
        setFormType(t.form_type);
        setTitle(t.title);
        setFields(t.fields?.fields || []);
      }
    } catch (err) {
      console.error('Template load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addField = (type: FieldSchema['type']) => {
    setFields([...fields, { type, label: '', required: false, options: type === 'Multiple Choice' ? [''] : undefined }]);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<FieldSchema>) => {
    const newFields = [...fields];
    newFields[idx] = { ...newFields[idx], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!selectedServiceId || !title || fields.length === 0) {
      alert('Please select a service, title, and add at least one field.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        service_id: selectedServiceId,
        form_type: formType,
        title,
        fields: { fields }
      };

      if (existingTemplateId) {
        await adminUpdateFormTemplate(existingTemplateId, payload);
      } else {
        await adminCreateFormTemplate(payload);
      }
      
      alert('Form template published successfully!');
    } catch (err) {
      alert('Failed to publish template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-2">
            <Layout size={12} />
            Schema Designer
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Form Builder</h1>
          <p className="text-slate-500 font-medium">Design dynamic consent and intake protocols linked to specific services.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Publish Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
              <Plus size={14} className="text-teal-500" />
              Template Config
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Service</label>
                <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20">
                  <option value="">Select a service...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Form Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as any)} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20">
                  <option value="consent">Consent Form</option>
                  <option value="intake">Medical Intake</option>
                  <option value="contract">Legal Contract</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none" placeholder="e.g. PRP Consent v2" />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl space-y-6">
            <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Available Elements</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { type: 'Short Text', icon: Type },
                { type: 'Long Text', icon: AlignLeft },
                { type: 'Checkbox', icon: CheckSquare },
                { type: 'Multiple Choice', icon: ListOrdered },
                { type: 'Signature Pad', icon: PenTool }
              ].map((el) => (
                <button 
                  key={el.type}
                  onClick={() => addField(el.type as any)}
                  className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left"
                >
                  <el.icon size={18} className="text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">{el.type}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Canvas */}
        <div className="lg:col-span-8">
          <div className="bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200 p-8 min-h-[600px] space-y-4">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400">
                <Layout size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">Workspace is Empty</p>
                <p className="text-[10px] font-medium mt-1">Select elements from the left to start building.</p>
              </div>
            ) : (
              fields.map((field, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-widest">{field.type}</span>
                    <button onClick={() => removeField(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Question / Label</label>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => updateField(idx, { label: e.target.value })} 
                        className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/10" 
                        placeholder="Enter the text patients will see..."
                      />
                    </div>
                    <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all shrink-0">
                      <input 
                        type="checkbox" 
                        checked={field.required} 
                        onChange={(e) => updateField(idx, { required: e.target.checked })} 
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500" 
                      />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required</span>
                    </label>
                  </div>

                  {field.type === 'Multiple Choice' && (
                    <div className="mt-4 pt-4 border-t border-slate-50 space-y-3 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Configure Options</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {field.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2">
                            <input 
                              type="text" 
                              value={opt} 
                              onChange={(e) => {
                                const newOpts = [...(field.options || [])];
                                newOpts[optIdx] = e.target.value;
                                updateField(idx, { options: newOpts });
                              }}
                              className="flex-1 bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-bold outline-none"
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            <button 
                              onClick={() => {
                                const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                                updateField(idx, { options: newOpts });
                              }}
                              className="text-slate-300 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newOpts = [...(field.options || []), ''];
                            updateField(idx, { options: newOpts });
                          }}
                          className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black text-slate-400 hover:border-teal-500/20 hover:text-teal-600 transition-all"
                        >
                          <Plus size={12} /> Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
