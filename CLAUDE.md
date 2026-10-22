# Amana — project guide (read this first)

Peer-to-peer parcel delivery ("BlaBlaCar for parcels"): **travelers** post trips, **senders** book space for a parcel, the platform
holds the payment in escrow and takes 10% (deducted from the traveler's payout). Routes are mostly Switzerland/France/Belgium/Spain ↔ Morocco/Algeria/Tunisia.
Owner: Aziza (speaks Spanish; replies in Spanish unless they write English). Repo: https://github.com/amanadiima-dima/amana (branch `master`).

## Layout
- `backend/` Node 20 · Express · Prisma · PostgreSQL · Socket.IO. `src/{controllers,routes,services,utils,middlewares}`, `prisma/` (schema + migrations), `scripts/make-admin.js`, `tests/e2e/`.
- `web/` Next.js 14.2.x App Router · Tailwind · Zustand · **next-intl v4** (en default no prefix, fr, es, ar RTL). Routes live under `src/app/[locale]/`.
- `mobile/` React Native/Expo — **the original Copilot code, untouched** (no feature parity). Build it only after the web beta stabilises.
- `dev-local.sh` / `dev-stop.sh` — offline dev stack (bundled Postgres 16 on :5433 → API :3000 → web :3001).

## Run locally
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20     # system node is v10 — always load nvm first
./dev-local.sh        # starts Postgres + backend + web; prints seeded logins. ./dev-stop.sh stops them
```
- `.localdev/` (bundled Postgres binaries + data) and `backend/.env`, `web/.env.local` are git-ignored. If `.localdev` is missing, recreate it
  (prebuilt zonky PG 16 binaries, `initdb --auth=trust`, port 5433, socket `/tmp/amana-pgsock`), then `npx prisma migrate deploy` and `node -r dotenv/config prisma/seed.js` in `backend/`.
- Local login: any seeded phone (`+10000000001..5` senders, `+10000000011..15` travelers, `+10000000099` admin) + password **`amana1234`**, then SMS code **`123456`** — the code only works with `NODE_ENV=development` and `OTP_BYPASS=true`. New accounts: "Create account" tab, any phone, code 123456.
- Local `.env` extras for tests: `RATE_LIMIT_MAX=100000`, `MAX_INVITES_PER_DAY=1000`. Payments are simulated; Cloudinary/Twilio/Stripe are stubbed with dummy keys.
- The dev backend is plain `node` (no hot reload): after backend edits kill the PID on :3000 and `cd backend && npm start`. Web hot-reloads.
- Prisma: `migrate dev` refuses to run non-interactively when it shows a warning (e.g. a new `@unique`). Workaround used throughout: create the folder
  `prisma/migrations/<timestamp>_<name>/`, write `migration.sql` with `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`, then `npx prisma migrate deploy && npx prisma generate`.
  The CLI also reads `backend/.env` even when `DATABASE_URL` is set in the shell — to target another DB, run it from a folder with no `.env`.

## Testing
- `cd backend && npm run test:e2e` runs `tests/e2e/*.e2e.js` against the local stack: **285 checks** (chat/privacy, money protection, currency, recipient-pays, invitations, KYC + staff roles, sign-up, nearby search, expiry, admin user management, GDPR export/closure/legal hold/retention). Keep it green; add a script per feature. Scripts sign in through `tests/e2e/_auth.js` (`signIn(phone, name)`: logs in, or registers, or resets to the test password).
- Web: `cd web && npx tsc --noEmit && npm run build`. **i18n parity** (all 4 catalogs must have identical keys):
  `node -e "const fs=require('fs');const L=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?L(v,p+k+'.'):[p+k]);const s=['en','fr','es','ar'].map(l=>L(JSON.parse(fs.readFileSync('messages/'+l+'.json'))));console.log(s.map(x=>x.length))"` (run in `web/`).
- The browser pane can't use the camera (selfie recording is untested on a real device).

## Deployment (closed beta, live)
- **Railway**, auto-deploys on `git push origin master`. Two services (in two Railway projects): `web` → https://web-production-b68d4.up.railway.app (Root Dir `/web`, config `/web/railway.json`) and
  `backend` → https://backend-production-e29b.up.railway.app (Root Dir `/backend`, config `/backend/railway.json`, start = `npm run start:prod` = `prisma migrate deploy && node src/index.js`, health `/health`).
- DB: **Neon** Postgres (direct, non-pooled string in `DATABASE_URL`; `DIRECT_URL` falls back to it). SMS OTP: **Twilio Verify** (paid account; geo-permissions must list the target countries). Files: **Cloudinary** (ID documents, selfie videos, parcel and delivery photos stored as private `authenticated` assets, referenced as `cld:<type>:<publicId>.<format>`; every JSON response swaps refs for **download links that expire after 1 h** — `utils/cloudinary.js`).
- Backend env vars (names only — **never write values into files or chat**): `NODE_ENV=production, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET (32+ random chars), CORS_ORIGIN, WEB_URL (https, no trailing slash), TWILIO_ACCOUNT_SID (AC…), TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID (VA…), CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`. Optional: `PAYMENTS_MODE` (leave unset = simulated), `TWILIO_WHATSAPP_FROM`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_TEMPLATE_SID[_FR|_ES|_AR]`, `MESSAGING_CHANNELS`, `MAX_INVITES_PER_DAY` (10), `RATE_LIMIT_MAX` (600). Web: `NEXT_PUBLIC_API_URL=https://<backend>/api` (needed at build time).
- `backend/src/utils/checkEnv.js` makes the server refuse to start when hosted with a bad/missing config (OTP bypass on, weak JWT secrets, wrong Twilio SID format, `<placeholders>`, malformed URLs…) — read its message first when a deploy crashes.
- Gotchas already hit: Railway blocks builds with known-CVE deps (keep `next` ≥ 14.2.35); never commit `tsconfig.tsbuildinfo` (breaks Nixpacks); schema declares `directUrl=DIRECT_URL`; the owner pasted `<placeholder>` text and the wrong SID into variable fields several times.
- Make someone admin on the hosted DB: Railway → backend → Console → `npm run make-admin -- +<phone>` (person must have signed in once). The owner (+41779787399) is admin.
- The sandbox used by Claude has **no GitHub credentials**: the owner runs `git push` themselves (GitHub personal access token). Never push unasked.

## How the product works (rules enforced server-side)
- **Auth** (owner's choice, 2026-10-22): **email or phone + password, then an SMS code** (Twilio Verify) to the account's phone. `POST /auth/login` → `{loginToken, phoneHint}` → `/auth/login/verify`. Sign-up: `/auth/register` (`name` = first name — the only part other members see —, `lastName` — private: owner, staff, ID check —, phone, optional email, `birthDate` YYYY-MM-DD — must be 18+, checked again at verify —, password ≥ 8, `acceptTerms`) texts a code → `/auth/register/verify` creates the account. Forgot password: `/auth/password/forgot` (same answer whether the account exists) → `/auth/password/reset`; accounts created before passwords existed (2026-10-22) have `passwordHash = null` and set their first one this way. bcrypt hashes; `passwordHash` is stripped from every JSON response in `app.js`. 5 wrong passwords lock an identifier for 15 min (in memory); per-identifier OTP limits (5 send / 5 wrong per 10 min; relaxed under dev bypass). Profile: change email/password. The old code-only endpoints (`send-otp`, `verify-otp`, `complete-registration`) are gone — `mobile/` still calls them.
- **Trips**: mode, duration, pickup address/pin (OSM + Nominatim, not Google), `currency` (defaults from the departure country via `utils/nearbyCities.js`; EUR/CHF/MAD/DZD/TND/GBP/USD), only sanity bounds (≤2000 kg, ≤100000/kg), must depart in the future. Terms (price/capacity/date) freeze once bookings are active. Cancelling auto-refunds paid bookings; blocked if a parcel is already collected.
- **Search** (`GET /trips/search`): origin, destination, date all optional; date = "on or after"; **nearby matching** (~100 known cities, 80 km, whole-name match) returns `matchType exact|nearby` + distances.
- **Booking flow**: PENDING → ACCEPTED → (tracking) → COMPLETED; also REJECTED, CANCELLED, DISPUTED, PAYMENT_PENDING. `services/bookingExpiry.service.js` auto-cancels (and refunds held money) for departed trips, unpaid recipient requests, silent travelers; runs on boot, every 15 min and on list/get.
- **Money protection**: pickup requires payment HELD; tracking order PICKED_UP→IN_TRANSIT→DELIVERED; delivering needs the sender's **6-digit delivery code + a photo**, then payment is released; sender can't cancel after pickup (opens a **dispute** → admin refunds or pays the traveler); FAILED delivery auto-disputes. Payments are **simulated** (`PAYMENTS_MODE`); fee 10% of gross (price/kg × kg + optional **priority tip**).
- **Recipient pays**: sender enters the recipient's phone (account not required). Booking starts `PAYMENT_PENDING` (hidden from traveler), payer gets an invite link `/invite/<token>` (public preview, sign-up/in, claim, or decline) via `services/messaging.service.js` (Twilio WhatsApp first, SMS fallback; **stubbed/recorded in `OutboundMessage` until real senders are configured** — the sender can copy the link). Payer pays → money HELD → released to the traveler with a respond deadline; windows shrink with time-to-departure (`bookingFlow.service.js`).
- **ID verification (manual by design — the owner doesn't want paid KYC yet)**: ID card (front+back) or passport + selfie video **recorded live in the browser** (no file upload, owner's choice) with a server-issued random 4-digit challenge + consent; the server checks the video bytes (WebM/MP4), not the multipart type (browsers send `video/webm;codecs=vp8,opus`, which multer/busboy reads as text/plain); reviewers see it in `/admin`. **Staff roles**: `ADMIN` (everything) and `MODERATOR` (ID reviews + disputes only), managed in Admin → Team; `AuditLog` records who did what.
- **Chat**: Socket.IO room per booking (JWT-checked) + 8 s polling fallback; closed on REJECTED/CANCELLED; payer can chat too. Notifications table + unread badge; push/email not implemented.
- **GDPR** (`services/account.service.js`): sign-up requires an 18+/Terms checkbox (`termsAcceptedAt`); Profile → download my data (JSON) / close my account (no history → hard delete; otherwise anonymised, real name/phone + ID docs archived until `retainUntil` = 5 y after last booking); admin legal hold + audit-logged identity file; daily retention purge (selfie 30 d after review, rejected docs 30 d, old chats/photos 5 y, notifications 12 m). Periods are published in `web/src/content/legal/privacy.ts` — change both together. Legal pages `/privacy`, `/terms`, `/cookies` (content in `web/src/content/legal/`, 4 languages).
- **Landing** (`web/src/components/landing/`, layout inspired by blablacar.es, 2026-10-22): hero + search bar (sticky compact bar once scrolled past), popular routes from `GET /trips/popular-routes` (public; open future trips grouped by origin/destination/currency, cheapest €/kg, top 12, optional `?destination=`), upcoming trips / search results — `GET /trips/public` (public; origin, destination, date all optional; with a date: `trips` = that UTC day, `similar` = same route on the 10 closest other upcoming dates, shown under "Same route on other dates"), dark "publish your trip" band, 3 benefits, how it works, footer with route links (`/?from=…&to=…#trips`). No invented stats/testimonials; no photos yet (gradients/illustrations).
- PWA: installable (manifest, no-cache service worker). **Logo** (owner-supplied 2026-10-22: blue isometric box with speed lines whose side face forms the "A" of "Amana"; replaced a first version the same day): `web/public/amana-logo.png` / `amana-logo-white.png` (dark backgrounds) via `components/ui/Logo.tsx`; app icons `icon-192/512`, `icon-maskable-512`, `apple-touch-icon`, `favicon.png` = the box-with-A mark on white (URLs carry `?v=2`: bump it and rename the logo files when they change, browsers cache them).

## Conventions
- Web: always use `Link/useRouter/usePathname` from `@/i18n/navigation` (locale-aware), never `next/link`. Strings go in `web/messages/{en,fr,es,ar}.json` (ICU plurals, `t.rich` for links); money via `useMoney()` / `formatMoney()` (`lib/money.ts`, Latin digits even in Arabic).
- RTL: use logical Tailwind classes (`ms- me- ps- pe- start- end- text-start`, `rtl:rotate-180` on arrows) — never `ml/mr/left/right`.
- Server-generated text (notification titles/bodies, API error messages) is English only — known gap.
- Don't create docs/summary files unless asked; keep answers short; verify UI changes in the browser.

## Security rules
- Secrets only in Railway variables / local `.env` (git-ignored). Never paste keys in chat or files; screenshots of variable pages must not show values.
- Secrets leaked in chat during setup (Neon password ×2, a JWT secret, Cloudinary key+secret, Stripe test keys) → **rotate them** (owner was walked through it; confirm done).
- Stripe real mode is **not production-ready**: `transfer_data` pays the traveler at charge time (no real escrow) and `releasePayment` passes `travelerId` as the Stripe account. Needs a redesign (separate charges & transfers / manual capture + Connect onboarding) before real money; MAD/DZD/TND support in Stripe unverified.

## Backlog (priority order)
1. **Clean the 10 leftover seed users** (`sender_1..5`, `traveler_1..5`) from the production DB: after deploy, Admin → Users → search `_` → trash icon → type the phone to confirm. (Admin user management is built: disable/re-enable blocks sign-in; delete is cascading, refused for staff, self, active bookings or real-money payments — see `admin.controller.js` and `tests/e2e/admin-users.e2e.js`.)
2. Beta feedback: the owner and their partner are testing the hosted app and will send a list of fixes.
3. Server-side messages in 4 languages (notification texts, API errors e.g. "Wrong delivery code").
4. Legal identity: fill `web/src/content/legal/company.ts` (legal name, registered address, privacy email, EU representative) once the Spanish S.L. exists — the legal pages show `[placeholders]` until then. **Never use the owner's personal name or home address.** Then have a lawyer review `/terms` and `/privacy` (privacy still cites the Swiss FADP as the main law).
5. Configure Twilio WhatsApp sender + approved template (invitations are simulated until then).
6. Native mobile app (bring `mobile/` to parity; push notifications) once the API is stable. Needs Apple/Google developer accounts for tester distribution.
7. Real Stripe redesign; "notify me when a matching trip appears"; pay-before-accept for sender-pays bookings; (logo done.)
