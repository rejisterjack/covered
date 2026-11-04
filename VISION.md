# Covered

**Post your bill. Someone's got it.**

---

## What Is This

Covered is a mobile-first PWA where anyone posts a bill they cannot pay. Donors — wealthy individuals, companies, or anyone who wants to help — browse the feed, pick a bill, and pay it directly peer-to-peer. The platform gamifies generosity through public leaderboards, making giving a social signal as much as a charitable act.

Covered never touches money. It facilitates the connection. Payment happens outside the app — UPI, Venmo, PayPal, cash — however the two people agree.

---

## The Problem

Medical emergencies, utility cutoffs, rent shortfalls — real people face real bills they cannot cover. Existing options are fragmented: GoFundMe requires a campaign, charity donations are abstract, and asking for help publicly feels humiliating. There is no clean, fast, mobile-native way to say "I need ₹3,000 for this electricity bill" and have a stranger pay it in two minutes.

On the other side, wealthy people and companies want to give — but writing a cheque to a charity feels impersonal and invisible. There is no platform that makes generosity visible, competitive, and immediate.

---

## Who It Is For

**Posters** — anyone facing a bill they cannot pay right now. No minimum. No application process. Post in under two minutes.

**Donors** — anyone who wants to help. Could be a billionaire, could be someone who just got their salary and wants to cover one stranger's grocery bill. The leaderboard makes both feel seen.

---

## How It Works

### Posting a bill

1. Sign up, verify phone number
2. Upload a photo of the bill or invoice
3. Enter amount, pick a category (medical / rent / utilities / education / food / other)
4. Write one line — the story behind it
5. Add your UPI ID, payment handle, or QR code image
6. Bill goes live on the feed

### Covering a bill

1. Browse the feed — filter by category, amount, or location
2. Tap a bill that moves you
3. Tap **"I'll cover this"** — see the poster's payment details
4. Pay directly via GPay, PhonePe, Paytm, Venmo, or any app you use
5. Come back, tap **"I paid this"** — optionally attach a payment screenshot
6. Poster gets notified, confirms receipt
7. Bill marked **Covered ✓** — donor's name appears on the leaderboard

### Trust flow

- Donor marks paid → poster has 24 hours to confirm
- Poster confirms → bill status becomes Covered, leaderboard updates
- Poster does not confirm → bill stays "Pending confirmation", donor can flag
- Any user can flag a suspicious bill before it is paid
- Repeated unconfirmed bills from one poster trigger a review

---

## The Leaderboard

The leaderboard is the product's viral engine. It makes generosity public, competitive, and meaningful.

- **All-time top givers** — name, total amount given, number of bills covered
- **This month** — resets on the 1st, keeps competition fresh every cycle
- **Category champions** — top payer per category (medical, rent, etc.)
- **Streak badges** — covered a bill every day for 7, 14, 30 days
- Verified public figures get a checkmark next to their name
- Anonymous donors appear as "Anonymous" but their total still counts toward rank

The leaderboard is public, shareable, and embeddable. Someone sharing a screenshot of their rank is free marketing.

---

## Feed Design

Three tabs on the home screen:

**New** — most recently posted open bills, unpaid  
**Hot** — most viewed / most "I'll cover this" taps today  
**Just Covered** — real-time celebration feed of bills paid in the last hour

Each bill card shows: poster's first name + city, category icon, amount, one-line story, time posted, and a "Cover this" button.

---

## What Covered Does Not Do

- Covered does not process, hold, or move money — ever
- Covered does not verify that posted bills are genuine (community flagging handles fraud at MVP scale)
- Covered does not take a percentage of anything
- Covered is not a loan platform
- Covered does not store UPI IDs or payment details beyond what the poster explicitly makes visible

---

## Technical Architecture

Single Next.js 14 App Router application. One repo. One deployment. Works in every browser, installs on every phone as a PWA.

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | Full-stack — API routes + frontend in one app |
| PWA | `@ducanh2912/next-pwa` (Serwist) | Service worker, offline support, home screen install |
| Database | NeonDB (Postgres) | Serverless, Vercel-integrated, free tier |
| ORM | Prisma | Type-safe, schema-first |
| Auth | Better Auth | Self-hosted, no per-user pricing, Next.js native |
| File storage | Cloudflare R2 | Zero egress fees, S3-compatible, Cloudflare CDN |
| Deployment | Vercel | Free tier covers launch |

### Core database schema

```
users
  id, name, avatar_url, phone_verified, upi_id,
  total_given, bills_covered, bills_posted, created_at

bills
  id, poster_id, amount, category, story,
  image_url, payment_handle, payment_type,
  status (open | pending_confirmation | covered | expired | flagged),
  covered_by, covered_at, created_at

payments
  id, bill_id, donor_id, amount, is_anonymous,
  screenshot_url, donor_marked_at, poster_confirmed_at

flags
  id, bill_id, flagged_by, reason, created_at
```

### Offline behaviour (PWA service worker)

- Feed and leaderboard served from cache when offline
- Bill posting form works offline — queued in IndexedDB, uploads on reconnect
- "I paid this" confirmation queued offline — syncs when back online
- Push notifications via Web Push API for "Your bill was covered!"

---

## Deployment

```
vercel deploy
```

Environment variables needed:
- `DATABASE_URL` — NeonDB connection string
- `BETTER_AUTH_SECRET` — auth signing secret
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `NEXT_PUBLIC_R2_PUBLIC_URL` — Cloudflare CDN URL for bill photos

Custom domain: `covered.rejisterjack.com`  
Asset CDN: `assets.covered.rejisterjack.com` (R2 public bucket)

---

## MVP Scope

- [ ] Auth — phone verification via Better Auth
- [ ] Post a bill — photo upload to R2, amount, category, story, payment handle
- [ ] Feed — new bills, filterable by category
- [ ] Bill detail page — full story, payment details reveal on tap
- [ ] Cover flow — "I'll cover this" → payment details → "I paid this" confirmation
- [ ] Poster confirmation — confirm receipt, bill marked Covered
- [ ] Leaderboard — all-time and monthly, public
- [ ] Profile — bills posted, bills covered, total given
- [ ] Flagging — flag a suspicious bill
- [ ] PWA — installable, offline feed, push notifications
- [ ] Vercel deployment at `covered.rejisterjack.com`

---

## What Success Looks Like at Launch

- 100 bills posted in the first week
- 10 bills fully confirmed as covered
- One person with a meaningful following shares the leaderboard
- Zero payment disputes (the platform never touched money — there is nothing to dispute)

---

## Beliefs

**Generosity needs an audience.** Most people who could help would help — if helping were visible, easy, and immediate. Covered makes all three true.

**We are not a charity platform.** Covered is a connection layer. What happens between poster and donor is between them. We provide the stage.

**Trust is earned post by post.** A poster who confirms receipts quickly builds a reputation. A donor who covers consistently builds a rank. The system rewards honesty without enforcing it.

**Money should never touch us.** The moment Covered holds funds, it becomes a fintech company with compliance obligations. It stays a social platform by staying out of the transaction entirely.
