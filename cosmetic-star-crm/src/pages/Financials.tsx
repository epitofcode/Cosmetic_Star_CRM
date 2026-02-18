import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Image as ImageIcon,
  ChevronRight,
  Search,
  AlertCircle,
  Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReceiptGenerator from '../components/ReceiptGenerator';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  proofName: string;
  receiptNumber: string;
}

interface BillingRecord {
  id: string;
  patientName: string;
  serviceName: string;
  totalAmount: number;
  amountPaid: number;
  status: 'Payment Pending' | 'Payment Done';
  paymentType: 'One-time' | 'Installments';
  transactions: Transaction[];
}

const MOCK_BILLING: BillingRecord[] = [
  {
    id: 'INV-001',
    patientName: 'Jane Doe',
    serviceName: 'FUE Hair Transplant',
    totalAmount: 2500,
    amountPaid: 1500,
    status: 'Payment Pending',
    paymentType: 'Installments',
    transactions: [
      { id: 'T1', amount: 500, date: '2024-02-01', proofName: 'receipt_jan.jpg', receiptNumber: 'CS-RC-001' },
      { id: 'T2', amount: 1000, date: '2024-02-15', proofName: 'bank_transfer_feb.pdf', receiptNumber: 'CS-RC-002' },
    ]
  },
  {
    id: 'INV-002',
    patientName: 'James Wilson',
    serviceName: 'PRP Therapy',
    totalAmount: 800,
    amountPaid: 800,
    status: 'Payment Done',
    paymentType: 'One-time',
    transactions: [
      { id: 'T3', amount: 800, date: '2024-02-10', proofName: 'full_payment.png', receiptNumber: 'CS-RC-003' },
    ]
  }
];

export default function Financials() {
  const [records, setRecords] = useState<BillingRecord[]>(MOCK_BILLING);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  // Receipt State
  const [activeReceipt, setActiveReceipt] = useState<{ isOpen: boolean; data: any } | null>(null);

  const filteredRecords = records.filter(r => 
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !proofFile) return;

    const amount = Number(paymentAmount);
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      proofName: proofFile.name,
      receiptNumber: `CS-RC-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updatedRecords = records.map(r => {
      if (r.id === selectedRecord.id) {
        const newAmountPaid = r.amountPaid + amount;
        return {
          ...r,
          amountPaid: newAmountPaid,
          status: newAmountPaid >= r.totalAmount ? 'Payment Done' : 'Payment Pending',
          transactions: [...r.transactions, newTransaction]
        } as BillingRecord;
      }
      return r;
    });

    setRecords(updatedRecords);
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setProofFile(null);
    
    // Auto-open receipt for the new transaction
    setActiveReceipt({
      isOpen: true,
      data: {
        patientName: selectedRecord.patientName,
        serviceName: selectedRecord.serviceName,
        totalAmount: selectedRecord.totalAmount,
        amountPaid: amount,
        date: new Date().toLocaleDateString('en-GB'),
        receiptNumber: newTransaction.receiptNumber
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
          <p className="text-slate-500">Track payments, installments, and generate receipts.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search invoice or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Invoice List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient & Invoice</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map(record => (
                  <tr 
                    key={record.id} 
                    className={cn(
                      "hover:bg-slate-50 cursor-pointer transition-colors",
                      selectedRecord?.id === record.id && "bg-teal-50/50"
                    )}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{record.patientName}</p>
                      <p className="text-xs text-slate-500">{record.id} • {record.serviceName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">£{record.amountPaid.toLocaleString()} / £{record.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Remaining: £{(record.totalAmount - record.amountPaid).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold",
                        record.status === 'Payment Done' 
                          ? "bg-green-100 text-green-700" 
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {record.status === 'Payment Done' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                          setIsPaymentModalOpen(true);
                        }}
                        disabled={record.status === 'Payment Done'}
                        className="text-teal-600 hover:text-teal-700 font-bold text-sm disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        Add Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History Side Panel */}
        <div className="space-y-6">
          {selectedRecord ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Payment History</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedRecord.id}</span>
              </div>

              <div className="space-y-4">
                {selectedRecord.transactions.length > 0 ? (
                  selectedRecord.transactions.map(t => (
                    <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-900">£{t.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">{t.date}</p>
                        </div>
                        <button 
                          onClick={() => setActiveReceipt({
                            isOpen: true,
                            data: {
                              patientName: selectedRecord.patientName,
                              serviceName: selectedRecord.serviceName,
                              totalAmount: selectedRecord.totalAmount,
                              amountPaid: t.amount,
                              date: t.date,
                              receiptNumber: t.receiptNumber
                            }
                          })}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-200 w-fit">
                        <ImageIcon size={12} className="text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-600 truncate max-w-[120px]">{t.proofName}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm italic">No payments recorded yet.</p>
                  </div>
                )}
              </div>

              {selectedRecord.status === 'Payment Pending' && (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full mt-8 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Installment
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <DollarSign className="mx-auto mb-4 opacity-20" size={48} />
              <p className="text-sm font-medium">Select a patient invoice to view payment details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <ChevronRight size={24} className="rotate-90" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-6">
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-1">Outstanding Balance</p>
                <p className="text-2xl font-black text-teal-900">£{(selectedRecord.totalAmount - selectedRecord.amountPaid).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Payment Amount (£)</label>
                  <input
                    required
                    type="number"
                    max={selectedRecord.totalAmount - selectedRecord.amountPaid}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 px-4 text-sm outline-none"
                    placeholder="Enter amount to pay"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Proof of Payment</label>
                  <div className="relative">
                    <input
                      required
                      type="file"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "w-full border-2 border-dashed rounded-lg py-8 px-4 flex flex-col items-center justify-center gap-2 transition-colors",
                      proofFile ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    )}>
                      {proofFile ? (
                        <>
                          <ImageIcon className="text-teal-600" size={24} />
                          <p className="text-xs font-bold text-teal-700">{proofFile.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="text-slate-400" size={24} />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Upload Receipt or Transfer Confirmation</p>
                          <p className="text-[10px] text-slate-400">JPG, PNG, PDF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofFile || !paymentAmount}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Verify & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Receipt Generator */}
      {activeReceipt && (
        <ReceiptGenerator 
          isOpen={activeReceipt.isOpen}
          onClose={() => setActiveReceipt(null)}
          data={activeReceipt.data}
        />
      )}
    </div>
  );
}
