import React, { useState, useEffect } from 'react';
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
  Download,
  UserCheck,
  UserCircle2,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReceiptGenerator from '../components/ReceiptGenerator';
import { usePatient } from '../context/PatientContext';
import api from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  proof_name: string;
  receipt_number: string;
}

interface BillingRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  service_name: string;
  total_amount: number;
  amount_paid: number;
  status: 'Payment Pending' | 'Payment Done';
  transactions: Transaction[];
}

export default function Financials() {
  const { selectedPatient } = usePatient();
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Payment Form State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Receipt State
  const [activeReceipt, setActiveReceipt] = useState<{ isOpen: boolean; data: any } | null>(null);

  useEffect(() => {
    if (selectedPatient) {
      fetchBillingData();
    }
  }, [selectedPatient]);

  const fetchBillingData = async () => {
    if (!selectedPatient) return;
    try {
      setLoading(true);
      const response = await api.get(`/financials/${selectedPatient.id}`);
      setBillingRecord(response.data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setBillingRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !billingRecord) return;
    if (!isCashPayment && !proofFile) {
      alert('Please upload a proof of payment or select "Paid with Cash".');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('patient_id', selectedPatient.id);
      formData.append('amount', paymentAmount);
      formData.append('type', isCashPayment ? 'Cash' : 'Installment');
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const response = await api.post('/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newTransaction = response.data;
      
      // Update local state
      const newAmountPaid = billingRecord.amount_paid + Number(paymentAmount);
      setBillingRecord({
        ...billingRecord,
        amount_paid: newAmountPaid,
        status: newAmountPaid >= billingRecord.total_amount ? 'Payment Done' : 'Payment Pending',
        transactions: [newTransaction, ...billingRecord.transactions]
      });

      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setProofFile(null);
      setIsCashPayment(false);
      
      // Open receipt for the new transaction
      setActiveReceipt({
        isOpen: true,
        data: {
          patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          serviceName: billingRecord.service_name,
          totalAmount: billingRecord.total_amount,
          amountPaid: Number(paymentAmount),
          date: new Date().toLocaleDateString('en-GB'),
          receiptNumber: newTransaction.receipt_number
        }
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      const message = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to record payment: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-slate-100 p-6 rounded-full text-slate-400">
          <UserCircle2 size={48} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">No Patient Selected</h2>
          <p className="text-slate-500 max-w-xs mx-auto">Please select a patient to view their financial records and payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} />
            Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
          <p className="text-slate-500">Track payments, installments, and generate receipts.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
          <p className="text-slate-500 font-medium">Loading financial records...</p>
        </div>
      ) : billingRecord ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Financial Card */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 bg-slate-900 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Treatment Plan</p>
                    <h2 className="text-xl sm:text-2xl font-bold">{billingRecord.service_name}</h2>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    billingRecord.status === 'Payment Done' 
                      ? "bg-green-500/10 border-green-500/20 text-green-400" 
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    {billingRecord.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Contract</p>
                    <p className="text-xl sm:text-2xl font-black">£{billingRecord.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Amount Paid</p>
                    <p className="text-xl sm:text-2xl font-black text-teal-400">£{billingRecord.amount_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Remaining</p>
                    <p className="text-xl sm:text-2xl font-black text-red-400">£{(billingRecord.total_amount - billingRecord.amount_paid).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-1000" 
                    style={{ width: `${(billingRecord.amount_paid / billingRecord.total_amount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
                <p className="text-xs sm:text-sm text-slate-500 italic">Last txn: {billingRecord.transactions[0]?.date || 'None'}</p>
                {billingRecord.status === 'Payment Pending' && (
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Record Payment
                  </button>
                )}
              </div>
            </div>

            {/* Payment History Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Transaction History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Receipt #</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase hidden sm:table-cell">Date</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">Amount</th>
                      <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {billingRecord.transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <span className="font-mono text-[10px] sm:text-xs font-bold text-slate-600">{t.receipt_number}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 hidden sm:table-cell">{t.date}</td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-slate-900 text-xs sm:text-sm">£{t.amount.toLocaleString()}</td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setActiveReceipt({
                                isOpen: true,
                                data: {
                                  patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
                                  serviceName: billingRecord.service_name,
                                  totalAmount: billingRecord.total_amount,
                                  amountPaid: t.amount,
                                  date: t.date,
                                  receiptNumber: t.receipt_number
                                }
                              })}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View Receipt"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {billingRecord.transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                          No transactions recorded for this treatment plan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Documentation */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-teal-600" size={18} />
                Payment Proofs
              </h3>
              <div className="space-y-3">
                {billingRecord.transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-white rounded border border-slate-200 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{t.proof_name}</p>
                        <p className="text-[10px] text-slate-500">Ref: {t.receipt_number}</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-teal-600 transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
                {billingRecord.transactions.length === 0 && (
                  <p className="text-center py-8 text-xs text-slate-400 italic">No proof of payment uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Treatment Plan Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">
              Patient {selectedPatient.first_name} {selectedPatient.last_name} does not have an active treatment plan or billing record.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/treatment'}
            className="text-teal-600 font-bold text-sm hover:underline"
          >
            Create a treatment plan now
          </button>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && billingRecord && (
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
                <p className="text-2xl font-black text-teal-900">£{(billingRecord.total_amount - billingRecord.amount_paid).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Payment Amount (£)</label>
                  <input
                    required
                    type="number"
                    max={billingRecord.total_amount - billingRecord.amount_paid}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 rounded-lg py-2.5 px-4 text-sm outline-none"
                    placeholder="Enter amount to pay"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="cashPayment"
                    checked={isCashPayment}
                    onChange={(e) => {
                      setIsCashPayment(e.target.checked);
                      if (e.target.checked) setProofFile(null);
                    }}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="cashPayment" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                    Paid with Cash (Skip Proof Upload)
                  </label>
                </div>

                {!isCashPayment && (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <label className="text-sm font-bold text-slate-700">Proof of Payment</label>
                    <div className="relative">
                      <input
                        required={!isCashPayment}
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
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setIsCashPayment(false);
                    setProofFile(null);
                  }}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(!isCashPayment && !proofFile) || !paymentAmount || isSaving}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Verifying...' : 'Verify & Record'}
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
