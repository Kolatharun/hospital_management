# Balaji Heart Center - Patient OPD Progressive Web Application (PWA)

A complete, production-ready frontend for the Balaji Heart Center patient PWA built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Hook Form, Zod, and `vite-plugin-pwa`.

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have **Node.js (v18 or higher)** and **npm** installed on your machine.

- Verify Node version: `node -v`
- Verify npm version: `npm -v`

---

## 🛠️ Installation & Setup

1. **Navigate to the project directory:**
   ```bash
   cd hospital_management/opd_pwa
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Click the URL displayed in your terminal (typically `http://localhost:5173`).

---

## 🔑 Prototype Demo Credentials

This frontend runs in **mock mode** out of the box so you can test all features immediately without setting up a backend database.

- **Mobile Number:** Any valid 10-digit Indian phone number starting with 6–9 (e.g., `98765 43210`)
- **Test OTP Code:** `123456`
- **Default Patient Account:** `Rajesh K. Sharma` (MR Number: `MR-2026-8842`)

---

## 📱 Mobile PWA Installation

To test PWA installation on your desktop browser or mobile device:

1. Run `npm run build` followed by `npm run preview` to serve the production build with Service Worker enabled.
2. Open `http://localhost:4173`.
3. Click **"Install App"** in the browser address bar or use the prompt inside the Profile screen.

---

## 🏗️ Build & Testing Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite HMR dev server |
| `npm run build` | Runs TypeScript checks & builds production assets to `dist/` |
| `npm run preview` | Serves the production build locally to test Service Worker & PWA |
| `npm run lint` | Runs `oxlint` linter checks |

---

## 📂 Project Structure Overview

```
src/
├── app/          # App setup, router, React Query & provider setup
├── components/   # Reusable UI components & layouts (Buttons, Cards, Modals, Sheets)
├── features/     # Feature-specific modular views
├── hooks/        # Custom React hooks (useAuth, useSocket, useOnlineStatus)
├── mocks/        # Realistic medical data (Doctors, Appointments, Prescriptions, Labs)
├── pages/        # All 25+ application screens
├── schemas/      # Zod validation schemas
├── services/     # Typed service layer (Ready for FastAPI integration)
├── store/        # Zustand stores (Auth session, UI state, Booking draft)
├── styles/       # Design system tokens, utilities & animations
└── types/        # TypeScript interfaces & state machines
```
