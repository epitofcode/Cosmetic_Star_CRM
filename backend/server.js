// SECURED Clinical Server v1.6.0
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from './authMiddleware.js';
import { securityLog, errorLog } from './logger.js';

dotenv.config();
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

// --- ALLOWED TABLES (Security Allowlist) ---
const ALLOWED_TABLES = [
    'patients', 
    'medical_intakes', 
    'contracts', 
    'bookings', 
    'treatment_plans', 
    'transactions', 
    'clinic_services', 
    'form_templates', 
    'patient_forms',
    'clinical_images'
];

const validateTable = (tableName) => {
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error(`Security Exception: Access to table '${tableName}' is restricted.`);
    }
};

// --- SECURE HEADERS: Helmet ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "connect-src": ["'self'", "https://*.supabase.co"],
            "img-src": ["'self'", "data:", "https://*.supabase.co"],
            "script-src": ["'self'", "'unsafe-inline'"],
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// --- SECURITY: Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 300, 
    message: { error: 'Abuse Protection: Too many requests.' }
});

const onboardingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20, 
    message: { error: 'Abuse Protection: Patient registration rate limit exceeded.' }
});

const uploadLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 100,
    message: { error: 'Abuse Protection: Upload frequency limit exceeded.' }
});

app.use('/api/', apiLimiter);

// --- SUPABASE & RESEND ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for clinical photos
});

app.use(cors());
app.use(express.json());

// SECURITY LOG: Anomaly Detection
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        securityLog(req, 'TRAFFIC_ANALYTICS');
    }
    next();
});

// --- Public Endpoints ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Administrative Access Verification ---
app.post('/api/admin/verify-access', requireAuth, requireAdmin, (req, res) => {
    const { password } = req.body;
    const systemPassword = process.env.ADMIN_OVERRIDE_PASSWORD || 'access';
    if (password === systemPassword) {
        securityLog(req, 'ADMIN_ACCESS_UNLOCKED');
        res.json({ success: true });
    } else {
        securityLog(req, 'ADMIN_ACCESS_FAILED');
        res.status(401).json({ error: 'Invalid administrative override password.' });
    }
});

