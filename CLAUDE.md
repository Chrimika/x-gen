# X-Gen — Claude Code Team Management

## Project Overview
Web app for managing Claude AI Team subscription resale. Members pay via NotchPay (Mobile Money / Card) to join team plans.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend/DB**: Firebase (Firestore + Auth)
- **Payments**: NotchPay API with webhooks
- **Icons**: Lucide React
- **Deployment**: Vercel

## Important Next.js 16 Notes
- `middleware.ts` is **deprecated** → use `proxy.ts` with `export function proxy()`
- Dynamic params are `Promise<{}>` — must `await`
- Use `PageProps<"/path">` and `LayoutProps<"/path">` helpers
- Route handlers use `RouteContext<"/path">` for typed context

## Project Structure
```
app/
  page.tsx          — Landing page (public)
  layout.tsx        — Root layout with AuthProvider
  login/page.tsx    — Google login
  dashboard/page.tsx — Member dashboard
  checkout/[planId]/page.tsx — Payment checkout
  myspace/page.tsx  — Admin panel
  api/
    webhooks/notchpay/route.ts — NotchPay webhook
    admin/route.ts   — Admin data API
    admin/plans/     — Plan CRUD
    admin/members/   — Member CRUD
    admin/config/    — Pricing config

components/
  header.tsx        — App header with nav
  plan-card.tsx     — Plan display card
  community-stats.tsx — WhatsApp community stats

lib/
  firebase.ts       — Client Firebase config
  firebase-admin.ts — Server Firebase Admin
  auth-context.tsx  — Auth context provider
  types.ts          — TypeScript interfaces
  pricing.ts        — Pricing calculations
  hooks.ts          — Firestore real-time hooks
  cookies.ts        — Auth cookie helpers

proxy.ts            — Route protection (replaces middleware)
firestore.rules     — Security rules
```

## Business Logic
- Base cost: 18,500 FCFA/seat/month (Anthropic)
- Margin: 2,000 FCFA/seat
- NotchPay fee: 2% added to price
- Full month price: **21,000 FCFA**
- Prorated formula: `(remaining/total × 18500 + 2000) × 1.02`, rounded to nearest 500
- Admin email: mbachristian58@gmail.com

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npx tsx lib/firestore-init.ts` — Initialize Firestore data
