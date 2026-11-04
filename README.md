# Covered

**Post your bill. Someone's got it.**

Mobile-first PWA where anyone posts a bill they cannot pay. Donors browse the feed, pay peer-to-peer outside the app, and land on a public leaderboard. Covered never touches money.

See [vision.md](./vision.md) for product intent and [docs/LAUNCH.md](./docs/LAUNCH.md) for go-live.

## Stack

- Next.js App Router + HeroUI
- Neon / Postgres + Prisma
- Better Auth (email magic link) + Resend
- Cloudflare R2 uploads
- Vercel deploy + hourly confirmation cron
- PWA service worker + IndexedDB outbox

## Local setup

```bash
bun install
docker compose up -d   # Postgres on localhost:5434
bunx prisma migrate deploy
bun run dev
```

Do not seed demo data — the app starts empty.

Copy `.env.example` → `.env` and fill production secrets when deploying.

## Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Local app |
| `bun run test` | Unit tests |
| `bun run test:e2e` | Playwright smoke |
| `bun run build` | Production build |

## Money boundary

Do not add payment processing, escrow, or payouts. Payment handles are revealed only after an authenticated cover intent.
