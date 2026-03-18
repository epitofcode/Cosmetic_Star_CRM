import axios from 'axios';
import { supabase } from './supabase';

// --- Shared Types ---
export interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    dob?: string;
    gender?: string;
    alternate_phone?: string;
    address?: string;
    city?: string;
    postcode?: string;
    lead_source?: string;
    created_at: string;
}

export interface PatientPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    dob?: string | null;
    gender?: string;
    alternate_phone?: string | null;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    lead_source?: string;
}

export interface TreatmentPlan {
    id: string;
    patient_id: number;
    service_id: string;
    service_name: string;
    base_cost: number;
    discount: number;
    total_to_pay: number;
    total_sessions?: number;
    graft_count?: string;
    treatment_area?: string;
    notes?: string;
    status: string;
    created_at: string;
}

export interface TreatmentPlanPayload {
    patient_id: number | string;
    service_id: string;
    service_name: string;
    base_cost: number;
    discount: number;
    total_to_pay: number;
    total_sessions?: number;
    graft_count?: string;
    treatment_area?: string;
    notes?: string;
    status?: string;
}

export interface Booking {
    id: string;
    patient_id: number;
    service_type: string;
    date: string;
    time_slot: string;
    status: string;
    created_at: string;
}

export interface BookingPayload {
    patient_id: number | string;
    service_type: string;
    date: string;
    time_slot: string;
}

export interface Transaction {
    id: string;
    amount: number;
    type?: string;
    date: string;
    proof_name: string;
    proof_url?: string;
    receipt_number: string;
}

export interface BillingRecord {
    id: string;
    patient_id: number;
    service_name: string;
    total_amount: number;
    amount_paid: number;
    status: 'Payment Pending' | 'Payment Done';
    transactions: Transaction[];
}

export interface ClinicService {
    id: string;
    name: string;
    base_price: number;
    description?: string;
    color_code?: string;
    is_active: boolean;
}

export interface ServicePayload {
    name: string;
    base_price?: number;
    description?: string;
    color_code?: string;
    is_active?: boolean;
}

export interface FormTemplate {
    id: string;
    service_id: string;
    form_type: 'consent' | 'intake' | 'contract';
    title: string;
    fields: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    clinic_services?: { name: string };
}

export interface FormTemplatePayload {
    service_id: string;
    form_type: 'consent' | 'intake' | 'contract';
    title: string;
    fields: Record<string, unknown>;
}

export interface PatientFormPayload {
    patient_id: number | string;
    template_id: string;
    answers: Record<string, unknown>;
    filled_by_staff_id: string | null;
}

export interface DashboardStats {
    totalPatients: number;
    surgeryBookings: number;
    totalRevenue: number;
    pendingReports: number;
    pendingBreakdown: PendingBreakdown;
    revenueAnalytics: { date: string; amount: number }[];
    clinicalDistribution: { name: string; value: number }[];
}

export interface PendingBreakdown {
    missingIntake: PendingItem[];
    complianceGap: PendingItemWithService[];
    unpaidBalances: PendingItemWithBalance[];
    postOpFollowups: PendingItemWithDateService[];
    bookingBottleneck: PendingItem[];
}

export interface PendingItem { id: number; name: string }
export interface PendingItemWithService extends PendingItem { service: string }
export interface PendingItemWithBalance extends PendingItem { balance: number }
export interface PendingItemWithDateService extends PendingItem { date: string; service: string }

export interface RecentAppointment {
    name: string;
    service: string;
    time: string;
    status: string;
}

// --- API Client ---
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Patients
export const getPatients = async (search?: string): Promise<Patient[]> => {
    const response = await api.get('/patients', { params: { search } });
    return response.data;
};

export const createPatient = async (patientData: PatientPayload): Promise<Patient> => {
    const response = await api.post('/patients', patientData);
    return response.data;
};

export const updatePatient = async (id: number | string, patientData: PatientPayload): Promise<Patient> => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
};

export const deletePatient = async (id: number | string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
};

// Assessments
export const saveAssessment = async (patientId: number | string, assessmentData: Record<string, unknown>) => {
    const response = await api.post('/assessment', { patient_id: patientId, data: assessmentData });
    return response.data;
};

export const getAssessment = async (patientId: number | string) => {
    const response = await api.get(`/assessment/${patientId}`);
    return response.data;
};

