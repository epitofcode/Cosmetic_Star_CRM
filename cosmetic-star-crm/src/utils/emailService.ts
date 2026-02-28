import api from '../services/api';

interface EmailData {
  to_name: string;
  to_email: string;
  date: string;
  time: string;
  practitioner: string;
  service: string;
}

export const sendBookingConfirmation = async (data: EmailData) => {
  try {
    const response = await api.post('/email/send-confirmation', {
      to_email: data.to_email,
      to_name: data.to_name,
      date: data.date,
      time: data.time,
      practitioner: data.practitioner,
      service: data.service,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send email via backend:', error);
    throw error;
  }
};
