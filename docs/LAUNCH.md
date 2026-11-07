# Covered launch checklist

## Pre-flight

- [ ] Neon project created with PITR enabled
- [ ] `DATABASE_URL` set on Vercel (pooled) + migrate with direct URL if needed
- [ ] `bunx prisma migrate deploy` succeeds against production
- [ ] `BETTER_AUTH_SECRET` (≥32 chars) and `BETTER_AUTH_URL=https://covered.rejisterjack.com`
- [ ] Resend API key + verified from-domain (or keep `EMAIL_DEV_MODE=true` only for staging)
- [ ] R2 bucket + public domain `assets.covered.rejisterjack.com`
- [ ] VAPID keys generated; public key mirrored to `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] `CRON_SECRET` set; Vercel Cron hits `/api/cron/confirmations` hourly
- [ ] Custom domain `covered.rejisterjack.com` attached with HTTPS
- [ ] Terms + Privacy reviewed by a human (**pages expanded** for money-boundary, data stored, contact — still need counsel / operator sign-off before treating as final)
- [ ] Soft launch invites (optional): set `SOFT_LAUNCH_INVITES=1` and/or Admin → Platform → soft-launch gate; mint codes via `/api/admin/invites`

## Smoke test on production

1. Email magic-link signup on two devices
2. Poster uploads bill → appears on New feed
3. Donor taps I’ll cover this → payment handle reveals
4. Donor pays outside app → taps I paid this
5. Poster confirms → status Covered ✓ → leaderboard updates
6. Flag a test bill → threshold behavior verified in staging
7. Install PWA on Android Chrome; confirm offline feed cache + outbox retry banner

## Monitoring

- Watch `pending_confirmation` backlog and flag rate daily for first week
- Neon storage + query insights for feed indexes
- Resend email delivery failures
- R2 upload 4xx/5xx
- Open bills past `dueDate` should move to `expired` via the same hourly cron

## Scale triggers (deferred until measured)

Do **not** add Accelerate / rollups / Redis / image resize preemptively. Promote only when a threshold below is hit and stays hit for the window noted.

| Signal | Measured threshold | Deferred action |
|---|---|---|
| Feed / bill-list p95 latency | **> 800ms** for **15 minutes** under normal traffic (Neon query insights or APM) | Prisma Accelerate and/or read replica |
| Hot monthly leaderboard | Query p95 **> 500ms**, or **> 10k** covered bills in the active month, or leaderboard route timeouts | Materialized monthly rollup table + cron refresh |
| Rate-limit map | Process holds **> 10k** distinct keys, or you run **> 1** Node instance / serverless concurrency where in-memory buckets diverge | Move buckets to Redis / Upstash |
| Heavy images | Origin image egress **> 50 GB / month**, or LCP for bill photo **> 2.5s** on mid-tier mobile | Cloudflare Image Resizing (or R2 + resizing worker) |

Revisit these numbers after the first week of production metrics; adjust upward if noise, never ship the infra before the threshold.

## Post-MVP backlog

- Category champions
- Streak badges (7 / 14 / 30)
- Embeddable leaderboard widget
- Location-radius search
- Verified public-figure workflow
- Richer offline photo queue (partially shipped: error + retry affordance)

## Money boundary (invariant)

Never add payment processing, escrow, payouts, or fee collection. Covered stays a connection layer.
