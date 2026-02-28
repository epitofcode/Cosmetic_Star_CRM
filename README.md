# Cosmetic Star CRM: Bentley Automation Suite

A high-performance, clinical-grade CRM built for **Cosmetic Star UK**. This platform disruptions traditional clinic management by combining advanced React 19 architecture with automated medical workflows.

## 🚀 Automated Clinical Infrastructure
The system is built on a "Decoupled Triple-Stack" for maximum reliability:
*   **Frontend:** React 19 (Vite + Tailwind CSS v4) hosted on **Vercel**.
*   **Backend:** Node.js Express API hosted on **Railway**.
*   **Database:** Supabase (PostgreSQL) with JSONB medical intake storage.
*   **Communications:** Automated via **Resend** (Medical-grade mail server).

## 💎 Key Automated Features
### 1. The "Handover" Workflow
*   **Digital Onboarding:** Smooth patient registration with real-time validation.
*   **Health Assessments:** Multi-section dynamic medical forms stored securely.
*   **Digital Contract:** Tablet-native signature capture with encrypted storage.

### 2. Smart Booking & Communications
*   **Dynamic Calendar:** Surgery slots are automatically locked until a contract is signed.
*   **Automated Confirmations:** Instant, branded emails sent via Resend upon booking.
*   **Dynamic Service Injection:** Emails automatically reflect the patient's specific treatment plan.

### 3. Financial Suite
*   **Transaction Tracking:** Support for Bank Transfer, Card, and Cash payments.
*   **Automated Receipts:** The server generates a **Branded PDF Receipt** instantly upon payment.
*   **Paperless Delivery:** Receipts are automatically attached and emailed to the patient.

## 🛠️ Technical Setup (Environmental Controls)
To maintain "Bentley-Standard" security, the following Environment Variables must be configured in the Production (Railway/Render) dashboards:

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase | Database Connection |
| `SUPABASE_KEY` | Supabase | Service Role Access |
| `RESEND_API_KEY` | Resend | Automated Email Delivery |
| `PORT` | System | Backend Port (Default 3001) |

## 🛡️ Administrative Security
*   **Database Explorer:** A secure, password-protected portal (`Settings`) for raw data management.
*   **Sovereignty:** All data is handled with UK-centric security protocols (AES-256 encryption at rest).

---
**Maintained by:** Sritej Reddy / Principal Engineer
**Last Updated:** February 2026
