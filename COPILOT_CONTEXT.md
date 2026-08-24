# 🤖 Copilot Context — Amana Project
# Session: amana_5.21.2026

> Paste this file's content at the start of any new Copilot conversation to resume work instantly.

---

## 📦 What is Amana?

**Amana** (أمانة — *trust*) is a peer-to-peer parcel delivery app, like BlaBlaCar but for packages.
- Travelers post trips and offer to carry parcels
- Senders search trips and request delivery
- App takes a **10% platform fee** from each transaction (deducted from traveler payout)

---

## 🗂️ Project Structure

```
D:\Users\acharif\amana\
├── backend\        Node.js + Express + Prisma + PostgreSQL (Neon)
├── mobile\         React Native + Expo
├── web\            Next.js website
└── COPILOT_CONTEXT.md   ← this file
```

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo |
| Web | Next.js |
| Backend | Node.js + Express |
| Database | PostgreSQL via Neon (cloud) + Prisma ORM |
| Auth | Phone OTP (Twilio Verify) + JWT |
| Payments | Stripe Connect (escrow, 10% fee) |
| Storage | Cloudinary |
| Real-time | Socket.IO |
| Push | Firebase Cloud Messaging (optional, not yet active) |

---

## ▶️ How to Start Working (run all 3 terminals)

### Terminal 1 — Backend
```powershell
cd D:\Users\acharif\amana\backend
npm run dev
# → http://localhost:3000
```

### Terminal 2 — Stripe Webhook (keep running during dev)
```powershell
cd D:\Users\acharif\amana\stripe_1.40.9_windows_x86_64
.\stripe.exe listen --forward-to localhost:3000/api/payments/webhook
```

### Terminal 3 — Web App
```powershell
cd D:\Users\acharif\amana\web
npm run dev
# → http://localhost:3001
```

### Terminal 4 — Mobile App (optional)
```powershell
cd D:\Users\acharif\amana\mobile
npx expo start
# Scan QR with Expo Go on phone (same WiFi as PC)
# Set EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/api in mobile\.env
```

---

## 🔑 Services & Credentials (all in backend\.env)

| Service | Status | Notes |
|---|---|---|
| Neon (DB) | ✅ Connected | Pooled + Direct URL configured |
| Twilio OTP | ✅ Connected | Must verify phone at twilio.com/console/phone-numbers/verified |
| Stripe | ✅ Connected | Test mode (`sk_test_...`). Webhook secret in `.env` |
| Cloudinary | ✅ Connected | Folders: amana/parcels, amana/tracking, amana/id-verifications |
| Firebase | ⏳ Skipped | Optional — push notifications not yet active |

---

## 👤 Admin & Test Accounts

| User | Phone | Role | Password |
|---|---|---|---|
| Acharif (admin) | +41779787399 | ADMIN + isVerified | OTP `123456` |
| sender_1..5 | +10000000001..5 | SENDER | OTP `123456` |
| traveler_1..5 | +10000000011..15 | TRAVELER | OTP `123456` |

> OTP bypass is active (`OTP_BYPASS=true` in backend `.env`). Use code `123456` for any account in dev.

---

## ✅ Progress Tracker

### Phase 1 — Foundation
- [x] Project scaffolded (backend + mobile + web)
- [x] Prisma schema (User, Trip, ParcelRequest, Booking, Payment, Review, TrackingEvent, IdVerification)
- [x] Phone OTP auth (Twilio) + JWT
- [x] App named **Amana**

### Phase 2 — Core Features
- [x] Trip creation & management (traveler)
- [x] Parcel requests & search (sender)
- [x] Booking flow (accept/reject)
- [x] Stripe Connect payments with escrow + 10% fee
- [x] Real-time tracking (Socket.IO)

### Phase 3 — Social
- [x] BlaBlaCar-style reviews (both sides leave a review per booking)
- [x] Public traveler profile (photo, stars, review count, trip history)
- [x] Review visible on TripResultsScreen (⭐ 4.8 · 12 reviews)

