import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Patients from './pages/Patients';
import HealthAssessment from './pages/HealthAssessment';
import TreatmentPlan from './pages/TreatmentPlan';
import DigitalContract from './pages/DigitalContract';
import CalendarPage from './pages/Calendar';
import Financials from './pages/Financials';
import { PatientProvider, usePatient } from './context/PatientContext';
import { checkContractStatus, getDashboardStats, getRecentAppointments } from './services/api';

import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar as CalendarIcon, 
  ClipboardCheck, 
  Wallet, 
  UserPlus, 
  Users, 
  FileText, 
  PenTool, 
  DollarSign,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StarIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const COLORS = ['#0d9488', '#6366f1', '#10b981', '#f59e0b'];

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, recentData] = await Promise.all([
          getDashboardStats(),
          getRecentAppointments()
        ]);
        setStats(statsData);
        setRecentAppointments(recentData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Analyzing Clinic Performance...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Patients', value: stats?.totalPatients?.toLocaleString() || '0', change: '+12.5%', up: true, icon: Users, color: 'teal' },
    { label: 'Surgery Bookings', value: stats?.surgeryBookings?.toLocaleString() || '0', change: 'Live', up: true, icon: CalendarIcon, color: 'indigo' },
    { label: 'Monthly Revenue', value: `£${stats?.totalRevenue?.toLocaleString() || '0'}`, change: '+8.2%', up: true, icon: Wallet, color: 'emerald' },
    { label: 'Pending Reports', value: stats?.pendingReports?.toLocaleString() || '0', change: 'Urgent', up: false, icon: ClipboardCheck, color: 'amber' },
  ];

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome back, Dr. Kavya Sangameswara. Here's your clinic's pulse today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <CalendarIcon size={18} className="text-slate-400" />
            Today
          </button>
          <button onClick={() => window.location.href = '/patients'} className="bg-teal-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2">
            <Plus size={18} />
            Add Patient
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-default">
            <div className="flex items-center justify-between mb-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.color === 'teal' ? "bg-teal-50 text-teal-600" : stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" : stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                <stat.icon size={24} />
              </div>
              <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", stat.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Revenue Analytics</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Last 7 days performance</p>
            </div>
            <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(value: number) => `£${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#0d9488" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Clinical Distribution</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Patient lifecycle status</p>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.clinicalDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.clinicalDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value: string) => <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Appointments</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Upcoming surgery queue</p>
            </div>
            <button onClick={() => window.location.href = '/calendar'} className="text-teal-600 font-bold text-sm hover:bg-teal-50 px-4 py-2 rounded-xl transition-all">View Schedule</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((app, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                      {app.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{app.name}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{app.service} • {app.time}</p>
                    </div>
                  </div>
                  <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border", app.status === 'Confirmed' ? "bg-green-50 text-green-600 border-green-100" : app.status === 'In Review' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-500 italic">No recent appointments recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">Commonly used clinic tools.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Register', icon: UserPlus, href: '/patients' },
                  { label: 'Plan', icon: FileText, href: '/treatment' },
                  { label: 'Sign', icon: PenTool, href: '/contract' },
                  { label: 'Payments', icon: DollarSign, href: '/financials' },
                ].map((action) => (
                  <button key={action.label} onClick={() => window.location.href = action.href} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-[1.5rem] flex flex-col items-center gap-3 transition-all active:scale-95 group/btn">
                    <action.icon size={20} className="text-teal-400 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function AppContent() {
  const { selectedPatient } = usePatient();
  const [isContractSigned, setIsContractSigned] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      checkContractStatus(selectedPatient.id).then(res => {
        setIsContractSigned(res.signed);
      }).catch(() => setIsContractSigned(false));
    } else {
      setIsContractSigned(false);
    }
  }, [selectedPatient]);

  return (
    <Router>
      <DashboardLayout isContractSigned={isContractSigned}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/assessment" element={<HealthAssessment />} />
          <Route path="/treatment" element={<TreatmentPlan />} />
          <Route path="/contract" element={<DigitalContract onSign={() => setIsContractSigned(true)} />} />
          <Route path="/calendar" element={isContractSigned ? <CalendarPage /> : <Navigate to="/contract" replace />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/settings" element={<div className="p-8">Settings Page Placeholder</div>} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

function App() {
  return (
    <PatientProvider>
      <AppContent />
    </PatientProvider>
  );
}

export default App;
