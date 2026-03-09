# Cosmetic Star API Layer ⚙️
**The Engine Room: Node.js Express Backend**

This is the central API for the Cosmetic Star CRM, responsible for orchestrating data between the frontend, Supabase, and Resend.

## 📡 Core Responsibilities
- **Data Orchestration:** CRUD operations for Patients, Medical Intakes, and Bookings.
- **Workflow Integrity:** Enforces the "Signed Contract" requirement for surgery slots.
- **Document Generation:** Server-side PDF generation for payment receipts using `jsPDF`.
- **File Management:** Handles multi-part uploads for signatures and payment proofs to Supabase Storage.
- **Diagnostics:** Provides a `/api/health` and `/api/diagnostic` endpoint for Railway monitoring.

## 🛠 Tech Specs
- **Runtime:** Node.js 22 (ES Modules)
- **Framework:** Express.js
- **Database Client:** `@supabase/supabase-js`
- **Mail Engine:** `Resend`
- **Networking:** Binds to `0.0.0.0` for Railway Proxy compatibility.

## 🔑 Environment Variables (Required)
```env
PORT=3001
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[service-role-or-anon-key]
RESEND_API_KEY=re_[key]
```

## 🚀 Deployment
Deployed on **Railway** via `railway.json`.
- **Nixpacks** Build System.
- Automated healthchecks on `/api/health`.
