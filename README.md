# Amana 📦✈️

> Peer-to-peer parcel delivery platform – travelers carry parcels, senders find them.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Auth | Phone OTP (Twilio) + JWT |
| Payments | Stripe Connect (escrow) |
| Real-time | Socket.IO |
| Storage | Cloudinary |
| Notifications | Firebase Cloud Messaging |

## Project Structure

```
amana/
├── backend/     # Node.js + Express API
└── mobile/      # React Native (Expo) app
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env        # fill in your secrets
npm install
npx prisma migrate dev      # create the database
npm run dev                 # starts on port 3000
```

### Mobile

```bash
cd mobile
npm install
# set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in a .env file
npx expo start
```

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | POST /api/auth/send-otp, /verify-otp, /refresh, /logout |
| Users | GET/PATCH /api/users/me, POST /me/id-verification |
| Trips | GET/POST /api/trips, /search, /:id |
| Parcels | GET/POST /api/parcels, /my, /:id |
| Bookings | GET/POST /api/bookings, /:id/respond |
| Tracking | GET/POST /api/tracking/:bookingId |
| Payments | POST /api/payments/intent, /webhook |
| Reviews | GET/POST /api/reviews |
| Admin | GET /api/admin/users, /verifications |

## Payment Flow

1. Traveler sets **price/kg** on trip
2. Sender pays **base amount + 10% fee** (Stripe)
3. Funds held in **escrow** until delivery confirmed
4. App auto-transfers **traveler's share** via Stripe Connect

## Environment Variables

See `backend/.env.example` for required configuration.
