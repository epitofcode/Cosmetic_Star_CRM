import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileCheck, 
  Trash2, 
  CheckCircle, 
  ChevronRight, 
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { uploadSignature, checkContractStatus, getTreatmentPlan, type TreatmentPlan as TreatmentPlanType } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DigitalContractProps {
  onSign: () => void;
}

export default function DigitalContract({ onSign }: DigitalContractProps) {
  const { selectedPatient } = usePatient();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [existingSignature, setExistingSignature] = useState<string | null>(null);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => { if (selectedPatient) loadData(); }, [selectedPatient]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractRes, planRes] = await Promise.all([
        checkContractStatus(selectedPatient!.id),
        getTreatmentPlan(selectedPatient!.id)
      ]);
      
      setTreatmentPlan(planRes);
      if (contractRes.signed) {
        setIsSigned(true);
        setExistingSignature(contractRes.contract.signature_url);
      } else {
        setIsSigned(false);
        setExistingSignature(null);
      }
    } catch { /* load error */ } finally { setLoading(false); }
  };

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
    setExistingSignature(null);
  };

  const confirm = async () => {
    if (!selectedPatient || (!sigCanvas.current && !existingSignature)) return;
    if (!existingSignature && sigCanvas.current?.isEmpty()) {
      alert('Please provide a signature before confirming.');
      return;
    }
    try {
      setIsUploading(true);
      const canvas = sigCanvas.current!.getTrimmedCanvas();
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const res = await uploadSignature(selectedPatient.id, blob);
      setIsSigned(true);
      setExistingSignature(res.signature_url);
      setShowToast(true);
      onSign();
      setTimeout(() => setShowToast(false), 2000);
    } catch { alert('Save failed'); } finally { setIsUploading(false); }
  };

  if (!selectedPatient) return <div className="py-20 text-center text-slate-500">Please select a patient first.</div>;
  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} /> Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Treatment Contract</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 text-left">
        {/* Dynamic Procedure Spec Box */}
        {treatmentPlan && (
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-teal-500">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">Procedure Specification</p>
              <h2 className="text-xl font-bold leading-tight break-words">{treatmentPlan.service_name}</h2>
            </div>
            <div className="flex flex-wrap gap-8 shrink-0">
              {treatmentPlan.graft_count && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Graft Count</p>
                  <p className="font-bold text-teal-400">{treatmentPlan.graft_count}</p>
                </div>
              )}
              {treatmentPlan.treatment_area && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</p>
                  <p className="font-bold text-slate-200">{treatmentPlan.treatment_area}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <ShieldCheck className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Terms of Clinical Agreement</h2>
          </div>
          <div className="p-8 prose prose-slate max-w-none min-h-[20rem] max-h-[50vh] overflow-y-auto bg-white text-slate-600 text-sm leading-relaxed space-y-6">
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">1. Informed Consent</h3>
              <p>I hereby authorize the clinical team at Cosmetic Star to perform the procedure: <strong>{treatmentPlan?.service_name || 'Selected Treatment'}</strong>. I acknowledge that I have been fully briefed on the intended benefits and clinical steps.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">2. Specific Clinical Risks</h3>
              <p>I understand that every clinical procedure carries inherent risks. I confirm that I have disclosed my full medical history, including any previous allergies to anaesthesia.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">3. Financial Agreement</h3>
              <p>I agree to the total contract value of <strong>£{Number(treatmentPlan?.total_to_pay || 0).toLocaleString()}</strong>. I understand that deposits are non-refundable within the standard clinical cancellation window.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px]">
              By signing below, you confirm that you are over 18 years of age and the clinical data provided is accurate to the best of your knowledge.
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="text-teal-600" size={20} />
              <h2 className="font-bold text-slate-900 text-lg">Patient Signature</h2>
            </div>
          </div>
          <div className="p-6 text-center">
            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden min-h-[12rem] flex items-center justify-center">
              {existingSignature ? (
                <img src={existingSignature} alt="Verified Signature" className="max-h-48 object-contain p-4" />
              ) : (
                <SignatureCanvas ref={sigCanvas} penColor="#0f172a" canvasProps={{ className: "w-full min-h-[12rem] cursor-crosshair" }} />
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button onClick={clear} disabled={isUploading} className="text-sm font-semibold text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg">Clear & Resign</button>
              {!existingSignature && (
                <button onClick={confirm} disabled={isSigned || isUploading} className={cn("flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 w-full sm:w-auto", isSigned ? "bg-green-100 text-green-700" : "bg-teal-600 text-white shadow-teal-500/20")}>
                  {isUploading ? 'Finalising...' : isSigned ? 'Signature Verified' : 'Confirm & Sign Contract'}
                </button>
              )}
              {existingSignature && <div className="text-green-600 font-bold bg-green-50 px-6 py-3 rounded-xl border border-green-100">Signed & Verified Digitally</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