### Phase 4 — Web App (done as of 5.15.2026)
- [x] Stripe webhook fully tested end-to-end
- [x] All web app pages: dashboard, trips, parcels, bookings, notifications, profile, admin
- [x] City autocomplete (OpenStreetMap Nominatim) on trip form & parcel search
- [x] Admin page: approve/reject ID verifications + user list
- [x] OTP dev bypass (code: 123456) for restricted countries (Algeria blocked by Twilio)
- [x] 10 test users seeded (5 senders + 5 travelers) with 10 trips
- [x] `/parcels/new` page with disclaimer, photo upload, estimated value, fragile toggle
- [x] `fragile` + `estimatedValue` added to ParcelRequest schema + DB migration applied
- [x] Landing page: BlaBlaCar-style trip search (From/To autocomplete + date filter + verified filter)
- [x] Public `/api/trips/public` endpoint (no auth required, hides traveler personal info)
- [x] Trip cards on landing page: anonymous (no name/rating), full card clickable
- [x] Middleware: preserves redirect destination after login (`?redirect=/trips/[id]`)
- [x] Auth page: redirects to `?redirect` param after login instead of always going to /dashboard

### Phase 5 — TODO
- [x] ID verification upload flow on web (profile page → upload front/back photo → Cloudinary)
- [x] Trip detail for traveler's own trips: manage incoming bookings per trip inline
- [x] Mobile app tested on real device via Expo Go
- [x] Firebase push notifications
- [x] Deploy backend → Railway
- [x] Deploy web → Vercel
- [x] Mobile beta → Expo EAS Build (TestFlight / Play Store)

---

## 🗄️ Key Files

| File | Purpose |
|---|---|
| `backend/src/controllers/auth.controller.js` | OTP send/verify with dev bypass + WhatsApp fallback |
| `backend/src/controllers/trip.controller.js` | Trip CRUD + `publicSearchTrips` (no auth, anonymous) |
| `backend/src/controllers/parcel.controller.js` | Parcel CRUD incl. fragile + estimatedValue |
| `backend/prisma/schema.prisma` | DB schema — ParcelRequest has fragile + estimatedValue |
| `backend/prisma/seed.js` | Run `node prisma/seed.js` to recreate test users + trips |
| `web/src/middleware.ts` | Auth guard — passes `?redirect=` param to /auth |
| `web/src/app/auth/page.tsx` | Phone → OTP → name flow, redirects to ?redirect after login |
| `web/src/app/(app)/trips/[id]/page.tsx` | Trip detail + booking request (own trip guard) |
| `web/src/app/(app)/parcels/new/page.tsx` | New parcel form with disclaimer + photo + value |
| `web/src/app/(app)/admin/page.tsx` | Admin panel: ID verifications + users |
| `web/src/components/landing/TripSearchSection.tsx` | Landing page trip browser (BlaBlaCar-style) |
| `web/src/components/ui/CityAutocomplete.tsx` | Reusable city autocomplete (Nominatim API) |
| `web/src/lib/api.ts` | All Axios API clients (authApi, tripApi, parcelApi, adminApi…) |

---

## 🚀 Deployment Plan (when ready)

| Part | Platform | Cost |
|---|---|---|
| Backend | Railway | Free tier |
| Web | Vercel | Free |
| Database | Neon | Free |
| Mobile beta | Expo EAS Build | Free tier |

---

## 💬 How to Resume with Copilot

Start a new conversation and say:
> "I'm working on the Amana project at D:\Users\acharif\amana — please read COPILOT_CONTEXT.md and resume from session amana_5.21.2026"

Or paste this file directly into the chat.

---

## 📅 Session Log

### Session amana_5.21.2026 — Phase 5 Complete

**Date:** 2026-05-21  
**Status:** ✅ All Phase 5 todos completed

#### What was done

**1. ID Verification Upload (web)**
- Added `idVerification` + `role` fields to `User` interface in `web/src/store/authStore.ts`
- Rewrote `web/src/app/(app)/profile/page.tsx` — added `IdVerificationSection` component
  - Handles all states: upload form → PENDING banner → APPROVED badge → REJECTED re-upload
  - Posts `multipart/form-data` to `POST /users/me/id-verification` (front + back photos → Cloudinary)

**2. Trip Detail — Booking Management for Traveler**
- Added `getTripBookings` controller to `backend/src/controllers/trip.controller.js`
- Added `GET /trips/:id/bookings` route (traveler-only, 403 if not owner)
- Added `tripApi.getBookings(id)` to `web/src/lib/api.ts`
- Rewrote `web/src/app/(app)/trips/[id]/page.tsx` — added `TripBookingsPanel` component
  - Shows pending bookings with Accept/Reject buttons
  - Shows previous (non-pending) bookings in compact list
  - Back link dynamically says "Back to My Trips" vs "Back to search"

