import React, { useState } from 'react';
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
  Mail,
  User,
  ShieldCheck,
  UserCheck,
  UserCircle2,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';
import { getBookedSlots, createBooking } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

export default function CalendarPage() {
  const { selectedPatient } = usePatient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = addDays(startOfWeek(addDays(monthEnd, 7), { weekStartsOn: 1 }), -1);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const handlePrevMonth = () => setCurrentDate(addWeeks(currentDate, -4));
  const handleNextMonth = () => setCurrentDate(addWeeks(currentDate, 4));

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

  const handleConfirmBooking = async () => {
    if (!selectedPatient || !selectedDate || !selectedSlot) return;

    try {
      setIsSaving(true);
      await createBooking({
        patient_id: selectedPatient.id,
        service_type: 'Surgery',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedSlot
      });

      await sendBookingConfirmation({
        to_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        to_email: selectedPatient.email,
        date: format(selectedDate, 'PPP'),
        time: selectedSlot,
        practitioner: 'Dr. Kavya Sangameswara',
        service: 'FUE Hair Transplant'
      });
      
      setIsBookingConfirmed(true);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to schedule booking. Ensure contract is signed.');
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
          <p className="text-slate-500 max-w-xs mx-auto">Please select a patient first to book a surgery slot.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <UserCheck size={14} />
            Patient: {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Surgery Booking</h1>
          <p className="text-slate-500">Select a date and time for the procedure.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-bold animate-pulse">
          <ShieldCheck size={18} />
          Contract Signed & Verified
        </div>
      </div>

      {!isBookingConfirmed ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Picker */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{format(currentDate, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isPast = day < new Date() && !isToday(day);

                  return (
                    <button
                      key={idx}
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        "h-14 flex flex-col items-center justify-center rounded-xl transition-all border relative",
                        !isCurrentMonth ? "text-slate-300 border-transparent" : "border-slate-100",
                        isSelected 
                          ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-500/20 scale-105 z-10" 
                          : isPast 
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed border-transparent" 
                            : "hover:border-teal-500 hover:text-teal-600 bg-white text-slate-700"
                      )}
                    >
                      <span className="text-sm font-bold">{format(day, 'd')}</span>
                      {isToday(day) && (
                        <span className={cn(
                          "absolute bottom-2 w-1 h-1 rounded-full",
                          isSelected ? "bg-white" : "bg-teal-500"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slot Selection & Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="text-teal-600" size={20} />
                Available Slots
              </h3>
              
              {selectedDate ? (
                <div className="relative">
                  {isLoadingSlots && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Loader2 className="animate-spin text-teal-600" size={24} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "py-3 px-4 rounded-xl text-sm font-bold transition-all border",
                            selectedSlot === slot
                              ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm ring-1 ring-teal-500"
                              : isBooked
                                ? "bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed line-through"
                                : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <CalendarIcon size={24} />
                  </div>
                  <p className="text-sm text-slate-500">Select a date to view available surgery slots.</p>
                </div>
              )}
            </div>

            {selectedDate && selectedSlot && (
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-teal-400">
                  <CheckCircle2 size={18} />
                  Booking Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CalendarIcon size={16} />
                    <span>{format(selectedDate, 'EEEE, do MMMM yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Clock size={16} />
                    <span>Arrival at {selectedSlot}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <User size={16} />
                    <span>Dr. Kavya Sangameswara</span>
                  </div>
                </div>
                <button
                  onClick={handleConfirmBooking}
                  disabled={isSaving}
                  className="w-full mt-8 bg-teal-500 hover:bg-teal-400 text-slate-900 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSaving ? 'Scheduling...' : 'Confirm Booking'}
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-4">
                  A confirmation email will be sent automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Booking Confirmed!</h2>
            <p className="text-slate-500">The surgery has been successfully scheduled and the patient notified.</p>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</span>
              <span className="font-bold text-slate-900">{format(selectedDate!, 'PPP')} at {selectedSlot}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <div className="flex items-center gap-2 text-teal-600 font-bold text-sm">
                <Mail size={16} />
                Email Notification Sent
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsBookingConfirmed(false)}
            className="text-teal-600 font-bold text-sm hover:underline"
          >
            Modify or schedule another booking
          </button>
        </div>
      )}
    </div>
  );
}
