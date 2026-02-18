import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Patients from './pages/Patients';
import HealthAssessment from './pages/HealthAssessment';
import TreatmentPlan from './pages/TreatmentPlan';
import DigitalContract from './pages/DigitalContract';
import CalendarPage from './pages/Calendar';
import Financials from './pages/Financials';

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
      <p className="text-slate-500">Welcome back, Dr. Kavya Sangameswara. Here's what's happening today.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Patients', value: '1,284', change: '+12%', color: 'teal' },
        { label: 'Today\'s Appointments', value: '18', change: '4 remaining', color: 'slate' },
        { label: 'Monthly Revenue', value: '$42,500', change: '+8%', color: 'teal' },
        { label: 'Pending Reports', value: '7', change: '2 urgent', color: 'red' },
      ].map((stat) => (
        <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <h2 className="text-3xl font-bold text-slate-900">{stat.value}</h2>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              stat.color === 'teal' ? 'bg-teal-100 text-teal-700' : 
              stat.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Upcoming Appointments</h3>
        <button className="text-teal-600 font-semibold text-sm hover:text-teal-700">View All</button>
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-semibold text-slate-600 text-xs">
                JD
              </div>
              <div>
                <p className="font-semibold text-slate-900">Jane Doe {i}</p>
                <p className="text-xs text-slate-500">Consultation • 09:30 AM</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
              Confirmed
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

import { PatientProvider } from './context/PatientContext';

function App() {
  const [isContractSigned, setIsContractSigned] = useState(false);

  useEffect(() => {
    const signed = localStorage.getItem('isContractSigned') === 'true';
    setIsContractSigned(signed);
  }, []);

  const handleSignContract = () => {
    localStorage.setItem('isContractSigned', 'true');
    setIsContractSigned(true);
  };

  return (
    <PatientProvider>
      <Router>
        <DashboardLayout isContractSigned={isContractSigned}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/assessment" element={<HealthAssessment />} />
            <Route path="/treatment" element={<TreatmentPlan />} />
            <Route path="/contract" element={<DigitalContract onSign={handleSignContract} />} />
            <Route 
              path="/calendar" 
              element={
                isContractSigned 
                  ? <CalendarPage /> 
                  : <Navigate to="/contract" replace />
              } 
            />
            <Route path="/financials" element={<Financials />} />
            <Route path="/settings" element={<div className="p-8">Settings Page Placeholder</div>} />
          </Routes>
        </DashboardLayout>
      </Router>
    </PatientProvider>
  );
}

export default App;
