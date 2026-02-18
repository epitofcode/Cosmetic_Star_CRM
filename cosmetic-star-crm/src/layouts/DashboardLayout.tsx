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
  Lock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Patients', icon: Users, href: '/patients' },
  { name: 'Assessment', icon: ClipboardList, href: '/assessment' },
  { name: 'Treatments', icon: FileText, href: '/treatment' },
  { name: 'Contract', icon: PenTool, href: '/contract' },
  { name: 'Calendar', icon: Calendar, href: '/calendar', requiresContract: true },
  { name: 'Financials', icon: DollarSign, href: '/financials' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function DashboardLayout({ children, isContractSigned }: { children: React.ReactNode, isContractSigned: boolean }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 lg:static lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-teal-400">Cosmetic Star</span>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isLocked = item.requiresContract && !isContractSigned;

            return (
              <Link
                key={item.name}
                to={isLocked ? '#' : item.href}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-teal-600 text-white" 
                    : isLocked
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    alert('Please sign the contract to unlock the calendar.');
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {isLocked && <Lock size={14} className="text-slate-600" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-teal-500 rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">Dr. Kavya Sangameswara</p>
                <p className="text-xs text-slate-500">Principal Practitioner</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold">
                KS
              </div>
              <ChevronDown className="text-slate-400 cursor-pointer" size={16} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-white">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
