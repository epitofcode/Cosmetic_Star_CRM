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

// 1. General API Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Abuse Protection: Too many requests, please try again later.' }
});

// 2. Onboarding/Patient Creation Limiter (Prevents Spam/Bot Scraping)
const onboardingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Only 20 new patients per IP per hour
    message: { error: 'Abuse Protection: Patient registration rate limit exceeded. Please wait.' }
});

// 3. Clinical Upload Limiter (Prevents Storage/Bandwidth Denial)
const uploadLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 50, // 50 uploads per 30 mins
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
    limits: { fileSize: 5 * 1024 * 1024 } // Strict 5MB limit
});

app.use(cors());
app.use(express.json());

// SECURITY LOG: Track all requests for anomaly detection
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

// --- Admin Diagnostic (Audit Trail Added) ---
app.get('/api/diagnostic', requireAuth, requireAdmin, async (req, res) => {
    securityLog(req, 'DIAGNOSTIC_ACCESS', { status: 'STARTED' });
    const results = { database: {}, storage: {}, env: { url: !!supabaseUrl, key: !!supabaseKey } };
    const tables = ['patients', 'medical_intakes', 'contracts', 'bookings', 'treatment_plans', 'transactions'];
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        results.database[table] = error ? `Error: ${error.message}` : 'Healthy';
    }
    res.json(results);
});

// --- Patient Management (Audited) ---
app.get('/api/patients', requireAuth, async (req, res) => {
    securityLog(req, 'DATA_READ', { table: 'patients' });
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
    securityLog(req, 'DATA_CREATE', { table: 'patients', email: req.body.email });
    const { data, error } = await supabase.from('patients').insert([req.body]).select();
    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Duplicate Email Detected', code: 'DUPLICATE_EMAIL' });
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

app.put('/api/patients/:id', requireAuth, async (req, res) => {
    securityLog(req, 'DATA_UPDATE', { table: 'patients', targetId: req.params.id });
    const { id } = req.params;
    const { data, error } = await supabase.from('patients').update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/patients/:id', requireAuth, requireAdmin, async (req, res) => {
    securityLog(req, 'DATA_DELETE', { table: 'patients', targetId: req.params.id });
    const { id } = req.params;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Patient deleted successfully' });
});

// --- Clinical Assessments ---
app.post('/api/assessment', requireAuth, async (req, res) => {
    securityLog(req, 'ASSESSMENT_SAVE', { patientId: req.body.patient_id });
    const { patient_id, data: assessmentData } = req.body;
    const { data, error } = await supabase.from('medical_intakes').upsert([{ patient_id, data: assessmentData }], { onConflict: 'patient_id' }).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// --- Digital Contracts (Upload Rate Limited) ---
app.post('/api/contract', requireAuth, uploadLimiter, upload.single('signature'), async (req, res) => {
    securityLog(req, 'CONTRACT_SIGN', { patientId: req.body.patient_id });
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

// --- Financials (Admin + Audited) ---
app.post('/api/transactions', requireAuth, requireAdmin, uploadLimiter, upload.single('proof'), async (req, res) => {
    securityLog(req, 'FINANCIAL_TXN', { patientId: req.body.patient_id, amount: req.body.amount });
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

// --- Photo Management (Audited & Limited) ---
app.post('/api/patients/:patientId/photos', requireAuth, uploadLimiter, upload.single('photo'), async (req, res) => {
    securityLog(req, 'PHOTO_UPLOAD', { patientId: req.params.patientId, stage: req.body.stage });
    const { patientId } = req.params;
    const { stage, treatment_record_id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No photo provided' });

    const fileName = `clinical/${patientId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await supabase.storage.from('clinical-images').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('clinical-images').getPublicUrl(fileName);
    const { data, error: dbError } = await supabase.from('clinical_images').insert([{ patient_id: parseInt(patientId), treatment_record_id, stage, image_url: publicUrl }]).select();
    if (dbError) return res.status(400).json({ error: dbError.message });
    res.status(201).json(data[0]);
});

// Global Error Handler
app.use(errorLog);

// 404 Handler
app.use((req, res) => { 
    securityLog(req, 'UNAUTHORIZED_TRAFFIC_PATTERN', { status: '404' });
    res.status(404).json({ error: `Security: Access Denied.` }); 
});

app.listen(port, '0.0.0.0', () => { console.log(`SECURE Clinical Server v1.5.0 active on port ${port}`); });
