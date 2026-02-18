import emailjs from '@emailjs/browser';

// Replace these with your actual EmailJS credentials
const SERVICE_ID = 'service_your_id';
const TEMPLATE_ID = 'template_your_id';
const PUBLIC_KEY = 'public_key_your_key';

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
    // We are simulating success for the prototype unless real keys are provided
    if (SERVICE_ID === 'service_your_id') {
      console.log('Mocking email send:', data);
      return { status: 200, text: 'OK (Mock)' };
    }

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: data.to_name,
        to_email: data.to_email,
        message: `Your appointment for ${data.service} is confirmed for ${data.date} at ${data.time} with ${data.practitioner}.`,
        reply_to: 'admin@cosmeticstar.com',
      },
      PUBLIC_KEY
    );
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
