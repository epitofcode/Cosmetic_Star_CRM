import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  X, 
  Download, 
  Mail, 
  Printer, 
  Scissors, 
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
    patientName: string;
    serviceName: string;
    totalAmount: number;
    amountPaid: number;
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
          scale: 2,
          backgroundColor: '#ffffff'
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
        pdf.save(`Receipt-${data.receiptNumber}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Receipt Paper Effect */}
        <div ref={receiptRef} className="bg-white rounded-t-xl shadow-2xl overflow-hidden">
          {/* Decorative Top Edge */}
          <div className="h-2 bg-teal-600 w-full" />
          
          <div className="p-8 space-y-8 relative">
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="bg-teal-50 p-3 rounded-full">
                  <Star className="text-teal-600 fill-teal-600" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Cosmetic Star</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Premium Aesthetic Clinic</p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <span>123 Harley Street, London</span>
                <span>•</span>
                <span>+44 20 7946 0000</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4 border-t border-b border-dashed border-slate-200 py-6">
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>RECEIPT: #{data.receiptNumber}</span>
                <span>DATE: {data.date}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                <p className="font-bold text-slate-900">{data.patientName}</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</p>
                    <p className="text-sm font-bold text-slate-800">{data.serviceName}</p>
                  </div>
                  <span className="font-bold text-slate-900">£{data.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="text-slate-900 font-bold">£{data.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Amount Paid Today</span>
                <span className="text-teal-600 font-bold">- £{data.amountPaid.toLocaleString()}</span>
              </div>
              
              <div className="pt-4 border-t-2 border-slate-900">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-black text-slate-900 uppercase">Balance Remaining</span>
                  <span className={cn(
                    "text-2xl font-black",
                    balanceRemaining > 0 ? "text-red-600" : "text-teal-600"
                  )}>
                    £{balanceRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={12} />
                Transaction Verified
              </div>
              <p className="text-[10px] text-slate-400 mt-4 font-medium italic">
                Thank you for choosing Cosmetic Star. Please keep this receipt for your records.
              </p>
            </div>
          </div>

          {/* Zig-zag bottom edge effect using CSS */}
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

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => alert('Receipt sent to email!')}
            className="flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg active:scale-95"
          >
            <Mail size={18} />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
