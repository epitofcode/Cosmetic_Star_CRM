# Cosmetic Star CRM 🌟
**Premium Clinical Staging & Booking Suite**

A professional, high-performance CRM built for **Cosmetic Star UK**. This system manages the end-to-end patient lifecycle: from initial onboarding and medical assessment to digital contract execution and chronological surgery booking.

## 🏗 System Architecture
The system utilizes a modern, distributed **Service-Oriented Architecture (SOA)** to ensure maximum reliability and speed:

*   **Frontend:** React 19 (TypeScript) + Vite + Tailwind CSS v4. Hosted on **Vercel** for global Edge delivery.
*   **API Layer:** Node.js 22 + Express.js. Hosted on **Railway** for high-availability business logic.
*   **Database:** PostgreSQL (via **Supabase**) for structured clinical records and relational data integrity.
*   **Storage:** Object Storage (via **Supabase Storage**) for encrypted digital signatures and payment proofs.
*   **Communications:** **Resend** for automated transactional emails and PDF delivery.

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
