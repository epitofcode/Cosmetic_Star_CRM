import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import ReceiptGenerator from '../components/ReceiptGenerator';
import { 
  FileCheck, 
  Trash2, 
  CheckCircle, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DigitalContractProps {
  onSign: () => void;
}

export default function DigitalContract({ onSign }: DigitalContractProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const confirm = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please provide a signature before confirming.');
      return;
    }
    setIsSigned(true);
    setShowToast(true);
    onSign();
    setTimeout(() => {
      setShowToast(false);
      setShowReceipt(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <ReceiptGenerator 
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={{
          patientName: "Jane Doe",
          serviceName: "FUE Hair Transplant",
          totalAmount: 2500,
          amountPaid: 500,
          date: new Date().toLocaleDateString('en-GB'),
          receiptNumber: "CS-2026-001"
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digital Contract</h1>
          <p className="text-slate-500">Please review and sign the treatment agreement below.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Treatment Plan</span>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">Agreement</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Contract Text */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <FileCheck className="text-teal-600" size={20} />
            <h2 className="font-bold text-slate-900 text-lg">Terms of Agreement</h2>
          </div>
          <div className="p-8 prose prose-slate max-w-none h-[400px] overflow-y-auto bg-slate-50/30 text-slate-600 text-sm leading-relaxed space-y-4">
            <h3 className="text-slate-900 font-bold uppercase tracking-wide text-xs">1. Patient Consent</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
            <h3 className="text-slate-900 font-bold uppercase tracking-wide text-xs">2. Medical Risks and Complications</h3>
            <p>
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, 
              eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <h3 className="text-slate-900 font-bold uppercase tracking-wide text-xs">3. Financial Policy</h3>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui 
              ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, 
              adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </p>
            <h3 className="text-slate-900 font-bold uppercase tracking-wide text-xs">4. Post-Operative Care</h3>
            <p>
              Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi 
              consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.
            </p>
            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti 
              quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia 
              deserunt mollitia animi, id est laborum et dolorum fuga.
            </p>
          </div>
        </section>

        {/* Signature Area */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-teal-600" size={20} />
              <h2 className="font-bold text-slate-900 text-lg">Electronic Signature</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <AlertCircle size={14} />
              Sign using mouse or touch
            </div>
          </div>
          <div className="p-6">
            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="#0f172a"
                canvasProps={{
                  className: "w-full h-64 cursor-crosshair"
                }}
              />
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={clear}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  Clear Signature
                </button>
              </div>
              <button
                onClick={confirm}
                disabled={isSigned}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 w-full sm:w-auto",
                  isSigned 
                    ? "bg-green-100 text-green-700 shadow-none cursor-default" 
                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20"
                )}
              >
                {isSigned ? <CheckCircle size={20} /> : <FileCheck size={20} />}
                {isSigned ? 'Contract Signed' : 'Confirm & Sign'}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-800">
            <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="text-teal-400" size={24} />
            </div>
            <div>
              <p className="font-bold">Contract Signed Successfully</p>
              <p className="text-sm text-slate-400">Digital signature has been encrypted and saved.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
