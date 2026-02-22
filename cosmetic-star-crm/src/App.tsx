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
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsRefreshing(true);

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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    
    // Auto-poll every 30 seconds for real-time feel
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium font-black uppercase tracking-widest text-xs">Synchronizing Clinic Data...</p>
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
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
            {isRefreshing && <Loader2 size={16} className="animate-spin text-teal-500" />}
          </div>
          <p className="text-slate-500 font-medium">Welcome back, Dr. Kavya Sangameswara. Analytics synced in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 text-slate-400 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Cloud Data
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Performance Area Chart */}
        <div className="md:col-span-2 lg:col-span-2 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Financial Stream</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">7-Day Revenue Trend</p>
            </div>
            <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueAnalytics}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(value: number) => `£${value}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#0d9488', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#0d9488" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Distribution Pie Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Patient Pipeline</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lifecycle breakdown</p>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.clinicalDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 40 : 60}
                  outerRadius={window.innerWidth < 640 ? 70 : 90}
                  paddingAngle={8}
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
                  formatter={(value: string) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Appointments</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Upcoming surgery queue</p>
            </div>
            <button onClick={() => window.location.href = '/calendar'} className="text-teal-600 font-bold text-sm hover:bg-teal-50 px-4 py-2 rounded-xl transition-all whitespace-nowrap">View Schedule</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentAppointments.length > 0 ? (
              recentAppointments.map((app, i) => (
                <div key={i} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors shrink-0">
                      {app.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{app.name}</p>
                      <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5 truncate">{app.service} • {app.time}</p>
                    </div>
                  </div>
                  <span className={cn("px-3 sm:px-4 py-1.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border shrink-0 ml-2", app.status === 'Confirmed' ? "bg-green-50 text-green-700 border-green-100" : app.status === 'In Review' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
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

        {/* Live Clinic Activity Mini-Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Clinic Pulse</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live activity volume</p>
          </div>
          <div className="flex-1 min-h-[150px] sm:min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.activityAnalytics}>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="patients" 
                  stroke="#0d9488" 
                  strokeWidth={3} 
                  dot={false} 
                />
                <Line 
                  type="stepAfter" 
                  dataKey="bookings" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-3 bg-teal-50 rounded-2xl">
              <p className="text-[8px] sm:text-[10px] font-black text-teal-600 uppercase tracking-wider mb-1">Reg Rate</p>
              <p className="text-lg sm:text-xl font-black text-teal-900">High</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <p className="text-[8px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Bookings</p>
              <p className="text-lg sm:text-xl font-black text-indigo-900">Steady</p>
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
