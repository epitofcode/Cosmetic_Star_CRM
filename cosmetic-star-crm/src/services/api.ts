import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://cosmetic-star-crm.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
});

// Patients
export const getPatients = async (search?: string) => {
    const response = await api.get('/patients', { params: { search } });
    return response.data;
};

export const createPatient = async (patientData: any) => {
    const response = await api.post('/patients', patientData);
    return response.data;
};

export const updatePatient = async (id: string, patientData: any) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
};

export const deletePatient = async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
};

// Assessments
export const saveAssessment = async (patientId: string, assessmentData: any) => {
    const response = await api.post('/assessment', { patient_id: patientId, data: assessmentData });
    return response.data;
};

export const getAssessment = async (patientId: string) => {
    const response = await api.get(`/assessment/${patientId}`);
    return response.data;
};

// Treatment Plans
export const saveTreatmentPlan = async (planData: any) => {
    const response = await api.post('/treatment-plan', planData);
    return response.data;
};

export const getTreatmentPlan = async (patientId: string) => {
    const response = await api.get(`/treatment-plan/${patientId}`);
    return response.data;
};

// Contracts
export const uploadSignature = async (patientId: string, signatureBlob: Blob) => {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('signature', signatureBlob, 'signature.png');

    const response = await api.post('/contract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const checkContractStatus = async (patientId: string) => {
    const response = await api.get(`/contract/${patientId}`);
    return response.data;
};

// Bookings
export const getBookedSlots = async (date: string) => {
    const response = await api.get('/slots', { params: { date } });
    return response.data;
};

export const createBooking = async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

// Financials
export const getFinancials = async (patientId: string) => {
    const response = await api.get(`/financials/${patientId}`);
    return response.data;
};

export const recordTransaction = async (formData: FormData) => {
    const response = await api.post('/transactions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export default api;
