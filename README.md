# Cosmetic Star CRM 🌟
**Premium Clinical Staging & Booking Suite**

A professional, high-performance CRM built for **Cosmetic Star UK**. This system manages the end-to-end patient lifecycle: from initial onboarding and medical assessment to digital contract execution and chronological surgery booking.

## 🏗 System Architecture
The system utilizes a modern, distributed **Service-Oriented Architecture (SOA)** to ensure maximum reliability and speed:

*   **Frontend:** React 19 (TypeScript) + Vite + Tailwind CSS v4. Hosted on **Vercel**.
*   **API Layer:** Node.js 22 + Express.js + **Helmet Security Shield**. Hosted on **Railway**.
*   **Database:** PostgreSQL (via **Supabase**) with **JWT-validated access**.
*   **Storage:** Object Storage (via **Supabase Storage**) for encrypted clinical media.
*   **Communications:** **Resend** for automated transactional emails and PDF delivery.

## 🛡 Security & Compliance (Senior Grade)
The CRM is engineered with a "Security-First" philosophy, specifically for sensitive UK medical data:

- **JWT Authentication:** Every API request is validated against a Supabase-issued Access Token.
- **Role-Based Access Control (RBAC):** Distinct permissions for `Staff` and `Admin` users.
- **Inactivity Protection:** 15-minute sliding window inactivity timeout + `sessionStorage` persistence.
- **Abuse Mitigation:** Intelligent rate-limiting on onboarding, file uploads, and auth attempts.
- **Infrastructure Hardening:** Enforced HSTS, Content Security Policy (CSP), and XSS protection.
- **Audit Logging:** Comprehensive security logs for all clinical and financial data modifications.

## 🔄 Core Patient Workflow
1.  **Registry:** Staff register a new patient or select an existing one from the "Active Patient" global context.
2.  **Assessment:** Comprehensive medical consultation using dynamic JSONB-backed forms.
3.  **Treatment:** Service selection and financial breakdown (Pricing -> Discounts -> Totals).
4.  **Contract:** Tablet-handover digital signature capture. **(Business Rule: Must be signed to unlock booking)**.
5.  **Calendar:** Chronological surgery booking with automated double-booking prevention.
6.  **Financials:** Installment tracking, proof-of-payment uploads, and automated PDF receipt generation.

## 🛠 Tech Stack
- **Frontend:** React Router v7, Lucide Icons, Recharts (Analytics), Framer Motion.
- **Backend:** Multer (Uploads), jsPDF (Document Generation), Axios.
- **Security:** Managed Row-Level Security (RLS), Environment-level credential protection.

## 🚀 Deployment & Maintenance
- **Backend Engine:** Railway (`zippy-balance`)
- **Frontend Engine:** Vercel (`cosmetic-star-crm`)
- **Domain:** `starteck.co.uk`

---
© 2026 Cosmetic Star UK Ltd. Built & Maintained by Starteck.
