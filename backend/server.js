// v1.0.8-RAILWAY-MONOREPO-FIX
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';

dotenv.config();
dotenv.config({ path: '../.env' }); // Fallback for different execution contexts

const app = express();
const port = process.env.PORT || 3001;

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL ERROR: Supabase credentials missing!");
    console.error("SUPABASE_URL:", supabaseUrl ? "Found" : "MISSING");
    console.error("SUPABASE_KEY:", supabaseKey ? "Found" : "MISSING");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Resend Configuration
const resend = new Resend(process.env.RESEND_API_KEY);

// Multer Configuration for Uploads
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
        version: '1.1.0-ST-BUILD-OPT',
        supabaseConnected: !!supabaseUrl && !!supabaseKey,
        time: new Date().toISOString() 
    });
});

// --- System Diagnostic ---
app.get('/api/diagnostic', async (req, res) => {
    const results = {
        database: {},
        storage: {},
        env: {
            url: !!supabaseUrl,
            key: !!supabaseKey
        }
    };

    const tables = ['patients', 'medical_intakes', 'contracts', 'bookings', 'treatment_plans', 'transactions'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        results.database[table] = error ? `Error: ${error.message}` : 'Healthy';
    }

    const buckets = ['signatures', 'proofs'];
    for (const bucket of buckets) {
        const { error } = await supabase.storage.getBucket(bucket);
        results.storage[bucket] = error ? `Error: ${error.message}` : 'Healthy';
    }

    res.json(results);
});

// --- API Endpoints ---

// 1. Get Patients (Searchable)
app.get('/api/patients', async (req, res) => {
    const { search } = req.query;
    let query = supabase.from('patients').select('*, treatment_plans(status), contracts(id)');

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return res.status(400).json({ error: error.message });

    // Map data to include a computed status
    const formattedData = data.map(p => {
        let status = 'New Patient';
        if (p.contracts && p.contracts.length > 0) {
            status = 'Contract Signed';
        } else if (p.treatment_plans && p.treatment_plans.length > 0) {
            status = 'Plan Created';
        }
        
        return {
            ...p,
            status: p.treatment_plans?.[0]?.status || status
        };
    });

    res.json(formattedData);
});

// 2. Create New Patient
app.post('/api/patients', async (req, res) => {
    const { first_name, last_name, phone, email, dob, gender } = req.body;
    const { data, error } = await supabase
        .from('patients')
        .insert([{ first_name, last_name, phone, email, dob, gender }])
        .select();

    if (error) {
        if (error.code === '23505') {
            return res.status(409).json({ 
                error: 'A patient with this email address is already registered in the system.',
                code: 'DUPLICATE_EMAIL'
            });
        }
        return res.status(400).json({ error: error.message });
    }
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

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, file.buffer, { contentType: 'image/png' });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(fileName);

    const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .upsert([{ patient_id, signature_url: publicUrl }], { onConflict: 'patient_id' })
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
        .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ signed: !!data, contract: data || null });
});

