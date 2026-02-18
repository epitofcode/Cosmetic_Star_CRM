import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PatientContextType {
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  clearPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => {
    const saved = localStorage.getItem('selectedPatient');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetSelectedPatient = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      localStorage.setItem('selectedPatient', JSON.stringify(patient));
    } else {
      localStorage.removeItem('selectedPatient');
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    localStorage.removeItem('selectedPatient');
  };

  return (
    <PatientContext.Provider value={{ selectedPatient, setSelectedPatient: handleSetSelectedPatient, clearPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
