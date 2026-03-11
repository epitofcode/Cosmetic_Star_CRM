import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  X, 
  Download, 
  Mail, 
  Star,
  CheckCircle2
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
    patientId?: number | string; // New field for naming
    patientName: string;
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
  
  if (!isOpen) return null;

  const balanceRemaining = data.totalAmount - data.amountPaid;

  const handleDownloadPDF = async () => {
    if (receiptRef.current) {
      try {
        const canvas = await html2canvas(receiptRef.current, {
          scale: 3, // Higher quality
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Custom Naming: patientID-name.pdf
        const fileName = `${data.patientId || 'REC'}-${data.patientName.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Responsive Container with Scroll */}
      <div className="relative w-full max-w-lg flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-t-2xl bg-white shadow-2xl">
          <div ref={receiptRef} className="bg-white p-6 sm:p-10 space-y-8 relative">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 transition-colors print:hidden"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="bg-teal-50 p-3 rounded-full">
                  <Star className="text-teal-600 fill-teal-600" size={36} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Cosmetic Star</h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Premium Aesthetic Clinic</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                <span>London Road, Manchester, UK</span>
                <span>M1 2WD • +44 161 000 0000</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-5 border-t border-b border-dashed border-slate-200 py-8">
              <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs font-mono text-slate-500 uppercase font-bold">
                <span>RECEIPT: #{data.receiptNumber}</span>
                <span>DATE: {data.date}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="font-bold text-slate-900 text-sm">{data.patientName}</p>
                  <p className="text-[10px] text-slate-500">Ref: {data.patientId}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                  <p className="font-bold text-slate-900 text-sm">{data.paymentMethod}</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{data.serviceName}</p>
                  </div>
                  <span className="font-black text-slate-900 text-lg">£{data.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Contract Subtotal</span>
                <span className="text-slate-900 font-bold">£{data.totalAmount.toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-teal-600 font-black uppercase tracking-widest text-[10px]">Payment Received</span>
                  <span className="text-teal-600 font-black">- £{data.amountPaid.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t-2 border-slate-900">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Balance Remaining</span>
                  <span className={cn(
                    "text-2xl sm:text-3xl font-black tracking-tighter",
                    balanceRemaining > 0 ? "text-red-600" : "text-teal-600"
                  )}>
                    £{balanceRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-green-100">
                <CheckCircle2 size={12} />
                Payment Verified
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed px-4">
                  Thank you for choosing Cosmetic Star. Your medical journey is our priority. Please retain this receipt for clinical insurance.
                </p>
                <div className="pt-6 border-t border-slate-100 flex flex-col gap-1.5 text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                  <p>Cosmetic Star UK Ltd • Reg: 14209938 • VAT: GB 421 9902 11</p>
                  <p>Regulated by the Care Quality Commission (CQC)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Zig-zag bottom */}
          <div className="h-4 bg-white relative">
            <div 
              className="absolute bottom-0 left-0 right-0 h-2"
              style={{
                backgroundImage: `linear-gradient(135deg, transparent 33.333%, #f8fafc 33.333%, #f8fafc 66.667%, transparent 66.667%), linear-gradient(45deg, transparent 33.333%, #f8fafc 33.333%, #f8fafc 66.667%, transparent 66.667%)`,
                backgroundSize: '12px 24px'
              }}
            />
          </div>
        </div>

        {/* Action Buttons: Fixed at bottom of modal */}
        <div className="bg-slate-900 p-4 sm:p-6 rounded-b-2xl grid grid-cols-2 gap-3 sm:gap-4 shrink-0 shadow-2xl">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => alert('Receipt sent to email!')}
            className="flex items-center justify-center gap-2 bg-teal-500 text-slate-900 py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-teal-400 transition-all active:scale-95 shadow-xl shadow-teal-500/20"
          >
            <Mail size={18} />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
