import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
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
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { getBookedSlots, createBooking, getTreatmentPlan } from '../services/api';

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
  
  // Multi-session state
  const [scheduledSessions, setScheduledSessions] = useState<Session[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<any>(null);
  
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = addDays(startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 }), -1);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentDate(subWeeks(currentDate, 4));
  const handleNextMonth = () => setCurrentDate(addWeeks(currentDate, 4));

  useEffect(() => {
    if (selectedPatient) {
      fetchData();
    }
  }, [selectedPatient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const plan = await getTreatmentPlan(selectedPatient!.id);
      setTreatmentPlan(plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate]);

  const fetchSlots = async () => {
    if (!selectedDate) return;
    try {
      setIsLoadingSlots(true);
      const slots = await getBookedSlots(format(selectedDate, 'yyyy-MM-dd'));
      setBookedSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const addSessionToQueue = () => {
    if (selectedDate && selectedSlot) {
      const newSession = { date: selectedDate, slot: selectedSlot };
      setScheduledSessions([...scheduledSessions, newSession]);
      setSelectedSlot(null);
    }
  };

  const removeSession = (idx: number) => {
    setScheduledSessions(scheduledSessions.filter((_, i) => i !== idx));
  };

  const handleConfirmAllBookings = async () => {
    if (!selectedPatient || scheduledSessions.length !== (treatmentPlan?.total_days || 1)) return;

    try {
      setIsSaving(true);
      
      // 1. Create all bookings sequentially
      for (const session of scheduledSessions) {
        await createBooking({
          patient_id: selectedPatient.id,
          service_type: treatmentPlan?.service_name || 'Treatment',
          date: format(session.date, 'yyyy-MM-dd'),
          time_slot: session.slot,
          duration_hours: treatmentPlan?.hours_per_session || 1
        });
      }

      // 2. Send one combined confirmation email
      await sendBookingConfirmation({
        to_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        to_email: selectedPatient.email,
        date: scheduledSessions.map(s => format(s.date, 'do MMM')).join(', '),
        time: `${scheduledSessions[0].slot} (Multiple Sessions)`,
        practitioner: 'Clinical Staff',
        service: treatmentPlan?.service_name || 'Treatment'
      });
      
      setIsBookingConfirmed(true);
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.response?.data?.error || 'Failed to complete scheduling.');
    } finally {
      setIsSaving(false);
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
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs text-center">Loading Clinical Schedule...</p>
      </div>
    );
  }

  const sessionsNeeded = treatmentPlan?.total_days || 1;
  const sessionsRemaining = sessionsNeeded - scheduledSessions.length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} /> Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Timeline Scheduling</h1>
          <p className="text-slate-500 font-medium">Procedure: <span className="text-slate-900 font-bold">{treatmentPlan?.service_name || 'Generic Treatment'}</span></p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "px-6 py-3 rounded-2xl border-2 transition-all flex flex-col items-center",
            sessionsRemaining === 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"
          )}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Booking Status</span>
            <span className="text-xl font-black">{scheduledSessions.length} / {sessionsNeeded} Sessions Set</span>
          </div>
        </div>
      </div>

      {!isBookingConfirmed ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Calendar Area */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-50">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                  <button onClick={handlePrevMonth} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ChevronLeft size={20} /></button>
                  <button onClick={handleNextMonth} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {days.map((day, idx) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isSessionAdded = scheduledSessions.some(s => isSameDay(s.date, day));
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isPast = day < new Date() && !isToday(day);

                    return (
                      <button
                        key={idx}
                        disabled={isPast}
                        onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                        className={cn(
                          "h-14 sm:h-20 flex flex-col items-center justify-center rounded-2xl transition-all border-2 relative",
                          !isCurrentMonth ? "text-slate-200 border-transparent opacity-40" : "border-slate-50",
                          isSelected ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-500/20 scale-105 z-10" :
                          isSessionAdded ? "bg-teal-50 border-teal-200 text-teal-700" :
                          isPast ? "bg-slate-50 text-slate-200 cursor-not-allowed border-transparent" : "hover:border-teal-500 hover:text-teal-600 bg-white text-slate-700"
                        )}
                      >
                        <span className="text-sm sm:text-lg font-black">{format(day, 'd')}</span>
                        {isToday(day) && <span className={cn("absolute bottom-2 w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-teal-500")} />}
                        {isSessionAdded && !isSelected && <CheckCircle2 size={14} className="absolute top-2 right-2 text-teal-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Queue */}
          <div className="xl:col-span-4 space-y-6">
            {/* Slot Picker */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6 sm:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                <Clock className="text-teal-600" size={24} /> Available Slots
              </h3>
              
              {selectedDate ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isChosen = scheduledSessions.some(s => isSameDay(s.date, selectedDate!) && s.slot === slot);
                      const isCurrentSelection = selectedSlot === slot;
                      
                      return (
                        <button
                          key={slot}
                          disabled={isBooked || isChosen}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "py-3 rounded-xl text-xs font-black transition-all border-2 uppercase tracking-widest",
                            isCurrentSelection ? "bg-teal-600 border-teal-600 text-white shadow-md" :
                            (isBooked || isChosen) ? "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed" :
                            "bg-white border-slate-100 text-slate-600 hover:border-teal-500"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedSlot && (
                    <button 
                      onClick={addSessionToQueue}
                      disabled={scheduledSessions.length >= sessionsNeeded}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      Add Session to Queue
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CalendarIcon className="mx-auto text-slate-300 mb-4" size={32} />
                  <p className="text-sm text-slate-500 font-bold leading-relaxed uppercase tracking-widest">Select a date to see times</p>
                </div>
              )}
            </div>

            {/* Session Queue Summary */}
            <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl space-y-6">
              <h3 className="font-black text-lg flex items-center gap-3 text-teal-400 uppercase tracking-tight">
                <CheckCircle2 size={24} /> Scheduled Sessions
              </h3>
              
              <div className="space-y-3">
                {scheduledSessions.length > 0 ? scheduledSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-widest text-teal-400">Session {i+1}</p>
                      <p className="text-sm font-bold">{format(s.date, 'EEE, do MMM')} @ {s.slot}</p>
                    </div>
                    <button onClick={() => removeSession(i)} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                  </div>
                )) : (
                  <p className="text-slate-500 italic text-sm text-center py-4">No sessions scheduled yet.</p>
                )}
              </div>

              {scheduledSessions.length === sessionsNeeded ? (
                <div className="pt-4 space-y-4">
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-teal-400 shrink-0" size={18} />
                    <p className="text-[10px] text-teal-100 font-bold leading-relaxed uppercase tracking-wide">
                      All {sessionsNeeded} sessions required for this {treatmentPlan.hours_per_session}-hour procedure have been allocated.
                    </p>
                  </div>
                  <button
                    onClick={handleConfirmAllBookings}
                    disabled={isSaving}
                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-50"
                  >
                    {isSaving ? 'Finalizing...' : 'Confirm Full Timeline'}
                  </button>
                </div>
              ) : (
                <div className="pt-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-amber-400 shrink-0" size={18} />
                    <p className="text-[10px] text-amber-100 font-bold leading-relaxed uppercase tracking-wide">
                      Awaiting {sessionsRemaining} more sessions to complete the clinical timeline.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-12 text-center space-y-8 max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={56} /></div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Timeline Verified!</h2>
            <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
              All treatment sessions have been synchronized. The patient has been notified of their full clinical schedule.
            </p>
          </div>
          
          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 text-left space-y-6">
            {scheduledSessions.map((s, i) => (
              <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session {i+1}</span>
                <span className="font-black text-slate-900">{format(s.date, 'PPPP')} at {s.slot}</span>
              </div>
            ))}
          </div>

          <button onClick={() => window.location.href = '/'} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Return to Dashboard</button>
        </div>
      )}
    </div>
  );
}
