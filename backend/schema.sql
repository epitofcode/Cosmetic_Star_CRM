-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clinic Services Table (Treatments)
CREATE TABLE IF NOT EXISTS clinic_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    color_code TEXT DEFAULT '#0d9488',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patients Table (Sequential IDs starting at 101)
-- If table exists, we might need a migration, but for schema.sql we define the desired state.
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    dob DATE,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- To start at 101: ALTER SEQUENCE patients_id_seq RESTART WITH 101;

-- 3. Staff Profiles / RBAC
CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('Admin', 'Staff')) DEFAULT 'Staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Form Templates linked to Services
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES clinic_services(id) ON DELETE CASCADE,
    form_type TEXT CHECK (form_type IN ('consent', 'intake', 'contract')) NOT NULL,
    title TEXT NOT NULL,
    fields JSONB NOT NULL, -- The dynamic fields schema
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Patient Forms (Filled by staff)
CREATE TABLE IF NOT EXISTS patient_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES form_templates(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    filled_by_staff_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Clinical Treatment Records
CREATE TABLE IF NOT EXISTS clinical_treatment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES clinic_services(id),
    blood_taken_ml NUMERIC(10,2),
    prp_injected_ml NUMERIC(10,2),
    lot_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    injected_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL,
    changed_by_user_id UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    previous_data JSONB NOT NULL,
    table_name TEXT DEFAULT 'clinical_treatment_records'
);

-- 8. Clinical Images
CREATE TABLE IF NOT EXISTS clinical_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_record_id UUID REFERENCES clinical_treatment_records(id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    stage TEXT CHECK (stage IN ('Before', 'During', 'After')) NOT NULL,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, time_slot)
);

-- 10. Treatment Plans Table
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES clinic_services(id),
    service_name TEXT NOT NULL,
    base_cost DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_to_pay DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id)
);

-- 11. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL,
    proof_url TEXT,
    proof_name TEXT,
    receipt_number TEXT UNIQUE,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS for now as requested
ALTER TABLE clinic_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_treatment_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Reload Schema Notification
NOTIFY pgrst, 'reload schema';