// --- Patient Management (Audited) ---
app.get('/api/patients', requireAuth, async (req, res) => {
    const { search } = req.query;
    let query = supabase.from('patients').select('*');
    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

app.post('/api/patients', requireAuth, onboardingLimiter, async (req, res) => {
    const { data, error } = await supabase.from('patients').insert([req.body]).select();
    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Duplicate Email Detected' });
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

app.put('/api/patients/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('patients').update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/patients/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Patient deleted successfully' });
});

// --- Clinical Assessments & Forms ---
app.post('/api/assessment', requireAuth, async (req, res) => {
    const { patient_id, data: assessmentData } = req.body;
    const { data, error } = await supabase.from('medical_intakes').upsert([{ patient_id, data: assessmentData }], { onConflict: 'patient_id' }).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/assessment/:patientId', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('medical_intakes').select('*').eq('patient_id', req.params.patientId).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || null);
});

app.get('/api/form-templates/:serviceId', requireAuth, async (req, res) => {
    const { data } = await supabase.from('form_templates').select('*').eq('service_id', req.params.serviceId);
    res.json(data || []);
});

app.post('/api/patient-forms', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('patient_forms').insert([req.body]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/patient-forms/:patientId', requireAuth, async (req, res) => {
    const { data } = await supabase.from('patient_forms').select('*, form_templates(title, form_type)').eq('patient_id', req.params.patientId);
    res.json(data || []);
});

// --- Digital Contracts ---
app.post('/api/contract', requireAuth, uploadLimiter, upload.single('signature'), async (req, res) => {
    const { patient_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Signature required' });

    const fileName = `signatures/${patient_id}_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage.from('signatures').upload(fileName, file.buffer, { contentType: 'image/png' });
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(fileName);
    const { data: contractData, error: contractError } = await supabase.from('contracts').upsert([{ patient_id, signature_url: publicUrl }], { onConflict: 'patient_id' }).select();
    if (contractError) return res.status(400).json({ error: contractError.message });
    res.status(201).json(contractData[0]);
});

app.get('/api/contract/:patientId', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('contracts').select('*').eq('patient_id', req.params.patientId).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ signed: !!data, contract: data || null });
});

// --- Treatment Plans & Bookings ---
app.post('/api/treatment-plan', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('treatment_plans').upsert([req.body], { onConflict: 'patient_id' }).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/treatment-plan/:patientId', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('treatment_plans').select('*').eq('patient_id', req.params.patientId).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || null);
});

app.get('/api/slots', requireAuth, async (req, res) => {
    const { date } = req.query;
    const { data, error } = await supabase.from('bookings').select('time_slot').eq('date', date);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data.map(b => b.time_slot));
});

app.post('/api/bookings', requireAuth, async (req, res) => {
    const { data, error } = await supabase.from('bookings').insert([req.body]).select();
    if (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Slot no longer available.' });
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

app.get('/api/bookings/:patientId', requireAuth, async (req, res) => {
    const { data } = await supabase.from('bookings').select('*').eq('patient_id', req.params.patientId);
    res.json(data || []);
});

app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
    const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Booking cancelled' });
});

// --- Financials (Admin Only) ---
app.get('/api/financials/:patientId', requireAuth, requireAdmin, async (req, res) => {
    const { patientId } = req.params;
    const { data: plan } = await supabase.from('treatment_plans').select('*').eq('patient_id', patientId).maybeSingle();
    if (!plan) return res.status(404).json({ error: 'No plan found' });
    const { data: transactions } = await supabase.from('transactions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    const amountPaid = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    res.json({ id: plan.id, patient_id: plan.patient_id, service_name: plan.service_name, total_amount: Number(plan.total_to_pay), amount_paid: amountPaid, status: amountPaid >= Number(plan.total_to_pay) ? 'Payment Done' : 'Payment Pending', transactions: transactions || [] });
});

app.post('/api/transactions', requireAuth, requireAdmin, uploadLimiter, upload.single('proof'), async (req, res) => {
    const { patient_id, amount, type = 'Installment' } = req.body;
    const file = req.file;
    let publicUrl = null;
    let fileNameOriginal = type === 'Cash' ? 'Cash Payment' : 'No File Provided';
    if (file) {
        const fileName = `proofs/${patient_id}_${Date.now()}_${file.originalname}`;
        const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, file.buffer, { contentType: file.mimetype });
        if (uploadError) return res.status(400).json({ error: uploadError.message });
        const { data: { publicUrl: url } } = supabase.storage.from('proofs').getPublicUrl(fileName);
        publicUrl = url;
        fileNameOriginal = file.originalname;
    }
    const { data, error } = await supabase.from('transactions').insert([{ patient_id, amount: Number(amount), type, proof_url: publicUrl, proof_name: fileNameOriginal, receipt_number: `CS-RC-${Math.floor(100000 + Math.random() * 900000)}` }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// --- Photo Management ---
app.post('/api/patients/:patientId/photos', requireAuth, uploadLimiter, upload.single('photo'), async (req, res) => {
    const { patientId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No photo' });
    const fileName = `clinical/${patientId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await supabase.storage.from('clinical-images').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) return res.status(400).json({ error: uploadError.message });
    const { data: { publicUrl } } = supabase.storage.from('clinical-images').getPublicUrl(fileName);
    const { data, error } = await supabase.from('clinical_images').insert([{ patient_id: parseInt(patientId), stage: req.body.stage, image_url: publicUrl, treatment_record_id: req.body.treatment_record_id }]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/patients/:patientId/photos', requireAuth, async (req, res) => {
    const { data } = await supabase.from('clinical_images').select('*').eq('patient_id', req.params.patientId).order('uploaded_at', { ascending: false });
    res.json(data || []);
});

// --- Dashboard (Admin Only) ---
app.get('/api/dashboard/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
        const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
        const { data: monthlyTransactions } = await supabase.from('transactions').select('amount, date').gte('date', firstDayOfMonth);
        const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

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

        patients?.forEach(p => {
            const fullName = `${p.first_name} ${p.last_name}`;
            const hasIntake = intakes?.some(i => i.patient_id === p.id);
            const patientPlan = plans?.find(pl => pl.patient_id === p.id);
            const hasContract = contracts?.some(c => c.patient_id === p.id);
            const patientBookings = bookings?.filter(b => b.patient_id === p.id) || [];
            const patientTxns = allTransactions?.filter(t => t.patient_id === p.id) || [];

            if (patientPlan?.status === 'Completed') distribution['Completed']++;
            else if (hasContract) distribution['Contracts Signed']++;
            else if (patientPlan) distribution['Treatment Plans']++;
            else distribution['New Patients']++;

            if (!hasIntake) pendingBreakdown.missingIntake.push({ id: p.id, name: fullName });
            if (patientPlan && !hasContract) pendingBreakdown.complianceGap.push({ id: p.id, name: fullName, service: patientPlan.service_name });
            if (patientPlan?.status === 'Completed') {
                const totalPaid = patientTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
                const balance = Number(patientPlan.total_to_pay || 0) - totalPaid;
                if (balance > 0) pendingBreakdown.unpaidBalances.push({ id: p.id, name: fullName, balance });
            }
            patientBookings.forEach(b => {
                const bDate = new Date(b.date);
                if (bDate >= sevenDaysAgo && bDate < today) pendingBreakdown.postOpFollowups.push({ id: p.id, name: fullName, date: b.date, service: b.service_type });
            });
            if (hasContract && patientBookings.length === 0) pendingBreakdown.bookingBottleneck.push({ id: p.id, name: fullName });
        });

        const revenueAnalytics = [...Array(7)].map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            return {
                date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                amount: monthlyTransactions?.filter(t => t.date === dateStr).reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
            };
        });

        res.json({ totalPatients: patientCount || 0, surgeryBookings: bookingCount || 0, totalRevenue: monthlyRevenue, pendingReports: Object.values(pendingBreakdown).flat().length, pendingBreakdown, revenueAnalytics, clinicalDistribution: Object.entries(distribution).map(([name, value]) => ({ name, value })) });
    } catch (error) { res.status(500).json({ error: "Analytics Error" }); }
});

