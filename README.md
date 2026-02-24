# Cosmetic Star CRM

A professional, cloud-native clinical management and patient onboarding platform designed for **Cosmetic Star UK**. This system digitizes the entire patient lifecycle—from initial registration and medical assessments to digital contract signing and surgery scheduling.

## 🚀 Live Demo
*   **Frontend:** [https://cosmetic-star-crm.vercel.app](https://cosmetic-star-crm.vercel.app)
*   **Backend API:** [https://cosmetic-star-crm.onrender.com](https://cosmetic-star-crm.onrender.com)
*   **Health Status:** [https://cosmetic-star-crm.onrender.com/api/health](https://cosmetic-star-crm.onrender.com/api/health) (Check for version 1.0.2+)

---

## ✨ Key Features

### 1. Executive Analytics Dashboard
*   **Real-Time Metrics:** Live tracking of Total Patients, Surgery Bookings, and Monthly Revenue.
*   **Financial Stream:** Interactive Area Charts showing 7-day revenue trends.
*   **Patient Funnel:** Visual breakdown of clinical statuses (New -> Plan -> Signed -> Completed).
*   **Clinic Pulse:** Comparative activity chart for registrations vs. bookings.

### 2. Patient & Clinical Management
*   **Comprehensive Registry:** Searchable database with clinical status indicators.
*   **Dynamic Health Assessments:** 5-section medical form with conditional logic for high-fidelity data capture.
*   **Treatment Planning:** Custom package builder with automatic discount and total-to-pay calculations.

### 3. Handover Workflow & Security
*   **Digital Contracts:** Integrated signature pad for on-site tablet handover.
*   **Cloud Storage:** Signatures and payment proofs are securely stored in encrypted cloud buckets.
*   **Chronological Booking:** Advanced logic that prevents surgery booking until a verified contract is signed.

### 4. Financials & Receipts
*   **Flexible Payments:** Support for one-time payments, monthly installments, and cash transactions.
*   **Receipt Generation:** Automated, professional PDF receipts generated instantly on the client-side.
*   **Payment Verification:** Admin workflow for uploading and reviewing proofs of payment.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS v4
*   **Charts:** Recharts
*   **Icons:** Lucide React
*   **Animations:** Framer Motion

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** Supabase (PostgreSQL)
*   **Storage:** Supabase Storage (S3-compatible)

### Infrastructure
*   **Hosting:** Vercel (Frontend), Render (Backend)
*   **Emails:** EmailJS Integration
*   **PDF Logic:** jsPDF + html2canvas

---

## 📂 Project Structure

```text
├── backend/                # Node.js Express server
│   ├── server.js           # API endpoints & logic
│   ├── schema.sql          # Database structure
│   └── package.json
├── cosmetic-star-crm/      # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Receipts, Layouts)
│   │   ├── pages/          # Dashboard, Patients, Contract, etc.
│   │   ├── services/       # API abstraction (axios)
│   │   └── context/        # Patient state management
│   └── package.json
└── vercel.json             # Root deployment config
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Supabase Project URL & Service Role Key

### 1. Database Setup
Run the SQL commands found in `backend/schema.sql` inside your Supabase SQL Editor to initialize the tables and disable RLS for the prototype.

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=3001
# SUPABASE_URL=your_url
# SUPABASE_KEY=your_service_role_key
npm start
```

### 3. Frontend Setup
```bash
cd cosmetic-star-crm
npm install
# Create a .env.local file with:
# VITE_API_URL=http://localhost:3001/api
npm run dev
```

---

## 📝 Proposal & Handover
This project is currently in its **Phase 1 Prototype** stage.
*   **Scalability:** Ready for transition to Supabase Pro for automated backups and higher storage limits.
*   **Responsiveness:** Fully optimized for Desktop, Tablet, and Mobile views.
*   **Production Readiness:** Requires replacement of Mock EmailJS IDs with production credentials.

---

**Developed by epitofcode for Cosmetic Star UK.**
