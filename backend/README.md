# Cosmetic Star API Layer ⚙️
**The Engine Room: Node.js Express Backend**

This is the central API for the Cosmetic Star CRM, responsible for orchestrating data between the frontend, Supabase, and Resend.

## 📡 Core Responsibilities
- **Data Orchestration:** CRUD operations for Patients, Medical Intakes, and Bookings.
- **Workflow Integrity:** Enforces the "Signed Contract" requirement for surgery slots.
- **Document Generation:** Server-side PDF generation for payment receipts using `jsPDF`.
- **File Management:** Handles multi-part uploads for signatures and payment proofs to Supabase Storage.
- **Diagnostics:** Provides a `/api/health` and `/api/diagnostic` endpoint for Railway monitoring.

## 🛡 Security Architecture (Senior Hardened)
- **Advanced Middleware:** Implements `requireAuth` (JWT validation) and `requireAdmin` (RBAC) on all routes.
- **Threat Mitigation:** `express-rate-limit` for DDoS prevention and `helmet` for secure HTTP headers (HSTS, CSP).
- **Security Auditing:** Centralized `securityLog` for tracking clinical access, auth events, and potential IDOR attempts.
- **Abuse Protection:** Specialized limiters for high-risk operations: onboarding and file uploads.
- **Error Shielding:** `errorLog` ensures no stack traces or sensitive data leakage during system failures.

## 🛠 Tech Specs
- **Runtime:** Node.js 22 (ES Modules)
- **Framework:** Express.js + Helmet + RateLimit
- **Database Client:** `@supabase/supabase-js` (Strict JWT context)
- **Mail Engine:** `Resend` (PDF Attachment support)

## 🔑 Environment Variables (Required)
```env
PORT=3001
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[service-role-or-anon-key]
RESEND_API_KEY=re_[key]
ADMIN_OVERRIDE_PASSWORD=[secure-admin-pass]
```

## 🚀 Deployment
Deployed on **Railway** via `railway.json`.
- **Nixpacks** Build System.
- Automated healthchecks on `/api/health`.
