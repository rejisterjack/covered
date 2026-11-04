# Ops runbook

## Admin access

1. Set `ADMIN_EMAILS=you@example.com,ops@example.com` in env (comma-separated)
2. Sign in with an allowlisted email via magic link — role is promoted to `admin` automatically
3. Open `/admin` (no public nav link; bookmark it)
4. Non-admins are redirected home

Demotion: remove the email from `ADMIN_EMAILS`, then reset role in SQL:

```sql
UPDATE "User" SET role = 'user' WHERE email = 'ops@example.com';
```

## Admin console actions

Prefer `/admin` over raw SQL:

| Need | Where |
|---|---|
| Unflag / reopen | Flagged → Dismiss flags |
| Soft-delete abusive bill | Flagged → Confirm flag, or Bills search |
| Restore soft-deleted | Bills → Restore (blocked if poster posting-locked) |
| Force reopen stale claim | Pending → Force reopen |
| Lock / unlock poster | Users search |
| Toggle public verified badge | Users search |
| Pause all posting | Platform → Pause posting |
| Review actions | Audit |

## Pause posting during abuse

Use **Platform → Pause posting** in `/admin` (sets `PlatformSettings.pausePosting`).  
`POST /api/bills` returns `403 Posting paused` until resumed.

## Cron failure

- Confirm `Authorization: Bearer $CRON_SECRET`
- Hit `/api/cron/confirmations` manually
- Check Vercel cron logs

## Rotate secrets

1. Generate new `BETTER_AUTH_SECRET`, Resend API key, R2 keys, or VAPID pair
2. Update Vercel env (Production + Preview)
3. Redeploy
4. For VAPID changes, users must re-subscribe to push

## Database migrate

```bash
bunx prisma migrate deploy
```

Never use `db push` in production.
