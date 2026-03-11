import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { 
  FileCheck, 
  Trash2, 
  CheckCircle, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle,
  UserCheck,
  UserCircle2,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { uploadSignature, checkContractStatus } from '../services/api';

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
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      loadContract();
    }
  }, [selectedPatient]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const res = await checkContractStatus(selectedPatient!.id);
      if (res.signed) {
        setIsSigned(true);
        setExistingSignature(res.contract.signature_url);
      } else {
        setIsSigned(false);
        setExistingSignature(null);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
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
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (error: any) {
      console.error('Signature upload error:', error);
      alert(`Failed to save signature: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-slate-100 p-6 rounded-full text-slate-400"><UserCircle2 size={48} /></div>
        <div><h2 className="text-xl font-bold text-slate-900">No Patient Selected</h2><p className="text-slate-500 max-w-xs mx-auto">Please select a patient first.</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium font-black uppercase tracking-widest text-xs">Accessing Agreement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} /> Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Treatment Contract</h1>
          <p className="text-slate-500 text-left">Please review the terms and provide your digital signature.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 text-left">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <ShieldCheck className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Terms of Clinical Agreement</h2>
          </div>
          <div className="p-8 prose prose-slate max-w-none h-[450px] overflow-y-auto bg-white text-slate-600 text-sm leading-relaxed space-y-6">
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">1. Informed Consent</h3>
              <p>I hereby authorize the clinical team at Cosmetic Star to perform the selected aesthetic procedures. I acknowledge that I have been fully briefed on the nature, purpose, and intended benefits of the treatment.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">2. Clinical Risks & Complications</h3>
              <p>I understand that while complications are rare, every clinical procedure carries inherent risks including, but not limited to, infection, scarring, or allergic reactions to anaesthesia. I confirm that I have disclosed my full medical history to the practitioner.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">3. Financial Terms & Refunds</h3>
              <p>The total contract value is as agreed in the Treatment Plan. Deposits are non-refundable within 48 hours of the scheduled surgery. I understand that payment must be settled in full according to the agreed instalment plan.</p>
            </div>
            <div>
              <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] mb-2">4. Aftercare & Follow-Up</h3>
              <p>Successful results depend on strict adherence to the post-operative care instructions provided by the clinic. I agree to attend all scheduled follow-up appointments and contact the clinic immediately if any unexpected symptoms occur.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-[11px]">
              By signing below, you confirm that you are over 18 years of age, are acting of your own free will, and have had sufficient time to consider your decision.
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="text-teal-600" size={20} />
              <h2 className="font-bold text-slate-900 text-lg">Electronic Signature</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden min-h-[12rem] sm:min-h-[16rem] flex items-center justify-center">
              {existingSignature ? (
                <img src={existingSignature} alt="Electronic Signature" className="max-h-48 sm:max-h-64 object-contain" />
              ) : (
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#0f172a"
                  canvasProps={{
                    className: "w-full h-48 sm:h-64 cursor-crosshair"
                  }}
                />
              )}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button onClick={clear} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Trash2 size={18} /> Clear & Re-sign
              </button>
              {!existingSignature && (
                <button onClick={confirm} disabled={isSigned || isUploading} className={cn("flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 w-full sm:w-auto", isSigned ? "bg-green-100 text-green-700 shadow-none cursor-default" : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20")}>
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <FileCheck size={20} />}
                  {isUploading ? 'Saving...' : 'Confirm & Sign'}
                </button>
              )}
              {existingSignature && (
                <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-xl border border-green-100">
                  <CheckCircle size={20} /> Signed & Verified
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800">
            <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center"><CheckCircle className="text-teal-400" size={24} /></div>
            <div>
              <p className="font-bold text-sm">Contract Verified</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Digital Audit Trail Secured</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
