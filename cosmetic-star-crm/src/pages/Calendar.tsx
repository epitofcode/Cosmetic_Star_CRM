import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks, 
  isSameDay, 
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth
} from 'date-fns';
import { sendBookingConfirmation } from '../utils/emailService';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Calendar as CalendarIcon,
  UserCheck,
  UserCircle2,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { getBookedSlots, createBooking, getTreatmentPlan, getBooking, deleteBooking } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

interface Session {
  date: Date;
  slot: string;
}

export default function CalendarPage() {
  const { selectedPatient } = usePatient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<Session[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = addDays(startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 }), -1);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    if (selectedPatient) {
      setLoading(true);
      Promise.all([
        getTreatmentPlan(selectedPatient.id),
        getBooking(selectedPatient.id)
      ]).then(([plan, bookings]) => {
        setTreatmentPlan(plan);
        setExistingBookings(bookings || []);
      }).finally(() => setLoading(false));
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedDate) {
      setIsLoadingSlots(true);
      getBookedSlots(format(selectedDate, 'yyyy-MM-dd'))
        .then(setBookedSlots)
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDate]);

  const addSession = () => {
    if (selectedDate && selectedSlot) {
      setScheduledSessions([...scheduledSessions, { date: selectedDate, slot: selectedSlot }]);
      setSelectedSlot(null);
    }
  };

  const removeSession = (idx: number) => {
    setScheduledSessions(scheduledSessions.filter((_, i) => i !== idx));
  };

  const handleCancelExisting = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this confirmed session?')) return;
    try {
      setIsSaving(true);
      await deleteBooking(bookingId);
      
      // Refresh data
      const bookings = await getBooking(selectedPatient!.id);
      setExistingBookings(bookings || []);
      
      // Update slots for the selected date if visible
      if (selectedDate) {
        const slots = await getBookedSlots(format(selectedDate, 'yyyy-MM-dd'));
        setBookedSlots(slots);
      }

      // 2. Trigger updated email with remaining sessions
      console.log("Triggering updated email after cancellation...");
      try {
        const allDates = (bookings || []).map((b: any) => format(new Date(b.date), 'do MMM')).join(', ');
        
        await sendBookingConfirmation({
          to_name: `${selectedPatient!.first_name} ${selectedPatient!.last_name}`,
          to_email: selectedPatient!.email,
          date: allDates || 'No remaining sessions',
          time: 'Schedule Updated',
          practitioner: 'Kavya Sangameswara',
          service: treatmentPlan.service_name
        });
      } catch (emailErr) {
        console.error("Cancellation email failed:", emailErr);
      }

      alert('Session cancelled and schedule updated.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel session.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalConfirm = async () => {
    if (!selectedPatient || (scheduledSessions.length + existingBookings.length) < (treatmentPlan?.total_sessions || 1)) return;
    try {
      setIsSaving(true);
      
      // 1. Create all new bookings in parallel
      console.log("Creating new bookings for sessions:", scheduledSessions);
      await Promise.all(scheduledSessions.map(s => 
        createBooking({
          patient_id: selectedPatient.id,
          service_type: treatmentPlan.service_name,
          date: format(s.date, 'yyyy-MM-dd'),
          time_slot: s.slot
        })
      ));

      // 2. Send combined confirmation email
      console.log("Triggering confirmation email...");
      try {
        const allDates = [
          ...existingBookings.map(b => format(new Date(b.date), 'do MMM')),
          ...scheduledSessions.map(s => format(s.date, 'do MMM'))
        ].join(', ');

        await sendBookingConfirmation({
          to_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
          to_email: selectedPatient.email,
          date: allDates,
          time: 'Multiple Sessions Allocated',
          practitioner: 'Kavya Sangameswara',
          service: treatmentPlan.service_name
        });
        console.log("Email trigger successful.");
      } catch (emailErr) {
        console.error("Email service failed but bookings saved:", emailErr);
      }

      setIsBookingConfirmed(true);
    } catch (error: any) {
      console.error("Final booking confirmation error:", error);
      alert(error.response?.data?.error || 'Booking process failed. Please check slot availability.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPatient) return <div className="py-20 text-center text-slate-500">Please select a patient first.</div>;
  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600" /></div>;

  const totalSessionsNeeded = treatmentPlan?.total_sessions || 1;
  const currentCount = existingBookings.length + scheduledSessions.length;
  const remaining = Math.max(0, totalSessionsNeeded - currentCount);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Timeline Scheduling</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 break-words">Procedure: {treatmentPlan?.service_name}</p>
        </div>
        <div className={cn("px-6 py-3 rounded-2xl border-2 flex flex-col items-center min-w-[140px] shrink-0", remaining === 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
          <span className="text-[10px] font-black uppercase tracking-widest">Sessions Needed</span>
          <span className="text-xl font-black">{currentCount} / {totalSessionsNeeded}</span>
        </div>
      </div>

      {!isBookingConfirmed ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(addWeeks(currentDate, -4))} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronLeft /></button>
                <button onClick={() => setCurrentDate(addWeeks(currentDate, 4))} className="p-2 hover:bg-slate-100 rounded-xl"><ChevronRight /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>)}
              {days.map((day, idx) => {
                const isSel = selectedDate && isSameDay(day, selectedDate);
                const isAdded = scheduledSessions.some(s => isSameDay(s.date, day));
                const isExisting = existingBookings.some(b => isSameDay(new Date(b.date), day));
                const isPast = day < new Date() && !isToday(day);
                
                return (
                  <button 
                    key={idx} 
                    disabled={isPast} 
                    onClick={() => setSelectedDate(day)} 
                    className={cn(
                      "min-h-[4rem] flex flex-col items-center justify-center rounded-2xl border-2 transition-all relative p-2", 
                      !isSameMonth(day, monthStart) ? "opacity-20" : "border-slate-50", 
                      isSel ? "bg-teal-600 border-teal-600 text-white scale-105 z-10" : 
                      isExisting ? "bg-slate-100 border-teal-500/30 text-teal-700" :
                      isAdded ? "bg-teal-50 border-teal-200 text-teal-700" : 
                      "bg-white hover:border-teal-500"
                    )}
                  >
                    <span className="font-black">{format(day, 'd')}</span>
                    {(isAdded || isExisting) && !isSel && <CheckCircle2 size={12} className={cn("absolute top-1 right-1", isExisting ? "text-teal-600" : "text-teal-400")} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Clock className="text-teal-600" /> Select Time</h3>
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isChosen = scheduledSessions.some(s => isSameDay(s.date, selectedDate!) && s.slot === slot);
                      const isAlreadyMine = existingBookings.some(b => isSameDay(new Date(b.date), selectedDate!) && b.time_slot === slot);
                      
                      return (
                        <button 
                          key={slot} 
                          disabled={isBooked || isChosen || isAlreadyMine} 
                          onClick={() => setSelectedSlot(slot)} 
                          className={cn(
                            "py-3 rounded-xl text-xs font-black border-2", 
                            selectedSlot === slot ? "bg-teal-600 border-teal-600 text-white" : 
                            isAlreadyMine ? "bg-teal-50 border-teal-200 text-teal-700 opacity-100" :
                            (isBooked || isChosen) ? "opacity-30 bg-slate-100" : 
                            "hover:border-teal-500"
                          )}
                        >
                          {slot}
                          {isAlreadyMine && <span className="block text-[8px] uppercase">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSlot && (
                    <button 
                      onClick={addSession} 
                      disabled={currentCount >= totalSessionsNeeded} 
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      Add Session to Queue
                    </button>
                  )}
                </div>
              ) : <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Select a date first</p>}
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2 text-teal-400 uppercase tracking-widest text-xs">Timeline Queue</h3>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{scheduledSessions.length} new</span>
              </div>
              
              <div className="space-y-2">
                {/* Existing Bookings (ReadOnly) */}
                {existingBookings.map((b, i) => (
                  <div key={`exist-${i}`} className="flex items-center justify-between p-3 bg-teal-500/10 rounded-xl border border-teal-500/20 text-[10px]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-teal-400" />
                      <span className="text-slate-300">{format(new Date(b.date), 'do MMM')} @ {b.time_slot}</span>
                    </div>
                    <button 
                      onClick={() => handleCancelExisting(b.id)}
                      disabled={isSaving}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* New Sessions */}
                {scheduledSessions.map((s, i) => (
                  <div key={`new-${i}`} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 text-xs animate-pulse">
                    <span>{format(s.date, 'do MMM')} @ {s.slot}</span>
                    <button onClick={() => removeSession(i)} className="text-white/20 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              {remaining === 0 ? (
                <button 
                  onClick={handleFinalConfirm} 
                  disabled={isSaving || scheduledSessions.length === 0} 
                  className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-500/20 disabled:bg-slate-700 disabled:text-slate-500"
                >
                  {isSaving ? 'Saving...' : scheduledSessions.length === 0 ? 'All Sessions Booked' : 'Confirm New Sessions'}
                </button>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[10px] text-amber-200 uppercase font-black tracking-widest">
                  <AlertCircle size={14} /> {remaining} More Sessions Needed
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-3xl flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></div>
          <h2 className="text-3xl font-black">Booking Confirmed!</h2>
          <button onClick={() => window.location.href = '/'} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Return Home</button>
        </div>
      )}
    </div>
  );
}
