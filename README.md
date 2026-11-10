# Efie Wura Pro

Rental management for Ghana: properties, units, tenants, tenancy agreements with e-signature, rent and bills paid by MoMo or card, an owner wallet with withdrawals to MoMo or bank, repairs, expenses, SMS and reports. Every owner's company gets its own logo, colours and fonts.

**Live app:** https://nyamebabaku-lab.github.io/efiewura/ · **Demo:** https://nyamebabaku-lab.github.io/efiewura/demo/ · Setup: [docs/live-setup.md](docs/live-setup.md)

## Demo roles
| Role | Who | What to try |
|---|---|---|
| Property Owner | Ama · Adom Properties Ltd | Dashboard, wallet → Withdraw (code 123456), Settings → Branding |
| New Owner | Kwesi Mensah | First-login branding wizard (company name + logo are required) |
| Property Manager | Kofi | Sees only assigned properties, no wallet |
| Tenant | Efua · Adom Court A2 | Pay rent by MoMo, receipt, sign tenancy, report a repair |
| Super Admin | Efie Wura HQ | Approve owners and large payouts, set fees and plans |

Phase 1 runs entirely in the browser (data in localStorage, simulated payments and SMS). A MoMo number ending in 000 or a card ending in 0002 is declined.

## Develop
```bash
npm install
npm run dev        # live app (needs .env.local with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
npm run dev:demo   # demo with sample data
```

## Stack
React + Vite + Tailwind, Zustand (persisted), Recharts, PWA (installable on Android, iPhone, desktop). HashRouter, so it runs on GitHub Pages. Every push to `main` deploys via GitHub Actions.

## Code map
- `src/data/seed.js` – demo data (relative to today) · `src/data/store.js` – all actions (swap point for the Phase 2 backend)
- `src/lib/billing.js` – rent cycles → invoices, allocation, wallet maths · `src/lib/theme.js` – owner branding → CSS variables
- `src/modules/owner|tenant|admin|shared|public` – screens

## Next phases
2. Supabase backend (auth, multi-owner data, row-level security), Paystack collections + transfers, mNotify SMS.
3. Android APKs (Tenant + Owner) via Capacitor; iPhone uses the installable web app.
