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
- [ ] Terms + Privacy reviewed by a human
- [ ] Soft launch invite list (optional)

## Smoke test on production

1. Email magic-link signup on two devices
2. Poster uploads bill → appears on New feed
3. Donor taps I’ll cover this → payment handle reveals
4. Donor pays outside app → taps I paid this
5. Poster confirms → status Covered ✓ → leaderboard updates
6. Flag a test bill → threshold behavior verified in staging
7. Install PWA on Android Chrome; confirm offline feed cache

## Monitoring

- Watch `pending_confirmation` backlog and flag rate daily for first week
- Neon storage + query insights for feed indexes
- Resend email delivery failures
- R2 upload 4xx/5xx

## Scale triggers

| Signal | Action |
|---|---|
| Slow feed queries | Prisma Accelerate / read replica |
| Hot monthly leaderboard | Materialized rollup table |
| Rate-limit map growth | Move to Redis / Upstash |
| Heavy images | Cloudflare Image Resizing |

## Post-MVP backlog

- Category champions
- Streak badges (7 / 14 / 30)
- Embeddable leaderboard widget
- Location-radius search
- Verified public-figure workflow
- Richer offline photo queue

## Money boundary (invariant)

Never add payment processing, escrow, payouts, or fee collection. Covered stays a connection layer.
