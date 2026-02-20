# Project: Cosmetic Star CRM
**Description:** A custom staging and booking software built for a UK-based medical clinic (Cosmetic Star). The system handles patient onboarding, dynamic medical history assessments, digital contract signing via tablet handover, and chronological appointment booking.

## 1. Tech Stack & Infrastructure
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7.
* **Backend:** Node.js, Express.js.
* **Database:** Supabase (PostgreSQL) for relational data and JSONB storage.
* **Hosting Target:** 
    * Frontend: Vercel.
    * Backend: Render (Node.js Web Service) or Hostinger Business Web Hosting.
* **Key Libraries:** `lucide-react` (icons), `react-signature-canvas` (digital contracts), `clsx` & `tailwind-merge` (styling).

## 2. Coding Conventions & Style Guide
* **TypeScript:** Use strict typing. Prefer `interface` over `type` for object shapes. Avoid `any`.
* **Components:** Use functional components with hooks. Keep components modular and single-responsibility.
* **Styling:** Use Tailwind CSS utility classes. Use the custom `cn()` utility (combining `clsx` and `twMerge`) for conditional class merging.
* **State Management:** Use standard React hooks (`useState`, `useEffect`, `useContext`).
* **API Calls:** Abstract all backend communication into a `src/services/api.ts` file using `axios` or native `fetch`. Do not hardcode API URLs in components; use `import.meta.env.VITE_API_URL`.
* **Error Handling:** Fail gracefully. Show user-friendly toast notifications for network errors or validation failures.

## 3. Database Schema (Supabase / PostgreSQL)
The backend must adhere to the following relational structure:
* `patients`: `id` (UUID), `first_name`, `last_name`, `phone`, `email`, `dob`, `created_at`.
* `medical_intakes`: `id`, `patient_id` (FK), `data` (JSONB - stores dynamic Yes/No/Details medical questions), `created_at`.
* `contracts`: `id`, `patient_id` (FK), `signature_url` (Text - points to Supabase Storage bucket), `signed_at` (Timestamp).
* `bookings`: `id`, `patient_id` (FK), `service_type`, `date` (Date), `time_slot` (Text), `status` (Text).
* `transactions`: `id`, `booking_id` (FK), `amount` (Decimal), `type` (Text), `created_at`.

## 4. Core Business Logic & Workflows
* **Chronological Booking Rule:** A patient **cannot** book a time slot in the calendar until their `contracts` record exists (isSigned = true).
* **The "Handover" Flow:** The UI is designed for staff to fill out the form, hand the tablet to the patient for signature on the `DigitalContract` page, and then hand it back to staff to finalize the booking.
* **Data Security:** Medical intakes contain sensitive UK health data. Ensure JSON data is handled securely.
* **Timezones:** All times must be stored in UTC in the database, but displayed in UK time (Europe/London) on the frontend.

## 5. Agent Instructions (For Gemini CLI)
* **No Mocks:** Do not generate mock data components unless explicitly asked. Assume we are connecting to the real Supabase backend.
* **Context Awareness:** Before modifying a file, check `src/layouts/DashboardLayout.tsx` and `src/App.tsx` to understand the routing and global state.
* **Command Execution:** If asked to install packages, use `npm install`. Do not use `yarn` or `pnpm`.
