# Security protocols (MVP)

## Money boundary

- No payment APIs, escrow, payouts, or fee collection in this codebase
- Reviewers must reject PRs that introduce payment provider SDKs

## Auth & sessions

- Better Auth HttpOnly cookies
- Email magic-link sign-in required before posting
- In-memory rate limits on auth-adjacent mutations, posts, flags, intents, uploads

## Data exposure

- Feed serializers never include `paymentHandle` / QR
- Payment details only after authenticated cover intent, or to the poster
- Public profiles expose first name + city only

## Uploads

- Presigned R2 PUT with 120s TTL
- MIME allowlist: jpeg/png/webp/heic/heif
- Max 8MB

## Abuse

- Unique flags per user/bill
- Auto-flag at `FLAG_AUTO_THRESHOLD` (default 3)
- Soft posting lock after repeated unconfirmed receipts
- Cron expires stale `pending_confirmation` after 24h

## Secrets

- Never commit `.env`
- Vercel-only production secrets
- Cron requires `Authorization: Bearer $CRON_SECRET`

## Admin

- Ops role is `User.role = admin` (not client-writable; Better Auth `input: false`)
- Promote via `ADMIN_EMAILS` allowlist (comma-separated) on user create / session create / admin access
- `/admin` and `/api/admin/*` require a signed-in admin session — no shared header token
- Mutations are rate-limited and written to `AdminAuditLog`
- Soft-deleted bills (`deletedAt`) are hidden from public feeds/detail; `pausePosting` blocks `POST /api/bills`
