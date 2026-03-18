# Cosmetic Star Dashboard 💎
**The Command Center: React 19 Frontend**

A premium, interactive clinical management interface designed for high-end aesthetic clinics.

## ✨ Key Features
- **Global Patient Context:** Persistent "Active Patient" session across all clinical modules.
- **Inactivity Protection:** Automatic 15-minute sliding window inactivity logout for HIPAA/GDPR alignment.
- **Restricted Database Explorer:** Administrative access with secure backend verification.
- **Dynamic Analytics:** Real-time financial trends and lifecycle distribution using `Recharts`.
- **Digital Contracts:** High-fidelity signature capture via `react-signature-canvas`.
- **Mobile Responsive:** Fully optimized for clinic tablet handover and management.

## 🏗 Frontend Tech Stack
- **Library:** React 19 (Strict Mode) + Vite
- **Security:** `sessionStorage` persistence + JWT injection (Axios Interceptors).
- **Styling:** Tailwind CSS v4 (Modern Utility Engine)
- **State:** React Context API (Auth + Patient State)

## 🚀 Build & Deploy
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Configuration
Expects the following to be set in your Vercel/Local environment:
```env
VITE_API_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
