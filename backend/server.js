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

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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

// 2b. Update Patient
app.put('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, email, dob, gender } = req.body;
    const { data, error } = await supabase
        .from('patients')
        .update({ first_name, last_name, phone, email, dob, gender })
        .eq('id', id)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// 2c. Delete Patient
app.delete('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Patient deleted successfully' });
});

// 3. Save Medical Assessment
app.post('/api/assessment', async (req, res) => {
    const { patient_id, data: assessmentData } = req.body;
    const { data, error } = await supabase
        .from('medical_intakes')
        .upsert([{ patient_id, data: assessmentData }], { onConflict: 'patient_id' })
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 3b. Get Medical Assessment
app.get('/api/assessment/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase
        .from('medical_intakes')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || null);
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

// 8. Create or Update Treatment Plan
app.post('/api/treatment-plan', async (req, res) => {
    const { patient_id, service_id, service_name, base_cost, discount, total_to_pay } = req.body;
    
    const { data, error } = await supabase
        .from('treatment_plans')
        .upsert([{ 
            patient_id, 
            service_id, 
            service_name, 
            base_cost, 
            discount, 
            total_to_pay,
            status: 'Active'
        }], { onConflict: 'patient_id' })
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/treatment-plan/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || null);
});

// 9. Get Financials for a Patient
app.get('/api/financials/:patientId', async (req, res) => {
    const { patientId } = req.params;

    // Get Plan
    const { data: plan, error: planError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

    if (!plan) return res.status(404).json({ error: 'No treatment plan found' });

    // Get Transactions
    const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    const amountPaid = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    res.json({
        id: plan.id,
        patient_id: plan.patient_id,
        service_name: plan.service_name,
        total_amount: Number(plan.total_to_pay),
        amount_paid: amountPaid,
        status: amountPaid >= Number(plan.total_to_pay) ? 'Payment Done' : 'Payment Pending',
        transactions: transactions || []
    });
});

// 10. Record Transaction with Proof
app.post('/api/transactions', upload.single('proof'), async (req, res) => {
    const { patient_id, amount } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Proof of payment is required' });

    const fileName = `proofs/${patient_id}_${Date.now()}_${file.originalname}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName);
    const receiptNumber = `CS-RC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Save Transaction
    const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
            patient_id, 
            amount: Number(amount), 
            type: 'Installment', 
            proof_url: publicUrl,
            proof_name: file.originalname,
            receipt_number: receiptNumber,
            date: new Date().toISOString().split('T')[0]
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 404 Handler
app.use((req, res) => {
    console.warn(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Path ${req.url} with method ${req.method} not found on this server.` });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
