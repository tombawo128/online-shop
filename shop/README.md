# Urban Thread — Fashion Store

Urban Thread is a responsive fashion storefront for women's and men's clothing, built with React, Vite and Supabase.

## Current capabilities

- Database-backed product catalogue, search, category filters and sorting
- Product detail pages with colour and size selection
- Cart, wishlist, checkout and WhatsApp order handoff
- Customer accounts, private delivery profiles and order history
- Administrator workspace for products, orders, stock and review moderation
- Supabase Storage product image uploads with type and size validation
- Server-validated order creation and database-calculated totals
- Variant-level stock tracking with atomic stock decrement and restoration on cancellation
- Verified-purchase customer reviews with administrator moderation
- Newsletter subscriber capture
- Accessible form labels, validation, and loading/error feedback

**Payments:** No payment gateway is connected. Orders are recorded as pending; customers arrange payment separately with the store. WhatsApp is an order-contact channel, not a payment processor.

## Local development

Requirements: Node.js 20.19+ (or 22+) and npm.

```bash
cd shop
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Environment variables

Create `.env` in the `shop` directory:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_SELLER_WHATSAPP=2340000000000
VITE_ADMIN_PATH=/admin
```

The publishable/anon key is intended for browser use. Never put a Supabase service-role or secret key in a `VITE_*` variable or client-side code. Database Row Level Security and trusted database functions enforce access.

## Supabase setup

Use a dedicated Supabase project for Urban Thread. For a new project:

1. Run `shop/supabase.sql` once in the Supabase SQL Editor to create the base schema.
2. Apply the migration files in `shop/supabase/migrations/` in filename order.
3. In the SQL Editor, authorize the exact owner email (replace the example):

   ```sql
   insert into public.store_admin_setup (singleton, authorized_email)
   values (true, lower('owner@example.com'));
   ```

4. Create the account through storefront signup using that email and confirm it.
5. Sign in and visit `/admin` to claim the one-time administrator slot.
6. Add real products and stock through the administrator workspace.

The database allows one permanent administrator claim. The owner email must be authorized privately before signup; public users cannot grant themselves administrator access.

For an existing database, inspect the migrations against the live schema before applying them. Do not rerun the bootstrap SQL against a populated production catalogue.

## Data and security model

- Active products are publicly readable; product writes require the database-verified administrator role.
- Orders are readable by their owner and administrators. Direct browser inserts are revoked; the `place_store_order` function validates products, variants, quantities, discounts and shipping, then calculates authoritative totals.
- Inventory is decremented in the same transaction as order creation and restored when an eligible order is cancelled.
- Customer delivery profiles are private to their authenticated owner.
- Reviews require a qualifying purchase and remain pending until administrator approval.
- Product images are publicly readable; upload, update and delete operations require administrator access. Uploads are limited to 5 MB and JPEG, PNG, WEBP or AVIF.
- Newsletter addresses can be submitted publicly; only administrators can read the subscriber list.

## Quality checks

Run from the `shop` directory:

```bash
npm run test
npm run build
# Run both checks:
npm run check
```

GitHub Actions runs the test and build checks on pushes and pull requests.

## Deployment

Configure the Vercel project with `shop` as its Root Directory. Add the environment variables above to the required deployment environments. Apply and verify the Supabase migrations before enabling the updated storefront.

Release checks should include:
- Production build and automated tests
- Supabase RLS and database-function review
- Owner signup and one-time administrator claim
- Customer authentication and order ownership
- Order total validation and inventory decrement/restoration
- Product image upload and access control
- Mobile and desktop storefront checks

## Explicitly not included

- Payment gateway or card processing
- Automated email campaigns/newsletter provider
- Browser-only demo catalogue or demo administrator credentials
