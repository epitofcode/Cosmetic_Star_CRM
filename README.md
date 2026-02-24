# Cosmetic Star CRM (v1.0.6-STABLE)

A professional, cloud-native clinical management and patient onboarding platform designed for **Cosmetic Star UK**. This system digitizes the entire patient lifecycle—from initial registration and medical assessments to digital contract signing and surgery scheduling.

## 🚀 Live Demo & Status
*   **Frontend (Production):** [https://cosmetic-star-crm.vercel.app](https://cosmetic-star-crm.vercel.app)
*   **Backend API (Render):** [https://cosmetic-star-crm.onrender.com](https://cosmetic-star-crm.onrender.com)
*   **Health Check:** [Verify Version 1.0.6-STABLE](https://cosmetic-star-crm.onrender.com/api/health)

---

## ✨ Core Clinical Workflows

### 1. Advanced Executive Dashboard
*   **Real-Time Analytics:** Accurate, database-driven metrics for Total Patients, Surgery Bookings, and Monthly Revenue.
*   **Clinical Activity Charts:** 7-day Area Charts for revenue trends and Step-Charts for clinic registration vs. booking volume.
*   **Patient Lifecycle Funnel:** Visual breakdown of statuses (New -> Plan -> Signed -> Completed).
*   **Live Auto-Sync:** Automated 30-second polling with pulsing connectivity indicator.

### 2. Digital Tablet Handover Logic
*   **Staff-Driven Assessments:** 5-section medical consult form with dynamic conditional visibility for clinical details.
*   **Electronic Signature:** Integrated signature pad for on-site contract signing. Signatures are encrypted and saved to cloud storage.
*   **Security Rule:** Chronological booking enforcement—surgical slots are locked until a verified contract is present.

### 3. Persistent Surgical Scheduling
*   **Choice Memory:** The Calendar intelligently remembers and auto-loads a patient's previous slot choice.
*   **Double-Booking Prevention:** Occupied slots are automatically struck through and disabled in real-time.
*   **Cloud Persistence:** All bookings are saved to Supabase with automatic dashboard updates.

### 4. Financial & Revenue Management
*   **Multi-Mode Payments:** Full support for **Installments (with Proof of Payment)** and **Cash Payments (Instant)**.
*   **Receipt Engine:** Automatic generation of professional, branded PDF receipts with balance tracking.
*   **Verification Workflow:** High-fidelity document upload for bank transfer and card payment proofs.

---

## 🛠️ Industrial Tech Stack

### Client Layer
*   **Core:** React 19 (TypeScript), Vite
*   **Visuals:** Recharts (High-end Data Viz), Lucide React (Clinical Icons), Framer Motion
*   **Styling:** Tailwind CSS v4 (Mobile-First Responsive Design)

### Engine & Storage
*   **API:** Node.js, Express.js (v4.x Stable)
*   **Persistence:** Supabase (PostgreSQL) with JSONB for dynamic medical data.
*   **Object Storage:** Supabase Storage for encrypted signatures and payment docs.

---

## 📂 Project Architecture

```text
├── backend/                # Node.js Express server (Production Engine)
│   ├── server.js           # REST API endpoints & Clinical Logic
│   ├── schema.sql          # DB Structure & RLS Security Rules
│   └── package.json
├── cosmetic-star-crm/      # React 19 Frontend (Vercel Optimized)
│   ├── src/
│   │   ├── components/     # PDF Receipt Generator, Layouts
│   │   ├── pages/          # Dashboard, Patients, Calendar, etc.
│   │   ├── services/       # API Layer (Axios)
│   │   └── context/        # Patient State Management
│   └── vercel.json         # Workspace Deployment Config
└── README.md
```

---

## 📝 Maintenance & Production Handover

### ⚠️ Critical Deployment Note
The system is optimized for cross-platform builds. The `optionalDependencies` in `package.json` include Linux-specific binaries (@rollup, @esbuild, @tailwindcss/oxide) to ensure zero-downtime deployments on Vercel and Render.

### Database Readiness
The database is pre-configured with the following rule-sets:
*   `patients_email_key`: Prevents duplicate registrations.
*   `bookings_patient_id_key`: Enables slot persistence and choice memory.
*   `transactions_patient_id_fkey`: Decouples payments from bookings for flexible clinic revenue tracking.

---

**Developed with precision for Cosmetic Star UK.**