// 7b. Get Booking for a Patient
app.get('/api/bookings/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('patient_id', patientId); // Changed to allow multiple sessions

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// 8. Create or Update Treatment Plan
app.post('/api/treatment-plan', async (req, res) => {
    const { 
        patient_id, service_id, service_name, base_cost, discount, 
        total_to_pay, total_sessions = 1, status = 'Active',
        graft_count, treatment_area, notes 
    } = req.body;
    
    const { data, error } = await supabase
        .from('treatment_plans')
        .upsert([{ 
            patient_id, 
            service_id, 
            service_name, 
            base_cost, 
            discount, 
            total_to_pay,
            total_sessions,
            status,
            graft_count,
            treatment_area,
            notes
        }], { onConflict: 'patient_id' })
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 9. Get Booked Slots for a Date (Simple 1-Hour Slots)
app.get('/api/slots', async (req, res) => {
    const { date } = req.query;
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('time_slot')
            .eq('date', date);

        if (error) throw error;
        res.json(data.map(b => b.time_slot));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 10. Create Booking (Session-based)
app.post('/api/bookings', async (req, res) => {
    const { patient_id, service_type, date, time_slot } = req.body;
    
    const { data, error } = await supabase
        .from('bookings')
        .insert([{ 
            patient_id, 
            service_type, 
            date, 
            time_slot,
            status: 'Confirmed' 
        }])
        .select();

    if (error) {
        // Handle unique constraint violation (date, time_slot)
        if (error.code === '23505') return res.status(400).json({ error: 'This time slot is no longer available.' });
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

// 10b. Delete Booking
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Booking cancelled successfully' });
});

// 8b. Get Treatment Plan
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

// 11. Get Form Templates for a Service
app.get('/api/form-templates/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('service_id', serviceId);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// 9. Get Financials for a Patient
app.get('/api/financials/:patientId', async (req, res) => {
    const { patientId } = req.params;

    const { data: plan, error: planError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

    if (!plan) return res.status(404).json({ error: 'No treatment plan found' });

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
    const { patient_id, amount, type = 'Installment' } = req.body;
    const file = req.file;

    console.log(`Transaction attempt: Patient=${patient_id}, Amount=${amount}, Type=${type}, HasFile=${!!file}`);

    let publicUrl = null;
    let fileNameOriginal = type === 'Cash' ? 'Cash Payment' : 'No File Provided';

    if (file) {
        const fileName = `proofs/${patient_id}_${Date.now()}_${file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('proofs')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) return res.status(400).json({ error: uploadError.message });

        const { data: { publicUrl: url } } = supabase.storage.from('proofs').getPublicUrl(fileName);
        publicUrl = url;
        fileNameOriginal = file.originalname;
    }

    const receiptNumber = `CS-RC-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
            patient_id, 
            amount: Number(amount), 
            type: type, 
            proof_url: publicUrl,
            proof_name: fileNameOriginal,
            receipt_number: receiptNumber
            // Note: 'date' is omitted here to bypass Supabase schema cache issues.
            // The DB handles it automatically via DEFAULT CURRENT_DATE.
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// --- Dashboard Endpoints ---

// 11. Get Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        console.log("Fetching dashboard stats (Sequential Mode)...");
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        // 1. Fetch counts and basic data
        const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
        const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
        const { data: monthlyTransactions } = await supabase.from('transactions').select('amount, date').gte('date', firstDayOfMonth);
        const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

        // 2. Fetch all related tables for processing
        const [{ data: patients }, { data: intakes }, { data: plans }, { data: contracts }, { data: bookings }, { data: allTransactions }] = await Promise.all([
            supabase.from('patients').select('id, first_name, last_name'),
            supabase.from('medical_intakes').select('patient_id'),
            supabase.from('treatment_plans').select('patient_id, status, total_to_pay, service_name'),
            supabase.from('contracts').select('patient_id'),
            supabase.from('bookings').select('patient_id, date, service_type'),
            supabase.from('transactions').select('patient_id, amount')
        ]);

        const pendingBreakdown = { missingIntake: [], complianceGap: [], unpaidBalances: [], postOpFollowups: [], bookingBottleneck: [] };
        const distribution = { 'New Patients': 0, 'Treatment Plans': 0, 'Contracts Signed': 0, 'Completed': 0 };
        
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        // 3. Process Logic in Node.js (Stable & Traceable)
        patients?.forEach(p => {
            const fullName = `${p.first_name} ${p.last_name}`;
            const hasIntake = intakes?.some(i => i.patient_id === p.id);
            const patientPlan = plans?.find(pl => pl.patient_id === p.id);
            const hasContract = contracts?.some(c => c.patient_id === p.id);
            const patientBookings = bookings?.filter(b => b.patient_id === p.id) || [];
            const patientTxns = allTransactions?.filter(t => t.patient_id === p.id) || [];

            // Distribution Category
            if (patientPlan?.status === 'Completed') distribution['Completed']++;
            else if (hasContract) distribution['Contracts Signed']++;
            else if (patientPlan) distribution['Treatment Plans']++;
            else distribution['New Patients']++;

            // a. Missing Intake
            if (!hasIntake) pendingBreakdown.missingIntake.push({ id: p.id, name: fullName });

            // b. Compliance Gap
            if (patientPlan && !hasContract) pendingBreakdown.complianceGap.push({ id: p.id, name: fullName, service: patientPlan.service_name });

            // c. Unpaid Balance
            if (patientPlan?.status === 'Completed') {
                const totalPaid = patientTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
                const balance = Number(patientPlan.total_to_pay || 0) - totalPaid;
                if (balance > 0) pendingBreakdown.unpaidBalances.push({ id: p.id, name: fullName, balance });
            }

            // d. Post-Op Followups
            patientBookings.forEach(b => {
                const bDate = new Date(b.date);
                if (bDate >= sevenDaysAgo && bDate < today) {
                    pendingBreakdown.postOpFollowups.push({ id: p.id, name: fullName, date: b.date, service: b.service_type });
                }
            });

            // e. Booking Bottleneck
            if (hasContract && patientBookings.length === 0) pendingBreakdown.bookingBottleneck.push({ id: p.id, name: fullName });
        });

        // 4. Final Formatting
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueAnalytics = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            amount: monthlyTransactions?.filter(t => t.date === date).reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
        }));

        res.json({
            totalPatients: patientCount || 0,
            surgeryBookings: bookingCount || 0,
            totalRevenue: monthlyRevenue,
            pendingReports: Object.values(pendingBreakdown).flat().length,
            pendingBreakdown,
            revenueAnalytics,
            activityAnalytics: [], 
            clinicalDistribution: Object.entries(distribution).map(([name, value]) => ({ 
                name, value: (value === 0 && (patientCount || 0) > 0) ? 0.1 : value 
            }))
        });
    } catch (error) {
        console.error("DASHBOARD STATS CRASH:", error);
        res.status(500).json({ error: "Internal Server Error during analytics calculation" });
    }
});

// 12. Get Recent Appointments
app.get('/api/dashboard/recent-appointments', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                id,
                service_type,
                date,
                time_slot,
                status,
                patients (
                    first_name,
                    last_name
                )
            `)
            .order('date', { ascending: false })
            .limit(5);

        if (error) throw error;

        const formatted = data.map(b => ({
            name: `${b.patients.first_name} ${b.patients.last_name}`,
            service: b.service_type,
            time: `${b.date} ${b.time_slot}`,
            status: b.status
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Admin Database Explorer Endpoints ---

// 13. Get all rows from a specific table
app.get('/api/admin/tables/:tableName', async (req, res) => {
    const { tableName } = req.params;
    let query = supabase.from(tableName).select('*');
    
    if (tableName === 'contracts') {
        query = query.order('signed_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 14. Update a row in any table
app.put('/api/admin/tables/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const updateData = req.body;
    
    // Remove protected fields
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

// 15. Delete a row from any table
app.delete('/api/admin/tables/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const { error } = await supabase.from(tableName).delete().eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Record deleted successfully' });
});

// --- Email Endpoints (Resend Integration) ---

// 16. Send Booking Confirmation
app.post('/api/email/send-confirmation', async (req, res) => {
    const { to_email, to_name, date, time, practitioner, service } = req.body;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Cosmetic Star <bookings@starteck.co.uk>', 
            to: [to_email],
            subject: 'Appointment Confirmation - Cosmetic Star',
            html: `
                <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0d9488; padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <p style="font-size: 16px;">Hello <strong>${to_name}</strong>,</p>
                        <p>We are delighted to confirm your appointment at <strong>Cosmetic Star</strong>. Here are your booking details:</p>
                        
                        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 8px 0;"><strong>Procedure:</strong> ${service}</p>
                            <p style="margin: 8px 0;"><strong>Date:</strong> ${date}</p>
                            <p style="margin: 8px 0;"><strong>Arrival Time:</strong> ${time}</p>
                            <p style="margin: 8px 0;"><strong>Practitioner:</strong> Kavya Sangameswara</p>
                        </div>

                        <p>If you need to reschedule or cancel, please contact the clinic at least 24 hours in advance.</p>
                        <p style="margin-top: 32px;">Warm regards,<br>The Cosmetic Star Team</p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                        <p style="margin: 0 0 8px 0;">This is an automated system message. Please do not reply directly to this email.</p>
                        &copy; 2026 Cosmetic Star UK Ltd. All rights reserved.
                    </div>
                </div>
            `
        });

        if (error) throw error;
        res.json({ success: true, messageId: data.id });
    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({ error: 'Failed to send automated email.' });
    }
});

// 17. Send Payment Receipt (Automated PDF)
app.post('/api/email/send-payment-receipt', async (req, res) => {
    const { to_email, to_name, amount, service_name, receipt_number, date } = req.body;

    try {
        // --- Generate PDF on the server ---
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(13, 148, 136); // Teal-600
        doc.text('COSMETIC STAR', 105, 30, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('PREMIUM AESTHETIC CLINIC', 105, 38, { align: 'center' });
        
        // Line
        doc.setDrawColor(226, 232, 240);
        doc.line(20, 45, 190, 45);
        
        // Receipt Info
        doc.setFontSize(12);
        doc.setTextColor(51, 65, 85);
        doc.text(`Receipt #: ${receipt_number}`, 20, 60);
        doc.text(`Date: ${date}`, 190, 60, { align: 'right' });
        
        doc.text(`Patient: ${to_name}`, 20, 75);
        doc.text(`Service: ${service_name}`, 20, 85);
        
        // Amount Box
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 95, 170, 30, 'F');
        doc.setFontSize(14);
        doc.text('Amount Paid:', 30, 115);
        doc.setFontSize(18);
        doc.text(`£${Number(amount).toLocaleString()}`, 180, 115, { align: 'right' });
        
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('Thank you for choosing Cosmetic Star.', 105, 150, { align: 'center' });
        doc.text('Cosmetic Star UK Ltd • Registered in England & Wales', 105, 280, { align: 'center' });

        const pdfBase64 = doc.output('datauristring').split(',')[1];

        // --- Send Email with Attachment ---
        const { data: emailData, error } = await resend.emails.send({
            from: 'Cosmetic Star <bookings@starteck.co.uk>',
            to: [to_email],
            subject: `Payment Receipt: ${receipt_number} - Cosmetic Star`,
            attachments: [
                {
                    filename: `Receipt-${receipt_number}.pdf`,
                    content: pdfBase64,
                }
            ],
            html: `
                <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0d9488; padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Received</h1>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <p style="font-size: 16px;">Hello <strong>${to_name}</strong>,</p>
                        <p>This email is to confirm that we have received your payment of <strong>£${Number(amount).toLocaleString()}</strong> for <strong>${service_name}</strong>.</p>
                        
                        <p>Your official receipt (#${receipt_number}) is attached to this email for your records.</p>
                        
                        <p style="margin-top: 32px;">If you have any questions regarding your billing, please don't hesitate to contact us.</p>
                        <p style="margin-top: 32px;">Warm regards,<br>The Cosmetic Star Financial Team</p>
                        <p style="margin-top: 48px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; pt: 16px;">This is an automated system message. Please do not reply directly to this email.</p>
                    </div>
                </div>
            `
        });

        if (error) throw error;
        res.json({ success: true, messageId: emailData.id });
    } catch (error) {
        console.error('Payment receipt email error:', error);
        res.status(500).json({ error: 'Failed to send automated payment receipt.' });
    }
});

// 18. Generate Receipt PDF for Download
app.post('/api/generate-receipt-pdf', async (req, res) => {
    const { patientId, patientName, amount, service_name, receipt_number, date, paymentMethod } = req.body;

    try {
        const doc = new jsPDF();
        
        // Design the PDF (Professional Clinical Layout)
        doc.setFillColor(13, 148, 136); // Teal header
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('COSMETIC STAR', 105, 25, { align: 'center' });
        
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        doc.text('PREMIUM AESTHETIC CLINIC • MANCHESTER, UK', 105, 50, { align: 'center' });
        
        doc.setDrawColor(226, 232, 240);
        doc.line(20, 55, 190, 55);
        
        doc.setFontSize(12);
        doc.text(`RECEIPT: #${receipt_number}`, 20, 70);
        doc.text(`DATE: ${date}`, 190, 70, { align: 'right' });
        
        doc.setFontSize(10);
        doc.text('PATIENT DETAILS', 20, 85);
        doc.setFontSize(12);
        doc.text(`${patientName} (ID: ${patientId})`, 20, 92);
        
        doc.setFontSize(10);
        doc.text('PAYMENT METHOD', 190, 85, { align: 'right' });
        doc.setFontSize(12);
        doc.text(paymentMethod || 'Bank Transfer', 190, 92, { align: 'right' });
        
        // Item Table
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 105, 170, 40, 'F');
        doc.text('SERVICE / TREATMENT', 30, 115);
        doc.text('AMOUNT PAID', 180, 115, { align: 'right' });
        
        doc.setFontSize(14);
        doc.text(service_name, 30, 130);
        doc.setFontSize(18);
        doc.text(`£${Number(amount).toLocaleString()}`, 180, 130, { align: 'right' });
        
        // Footer
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text('Thank you for choosing Cosmetic Star.', 105, 160, { align: 'center' });
        doc.text('This is an official clinical document generated by Starteck.', 105, 165, { align: 'center' });
        doc.text('Cosmetic Star UK Ltd • Registered in England & Wales', 105, 280, { align: 'center' });

        const pdfBuffer = doc.output('arraybuffer');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${patientId}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    }
});

// --- ADMIN ROUTES (Dynamic Config) ---

// A1. Services CRUD
app.get('/api/admin/services', async (req, res) => {
    const { data, error } = await supabase.from('clinic_services').select('*').order('name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/admin/services', async (req, res) => {
    const { name, base_price, description, color_code } = req.body;
    const { data, error } = await supabase.from('clinic_services').insert([{ name, base_price, description, color_code }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.put('/api/admin/services/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('clinic_services').update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/admin/services/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('clinic_services').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Service deleted' });
});

// A2. Form Templates CRUD
app.get('/api/admin/form-templates', async (req, res) => {
    const { data, error } = await supabase.from('form_templates').select('*, clinic_services(name)');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/api/admin/form-templates', async (req, res) => {
    const { service_id, form_type, title, fields } = req.body;
    const { data, error } = await supabase.from('form_templates').insert([{ service_id, form_type, title, fields }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.put('/api/admin/form-templates/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('form_templates').update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/admin/form-templates/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('form_templates').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Template deleted' });
});

// --- STAFF ROUTES (Execution) ---

// S1. Patient Forms (Filled)
app.post('/api/patient-forms', async (req, res) => {
    const { patient_id, template_id, answers, filled_by_staff_id } = req.body;
    const { data, error } = await supabase.from('patient_forms').insert([{ patient_id, template_id, answers, filled_by_staff_id }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/patient-forms/:patientId', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase.from('patient_forms').select('*, form_templates(title, form_type)').eq('patient_id', patientId);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// S2. Clinical Photo Uploads
app.post('/api/patients/:patientId/photos', upload.single('photo'), async (req, res) => {
    const { patientId } = req.params;
    const { stage, treatment_record_id } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No photo provided' });

    try {
        const fileName = `clinical/${patientId}/${Date.now()}_${file.originalname}`;
        const { error: uploadError } = await supabase.storage
            .from('clinical-images')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('clinical-images').getPublicUrl(fileName);

        const { data, error: dbError } = await supabase.from('clinical_images').insert([{
            patient_id: parseInt(patientId),
            treatment_record_id,
            stage,
            image_url: publicUrl
        }]).select();

        if (dbError) throw dbError;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// S3. Get Clinical Photos
app.get('/api/patients/:patientId/photos', async (req, res) => {
    const { patientId } = req.params;
    const { data, error } = await supabase.from('clinical_images').select('*').eq('patient_id', patientId).order('uploaded_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 404 Handler
app.use((req, res) => {
    console.warn(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Path ${req.url} with method ${req.method} not found on this server.` });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server v1.1.0 is active on port ${port} (Network: 0.0.0.0)`);
});