// Treatment Plans
export const saveTreatmentPlan = async (planData: TreatmentPlanPayload): Promise<TreatmentPlan> => {
    const response = await api.post('/treatment-plan', planData);
    return response.data;
};

export const getTreatmentPlan = async (patientId: number | string): Promise<TreatmentPlan | null> => {
    const response = await api.get(`/treatment-plan/${patientId}`);
    return response.data;
};

export const getFormsForService = async (serviceId: string): Promise<FormTemplate[]> => {
    const response = await api.get(`/form-templates/${serviceId}`);
    return response.data;
};

// Contracts
export const uploadSignature = async (patientId: number | string, signatureBlob: Blob) => {
    const formData = new FormData();
    formData.append('patient_id', patientId.toString());
    formData.append('signature', signatureBlob, 'signature.png');
    const response = await api.post('/contract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const checkContractStatus = async (patientId: number | string) => {
    const response = await api.get(`/contract/${patientId}`);
    return response.data;
};

// Bookings
export const getBookedSlots = async (date: string): Promise<string[]> => {
    const response = await api.get('/slots', { params: { date } });
    return response.data;
};

export const createBooking = async (bookingData: BookingPayload): Promise<Booking> => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

export const deleteBooking = async (id: string | number) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
};

export const getBooking = async (patientId: number | string): Promise<Booking[]> => {
    const response = await api.get(`/bookings/${patientId}`);
    return response.data;
};

// Financials
export const getFinancials = async (patientId: number | string): Promise<BillingRecord> => {
    const response = await api.get(`/financials/${patientId}`);
    return response.data;
};

export const recordTransaction = async (formData: FormData) => {
    const response = await api.post('/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// Admin Database Explorer
export const adminGetTableData = async (tableName: string) => {
    const response = await api.get(`/admin/tables/${tableName}`);
    return response.data;
};

export const adminUpdateRow = async (tableName: string, id: number | string, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/tables/${tableName}/${id}`, data);
    return response.data;
};

export const adminDeleteRow = async (tableName: string, id: number | string) => {
    const response = await api.delete(`/admin/tables/${tableName}/${id}`);
    return response.data;
};

// Admin Services
export const adminGetServices = async (): Promise<ClinicService[]> => {
    const response = await api.get('/admin/services');
    return response.data;
};

export const adminCreateService = async (serviceData: ServicePayload) => {
    const response = await api.post('/admin/services', serviceData);
    return response.data;
};

export const adminUpdateService = async (id: string, serviceData: Partial<ServicePayload>) => {
    const response = await api.put(`/admin/services/${id}`, serviceData);
    return response.data;
};

export const adminDeleteService = async (id: string) => {
    const response = await api.delete(`/admin/services/${id}`);
    return response.data;
};

// Admin Form Templates
export const adminGetFormTemplates = async (): Promise<FormTemplate[]> => {
    const response = await api.get('/admin/form-templates');
    return response.data;
};

export const adminCreateFormTemplate = async (templateData: FormTemplatePayload) => {
    const response = await api.post('/admin/form-templates', templateData);
    return response.data;
};

export const adminUpdateFormTemplate = async (id: string, templateData: Partial<FormTemplatePayload>) => {
    const response = await api.put(`/admin/form-templates/${id}`, templateData);
    return response.data;
};

export const adminDeleteFormTemplate = async (id: string) => {
    const response = await api.delete(`/admin/form-templates/${id}`);
    return response.data;
};

// Staff Patient Forms
export const staffCreatePatientForm = async (formData: PatientFormPayload) => {
    const response = await api.post('/patient-forms', formData);
    return response.data;
};

export const staffGetPatientForms = async (patientId: string | number) => {
    const response = await api.get(`/patient-forms/${patientId}`);
    return response.data;
};

export const staffUploadPhoto = async (patientId: string | number, photoData: FormData) => {
    const response = await api.post(`/patients/${patientId}/photos`, photoData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const staffGetPhotos = async (patientId: string | number) => {
    const response = await api.get(`/patients/${patientId}/photos`);
    return response.data;
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

export const getRecentAppointments = async (): Promise<RecentAppointment[]> => {
    const response = await api.get('/dashboard/recent-appointments');
    return response.data;
};

export default api;
