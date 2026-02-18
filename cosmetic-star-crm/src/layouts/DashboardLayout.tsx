import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList,
  DollarSign, 
  Settings, 
  Search, 
  Bell, 
  User,
  FileText,
  PenTool,
  ChevronDown,
  Menu,
  X,
  Lock,
  UserCheck,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePatient } from '../context/PatientContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Patients', icon: Users, href: '/patients' },
  { name: 'Assessment', icon: ClipboardList, href: '/assessment', requiresPatient: true },
  { name: 'Treatments', icon: FileText, href: '/treatment', requiresPatient: true },
  { name: 'Contract', icon: PenTool, href: '/contract', requiresPatient: true },
  { name: 'Calendar', icon: Calendar, href: '/calendar', requiresContract: true, requiresPatient: true },
  { name: 'Financials', icon: DollarSign, href: '/financials', requiresPatient: true },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function DashboardLayout({ children, isContractSigned }: { children: React.ReactNode, isContractSigned: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();
  const { selectedPatient, clearPatient } = usePatient();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-all duration-300 lg:static lg:translate-x-0 flex flex-col shadow-2xl",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center px-8 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <StarIcon className="text-white fill-white" size={24} />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase italic">Cosmetic <span className="text-teal-400">Star</span></span>
          </div>
        </div>

        {/* Selected Patient Banner */}
        <AnimatePresence mode="wait">
          {selectedPatient && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 mt-8 p-5 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full flex items-center justify-center font-bold text-slate-900 shadow-inner">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-0.5">Active Patient</p>
                  <p className="text-sm font-bold truncate text-white">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
              </div>
              <button 
                onClick={clearPatient}
                className="w-full py-2.5 text-[10px] font-black bg-white/5 hover:bg-white/10 text-teal-100 rounded-xl transition-all uppercase tracking-widest border border-white/5"
              >
                Switch Patient
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="p-6 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isPatientLocked = item.requiresPatient && !selectedPatient;
            const isContractLocked = item.requiresContract && !isContractSigned;
            const isLocked = isPatientLocked || isContractLocked;

            return (
              <Link
                key={item.name}
                to={isLocked ? '#' : item.href}
                className={cn(
                  "group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden",
                  isActive 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                    : isLocked
                      ? "text-slate-600 cursor-not-allowed opacity-50"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    if (isPatientLocked) alert('Please select a patient first.');
                    else if (isContractLocked) alert('Please sign the contract to unlock this section.');
                  }
                }}
              >
                <div className="flex items-center gap-3.5 relative z-10">
                  <item.icon size={20} className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-500 group-hover:text-teal-400"
                  )} />
                  <span className="font-bold text-sm tracking-wide">{item.name}</span>
                </div>
                {isLocked && <Lock size={14} className="text-slate-700 group-hover:text-teal-900 transition-colors" />}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-500 z-0"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 text-slate-500 hover:text-white cursor-pointer transition-colors px-4 group">
            <HelpCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Support Center</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden md:flex relative group w-80 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search global patient records..."
                className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex items-center gap-1">
              <button className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all relative group">
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20"></span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="relative">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100 rounded-2xl transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 text-teal-400 rounded-xl flex items-center justify-center font-black shadow-lg shadow-slate-200 group-active:scale-95 transition-transform">
                  KS
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Dr. Kavya S.</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principal</p>
                </div>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isUserDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden z-50"
                  >
                    <div className="p-3 mb-2 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">kavya@cosmeticstar.uk</p>
                    </div>
                    <button className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                      <User size={18} className="text-slate-400" />
                      My Profile
                    </button>
                    <button className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                      <Settings size={18} className="text-slate-400" />
                      Clinic Settings
                    </button>
                    <div className="h-[1px] bg-slate-100 my-2 mx-2" />
                    <button className="flex items-center gap-3 w-full p-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut size={18} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-10 bg-[#FBFBFE] custom-scrollbar">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StarIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