**3. Mobile App — Expo Go Ready**
- Fixed critical `package.json` bug: `main` was `"expo-router/entry"` → changed to `"App.tsx"`
- Removed `expo-router` from dependencies (project uses classic App.tsx, not file-based routing)
- Removed broken `expo-notifications` plugin reference (was pointing to missing `notification-icon.png`)
- Generated placeholder PNG assets (icon, splash, adaptive-icon, favicon) — blue with "A"
- Created `mobile/.env` with `EXPO_PUBLIC_API_URL=http://10.44.198.87:3000/api`
- Added `tripApi.getBookings` to `mobile/src/api/index.ts`

**4. Push Notifications**
- Updated `backend/src/services/notification.service.js` — auto-detects token type:
  - `ExponentPushToken[...]` → Expo Push API (`https://exp.host/--/api/v2/push/send`) — no Firebase needed for dev
  - Other → FCM (requires `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env`)
- Created `mobile/src/utils/notifications.ts` — `registerForPushNotificationsAsync()` + `syncPushToken()`
- Updated `mobile/src/navigation/AppNavigator.tsx`:
  - Calls `syncPushToken()` on auth
  - `addNotificationReceivedListener` for foreground notifications
  - `addNotificationResponseReceivedListener` — tap navigates to `BookingDetail` via `bookingId`

**5. Deploy — Railway (backend) + Vercel (web)**
- Created `backend/railway.json` — Nixpacks builder, `npm start`, restart on failure
- Added `postinstall: prisma generate` and `db:deploy` scripts to `backend/package.json`
- Fixed CORS in `backend/src/app.js` — now reads `CORS_ORIGIN` env var (comma-separated), falls back to `true` in dev
- Fixed `web/package.json` `start` script — removed hardcoded `-p 3001` (Vercel manages port)
- Created `web/vercel.json`, `web/.env.example`, updated `backend/.env.example`

**6. Mobile — EAS Build Setup**
- Created `mobile/eas.json` — 3 build profiles: `development` (dev client), `preview` (APK), `production`
- Created `mobile/babel.config.js` — required by Expo bundler (was missing)
- Created `mobile/tsconfig.json` — extends `expo/tsconfig.base`
- Created `mobile/.gitignore` — excludes `.env`, keystores, `google-service-account.json`
- Updated `mobile/app.json` — added `runtimeVersion`, `buildNumber: "1"`, `versionCode: 1`, `web.favicon`

#### Files changed
| File | Change |
|---|---|
| `web/src/store/authStore.ts` | + `idVerification`, `role` to User interface |
| `web/src/app/(app)/profile/page.tsx` | Full rewrite — ID verification section |
| `web/src/app/(app)/trips/[id]/page.tsx` | Full rewrite — booking management panel |
| `web/src/lib/api.ts` | + `tripApi.getBookings` |
| `backend/src/controllers/trip.controller.js` | + `getTripBookings` |
| `backend/src/routes/trip.routes.js` | + `GET /:id/bookings` |
| `backend/src/services/notification.service.js` | Expo Push API support |
| `backend/src/app.js` | CORS restricted to `CORS_ORIGIN` env var |
| `backend/package.json` | + `postinstall`, `db:deploy` scripts |
| `mobile/package.json` | Fixed `main` entry, removed `expo-router` |
| `mobile/app.json` | `runtimeVersion`, build numbers, favicon |
| `mobile/src/api/index.ts` | + `tripApi.getBookings` |
| `mobile/src/navigation/AppNavigator.tsx` | Push notification setup |

#### Files created
| File | Purpose |
|---|---|
| `backend/railway.json` | Railway deployment config |
| `web/vercel.json` | Vercel deployment config |
| `web/.env.example` | Web env vars template |
| `backend/.env.example` | Backend env vars template (production notes) |
| `mobile/.env` | Local dev — API URL with local IP |
| `mobile/.gitignore` | Excludes secrets + build artifacts |
| `mobile/eas.json` | EAS build profiles (dev/preview/production) |
| `mobile/babel.config.js` | Required Expo Babel config |
| `mobile/tsconfig.json` | TypeScript config |
| `mobile/assets/icon.png` | Placeholder 1024×1024 PNG |
| `mobile/assets/splash.png` | Placeholder 1284×2778 PNG |
| `mobile/assets/adaptive-icon.png` | Placeholder 1024×1024 PNG |
| `mobile/assets/favicon.png` | Placeholder 32×32 PNG |
| `mobile/src/utils/notifications.ts` | Push notification registration utility |

#### Remaining manual steps before going live

