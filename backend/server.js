import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer Configuration for Signature Uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        supabaseConnected: !!supabaseUrl && !!supabaseKey,
        time: new Date().toISOString() 
    });
});

// --- API Endpoints ---

// 1. Get Patients (Searchable)
app.get('/api/patients', async (req, res) => {
    const { search } = req.query;
    let query = supabase.from('patients').select('*');

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 2. Create New Patient
app.post('/api/patients', async (req, res) => {
    console.log('Received patient creation request:', req.body);
    const { first_name, last_name, phone, email, dob, gender } = req.body;
    const { data, error } = await supabase
        .from('patients')
        .insert([{ first_name, last_name, phone, email, dob, gender }])
        .select();

    if (error) {
        console.error('Supabase error creating patient:', error);
        return res.status(400).json({ error: error.message });
    }
    console.log('Patient created successfully:', data[0]);
    res.status(201).json(data[0]);
});

// 3. Save Medical Assessment
app.post('/api/assessment', async (req, res) => {
    const { patient_id, data: assessmentData } = req.body;
    const { data, error } = await supabase
        .from('medical_intakes')
        .insert([{ patient_id, data: assessmentData }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 4. Upload Signature & Create Contract
app.post('/api/contract', upload.single('signature'), async (req, res) => {
    const { patient_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Signature file is required' });

    const fileName = `signatures/${patient_id}_${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, file.buffer, { contentType: 'image/png' });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(fileName);

    // Save Record to Contracts Table
    const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([{ patient_id, signature_url: publicUrl }])
        .select();

    if (contractError) return res.status(400).json({ error: contractError.message });
    res.status(201).json(contractData[0]);
});

// 5. Check Contract Status
app.get('/api/contract/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('patient_id', patientId)
        .single();

    if (error && error.code !== 'PGRST116') return res.status(400).json({ error: error.message });
    res.json({ signed: !!data, contract: data || null });
});

// 6. Get Booked Slots for a Date
app.get('/api/slots', async (req, res) => {
    const { date } = req.query;
    const { data, error } = await supabase
        .from('bookings')
        .select('time_slot')
        .eq('date', date);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map(b => b.time_slot));
});

// 7. Create Booking (Requires Contract)
app.post('/api/bookings', async (req, res) => {
    const { patient_id, service_type, date, time_slot } = req.body;

    // Verify Contract
    const { data: contract } = await supabase
        .from('contracts')
        .select('id')
        .eq('patient_id', patient_id)
        .single();

    if (!contract) return res.status(403).json({ error: 'Patient must sign a contract before booking.' });

    const { data, error } = await supabase
        .from('bookings')
        .insert([{ patient_id, service_type, date, time_slot }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
