# Urban Thread

A responsive, Supabase-backed fashion storefront built with React and Vite.

The production implementation, setup instructions, database security model, environment configuration, quality checks and deployment checklist are maintained in **[shop/README.md](shop/README.md)**.

## Project structure

- `shop/` — application source, Supabase schema and migrations, tests, and Vercel configuration
- `.github/workflows/` — automated checks for pull requests and pushes

## Current release scope

- Database-backed catalogue, customer accounts, checkout and order history
- Administrator-managed products, inventory, orders and review moderation
- WhatsApp order contact
- No payment gateway is included; orders remain pending until payment is arranged separately

## Local development

```bash
cd shop
npm ci
npm run dev
```

See the [application README](shop/README.md) before configuring Supabase or deploying. Never expose a Supabase service-role key in browser code.