app.get('/api/dashboard/recent-appointments', requireAuth, async (req, res) => {
    const { data } = await supabase.from('bookings').select('id, service_type, date, time_slot, status, patients(first_name, last_name)').order('date', { ascending: false }).limit(5);
    res.json(data?.map(b => ({ name: `${b.patients.first_name} ${b.patients.last_name}`, service: b.service_type, time: `${b.date} ${b.time_slot}`, status: b.status })) || []);
});

// --- Admin System Explorer ---
app.get('/api/admin/tables/:tableName', requireAuth, requireAdmin, async (req, res) => {
    try {
        validateTable(req.params.tableName);
        const { data, error } = await supabase.from(req.params.tableName).select('*').order('created_at', { ascending: false }).catch(() => supabase.from(req.params.tableName).select('*'));
        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) { res.status(403).json({ error: err.message }); }
});

app.put('/api/admin/tables/:tableName/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        validateTable(req.params.tableName);
        const { data, error } = await supabase.from(req.params.tableName).update(req.body).eq('id', req.params.id).select();
        if (error) return res.status(400).json({ error: error.message });
        res.json(data[0]);
    } catch (err) { res.status(403).json({ error: err.message }); }
});

app.delete('/api/admin/tables/:tableName/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        validateTable(req.params.tableName);
        const { error } = await supabase.from(req.params.tableName).delete().eq('id', req.params.id);
        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(403).json({ error: err.message }); }
});

app.get('/api/admin/services', requireAuth, requireAdmin, async (req, res) => {
    const { data } = await supabase.from('clinic_services').select('*').order('name');
    res.json(data || []);
});

app.post('/api/admin/services', requireAuth, requireAdmin, async (req, res) => {
    const { data, error } = await supabase.from('clinic_services').insert([req.body]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.get('/api/admin/form-templates', requireAuth, requireAdmin, async (req, res) => {
    const { data } = await supabase.from('form_templates').select('*, clinic_services(name)');
    res.json(data || []);
});

// Global Error Handler
app.use(errorLog);

// 404 Handler
app.use((req, res) => { 
    securityLog(req, '404_NOT_FOUND');
    res.status(404).json({ error: `Security: Access Denied.` }); 
});

app.listen(port, '0.0.0.0', () => { console.log(`SECURE Clinical Server v1.6.0 active on port ${port}`); });
