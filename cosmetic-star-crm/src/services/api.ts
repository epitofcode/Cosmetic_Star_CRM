import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://cosmetic-star-crm.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
});

export const getPatients = async (search?: string) => {
    const response = await api.get('/patients', { params: { search } });
    return response.data;
};

export const createPatient = async (patientData: any) => {
    const response = await api.post('/patients', patientData);
    return response.data;
};

export const saveAssessment = async (patientId: string, assessmentData: any) => {
    const response = await api.post('/assessment', { patient_id: patientId, data: assessmentData });
    return response.data;
};

export const getAssessment = async (patientId: string) => {
    const response = await api.get(`/assessment/${patientId}`);
    return response.data;
};

export const getTreatmentPlan = async (patientId: string) => {
    const response = await api.get(`/treatment-plan/${patientId}`);
    return response.data;
};

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

export const getBookedSlots = async (date: string) => {
    const response = await api.get('/slots', { params: { date } });
    return response.data;
};

export const createBooking = async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

export default api;
