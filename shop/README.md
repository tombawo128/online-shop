# Urban Thread — Fashion Store

Urban Thread is a responsive fashion e-commerce storefront for women's and men's clothing, built with React, Vite and Supabase.

## Features

- Editorial storefront, product catalogue, search, category filters and sorting
- Product detail pages with colour and size selection
- Cart, wishlist, delivery checkout and WhatsApp order handoff
- Customer accounts, private delivery profiles and order history
- Administrator workspace for products, orders, stock and review moderation
- Supabase Storage product image uploads with type and size validation
- Server-validated order creation and database-calculated totals
- Variant-level stock tracking with atomic stock decrement during order placement and automatic restoration on cancellation
- Verified-purchase customer reviews with administrator moderation
- Newsletter subscriber capture
- Accessible form labels, validation and loading/error feedback

**Payment gateway:** intentionally not included. Orders are recorded as pending and the customer can contact the store through WhatsApp to arrange payment separately.

## Local development

Use Node.js 20.19+ or 22+.

```bash
cd shop
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Environment configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_SELLER_WHATSAPP=2340000000000
VITE_ADMIN_PATH=/admin
```

The browser key is public by design. **Never put a Supabase service-role key in a `VITE_*` variable or browser code.** All access is controlled by database RLS and trusted database functions.

## Supabase setup

For a new project:

1. Run `shop/supabase.sql` once in the Supabase SQL Editor to create the base tables and optional sample catalogue.
2. Run every SQL file in `shop/supabase/migrations/` in filename order.
3. Create the owner account through the storefront and confirm its email.
4. Sign in with that account and visit `/admin` to claim the one-time administrator setup. The database allows exactly one claim; the setup cannot be repeated from the public website.

For an existing project, review the migration against the live schema and apply the migration file. Do not rerun the bootstrap seed script against a populated production catalogue.

### One-time administrator setup\n\nThe first administrator is claimed from the signed-in account at `/admin` after all migrations are applied. The `claim_first_store_admin()` database function serializes concurrent attempts and permanently records the winning account in `public.store_admin_claim`. No administrator registration option is exposed on the public signup page.\n\n### Database protections

- Products are publicly readable only while active; product writes require the database-verified administrator role.
- Orders are readable by their owner and administrators. Direct browser inserts are revoked; the `place_store_order` function validates products, variants, quantities, discounts and shipping and calculates the authoritative totals.
- Tracked inventory is decremented in the same database transaction as order creation.
- Customer delivery profiles are private to their authenticated owner.
- Reviews can be submitted only by authenticated users with a paid or delivered order containing the product; new reviews remain pending until approved.
- Product images are publicly readable, while uploads, updates and deletes require an administrator role. Images are limited to 5 MB and JPEG, PNG, WEBP or AVIF.
- Newsletter addresses can be submitted publicly; only administrators can read the subscriber list.

## Quality checks

```bash
npm run test
npm run build
# or run both
npm run check
```

The GitHub Actions workflow runs the same checks on pushes and pull requests.

## Deployment

Set the Vercel project root directory to `shop`, configure the environment variables above for the correct environments, and deploy the branch preview first. Confirm that the Supabase migration has been applied before enabling the updated storefront.

The `shop/vercel.json` file configures SPA route fallback. Production deployment should follow a successful build, database policy review, authentication test, order validation test, inventory test and admin access test.

## Important operating notes

- No demo administrator credentials or client-side password registry are included.
- If Supabase is not configured, the storefront displays no products and clearly reports that the live catalogue is unavailable. It never substitutes a browser-only sample catalogue.
- Newsletter signups are stored; an email campaign provider is not connected.
- WhatsApp order handoff is not a payment processor.