**Backend → Railway:**
1. Push repo to GitHub, connect at railway.app (root: `backend/`)
2. Set all env vars from `backend/.env.example` (`OTP_BYPASS=false`, real Stripe/Twilio/Cloudinary keys)
3. Run `npm run db:deploy` from Railway shell

**Web → Vercel:**
1. Connect repo at vercel.com (root: `web/`)
2. Set `NEXT_PUBLIC_API_URL=https://<railway-url>/api`
3. Set `CORS_ORIGIN=https://<vercel-url>` in Railway env vars

**Mobile → EAS:**
1. `npm install -g eas-cli && eas login`
2. `eas init` in `mobile/` → update `app.json` `extra.eas.projectId`
3. Fill in `eas.json` submit section (Apple ID, ASC App ID, Google service account)
4. Replace placeholder assets in `mobile/assets/` with real brand graphics
5. `eas build --platform android --profile preview` → first APK
6. `eas build --platform all --profile production` → store submission


---

## 📦 What is Amana?

**Amana** (أمانة — *trust*) is a peer-to-peer parcel delivery app, like BlaBlaCar but for packages.
- Travelers post trips and offer to carry parcels
- Senders search trips and request delivery
- App takes a **10% platform fee** from each transaction (deducted from traveler payout)

---

## 🗂️ Project Structure

```
D:\Users\acharif\amana\
├── backend\        Node.js + Express + Prisma + PostgreSQL (Neon)
├── mobile\         React Native + Expo
├── web\            Next.js website
└── COPILOT_CONTEXT.md   ← this file
```

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo |
| Web | Next.js |
| Backend | Node.js + Express |
| Database | PostgreSQL via Neon (cloud) + Prisma ORM |
| Auth | Phone OTP (Twilio Verify) + JWT |
| Payments | Stripe Connect (escrow, 10% fee) |
| Storage | Cloudinary |
| Real-time | Socket.IO |
| Push | Firebase Cloud Messaging (optional, not yet active) |

---

## ▶️ How to Start Working (run all 3 terminals)

### Terminal 1 — Backend
```powershell
cd D:\Users\acharif\amana\backend
npm run dev
# → http://localhost:3000
```

### Terminal 2 — Stripe Webhook (keep running during dev)
```powershell
cd D:\Users\acharif\amana\stripe_1.40.9_windows_x86_64
.\stripe.exe listen --forward-to localhost:3000/api/payments/webhook
```

### Terminal 3 — Web App
```powershell
cd D:\Users\acharif\amana\web
npm run dev
# → http://localhost:3001
```

### Terminal 4 — Mobile App (optional)
```powershell
cd D:\Users\acharif\amana\mobile
npx expo start
# Scan QR with Expo Go on phone (same WiFi as PC)
# Set EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/api in mobile\.env
```

---

## 🔑 Services & Credentials (all in backend\.env)

| Service | Status | Notes |
|---|---|---|
| Neon (DB) | ✅ Connected | Pooled + Direct URL configured |
| Twilio OTP | ✅ Connected | Must verify phone at twilio.com/console/phone-numbers/verified |
| Stripe | ✅ Connected | Test mode (`sk_test_...`). Webhook secret in `.env` |
| Cloudinary | ✅ Connected | Folders: amana/parcels, amana/tracking, amana/id-verifications |
| Firebase | ⏳ Skipped | Optional — push notifications not yet active |

---

## ✅ Progress Tracker

### Phase 1 — Foundation
- [x] Project scaffolded (backend + mobile + web)
- [x] Prisma schema (User, Trip, ParcelRequest, Booking, Payment, Review, TrackingEvent, IdVerification)
- [x] Phone OTP auth (Twilio) + JWT
- [x] App named **Amana**

### Phase 2 — Core Features
- [x] Trip creation & management (traveler)
- [x] Parcel requests & search (sender)
- [x] Booking flow (accept/reject)
- [x] Stripe Connect payments with escrow + 10% fee
- [x] Real-time tracking (Socket.IO)

### Phase 3 — Social
- [x] BlaBlaCar-style reviews (both sides leave a review per booking)
- [x] Public traveler profile (photo, stars, review count, trip history)
- [x] Review visible on TripResultsScreen (⭐ 4.8 · 12 reviews)

### Phase 4 — Web App (done as of 5.15.2026)
- [x] Stripe webhook fully tested end-to-end
- [x] Web app pages built (dashboard, trips, parcels, bookings, notifications, profile, admin)
- [x] City autocomplete (OpenStreetMap) on trip form & search
- [x] Admin page to approve/reject ID verifications
- [x] OTP dev bypass (code: 123456) for restricted countries
