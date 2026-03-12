import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  X, 
  Download, 
  Mail, 
  Star,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReceiptGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    patientId: number | string;
    patientName: string;
    patientEmail?: string;
    serviceName: string;
    totalAmount: number;
    amountPaid: number;
    paymentMethod: string;
    date: string;
    receiptNumber: string;
  };
}

export default function ReceiptGenerator({ isOpen, onClose, data }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!isOpen) return null;

  const balanceRemaining = data.totalAmount - data.amountPaid;

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${API_URL}/generate-receipt-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          patientName: data.patientName,
          amount: data.amountPaid,
          service_name: data.serviceName,
          receipt_number: data.receiptNumber,
          date: data.date,
          paymentMethod: data.paymentMethod
        })
      });

      if (!response.ok) throw new Error('Backend failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Custom Naming: patientID-name.pdf
      const fileName = `${data.patientId}-${data.patientName.replace(/\s+/g, '_')}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("PDF Download Error:", error);
      alert("Failed to download PDF. Please check your internet connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!data.patientEmail) {
      alert("Patient email address is missing. Cannot send receipt.");
      return;
    }

    try {
      setIsSending(true);
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${API_URL}/email/send-payment-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: data.patientEmail,
          to_name: data.patientName,
          amount: data.amountPaid,
          service_name: data.serviceName,
          receipt_number: data.receiptNumber,
          date: data.date
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      alert(`Receipt #${data.receiptNumber} has been re-sent to ${data.patientEmail}`);
    } catch (error) {
      console.error('Manual email send error:', error);
      alert('Failed to send email via server. Please check your internet connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-lg flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-t-2xl bg-white shadow-2xl">
          <div ref={receiptRef} className="bg-white p-6 sm:p-10 space-y-8 relative">
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 print:hidden transition-colors">
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center"><div className="bg-teal-50 p-3 rounded-full"><Star className="text-teal-600 fill-teal-600" size={36} /></div></div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Cosmetic Star</h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Premium Aesthetic Clinic</p>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">London Road, Manchester • +44 161 000 0000</div>
            </div>

            {/* Content */}
            <div className="space-y-5 border-t border-b border-dashed border-slate-200 py-8">
              <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs font-mono text-slate-500 font-bold">
                <span>RECEIPT: #{data.receiptNumber}</span>
                <span>DATE: {data.date}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="font-bold text-slate-900 text-sm break-words">{data.patientName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">ID: {data.patientId}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                  <p className="font-bold text-slate-900 text-sm">{data.paymentMethod}</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-slate-50 p-4 rounded-xl">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Treatment</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight text-left break-words">{data.serviceName}</p>
                  </div>
                  <span className="font-black text-slate-900 text-lg whitespace-nowrap">£{data.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Contract Total</span>
                <span className="text-slate-900 font-bold">£{data.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-teal-600 font-black uppercase tracking-widest text-[10px]">Amount Paid Today</span>
                <span className="text-teal-600 font-black">£{data.amountPaid.toLocaleString()}</span>
              </div>
              <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 uppercase">Balance Remaining</span>
                <span className={cn("text-2xl font-black", balanceRemaining > 0 ? "text-red-600" : "text-teal-600")}>
                  £{balanceRemaining.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-center pt-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                <CheckCircle2 size={12} /> Transaction Verified
              </div>
              <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                Retain this receipt for your records. Cosmetic Star UK Ltd • Registered in England.
              </p>
            </div>
          </div>
          <div className="h-4 bg-white relative"><div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundImage: `linear-gradient(135deg, transparent 33.333%, #f8fafc 33.333%, #f8fafc 66.667%, transparent 66.667%), linear-gradient(45deg, transparent 33.333%, #f8fafc 33.333%, #f8fafc 66.667%, transparent 66.667%)`, backgroundSize: '12px 24px' }} /></div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-6 rounded-b-2xl grid grid-cols-2 gap-3 sm:gap-4 shrink-0 shadow-2xl">
          <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-100 disabled:opacity-50 transition-all active:scale-95">
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download PDF
          </button>
          <button onClick={handleSendEmail} disabled={isSending} className="flex items-center justify-center gap-2 bg-teal-500 text-slate-900 py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-teal-400 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-teal-500/20">
            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
