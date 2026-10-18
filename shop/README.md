# Urban Thread — Contemporary Fashion Studio & E-Commerce

A luxury, editorial-grade clothing store web application built with **React 18 + Vite + Supabase**.

---

## 🌟 Key Features & Redesign Highlights

- **Editorial Luxury Aesthetics**: Curated high-resolution fashion photography, typography pairing with *Playfair Display* and *Plus Jakarta Sans*, sleek obsidian/champagne gold accents, and fluid responsive layouts.
- **Active Native Authentication**: Dedicated `/login` and `/signup` page with email validation, show/hide password toggle, and instant **1-Click Demo Login** buttons.
- **Member Account & Orders Portal**: Dedicated `/account` page displaying order history with status pills, saved wardrobe wishlist, and editable delivery profile for 1-click checkout.
- **Interactive Slide-Out Bag (Cart Drawer)**: Seamless side-drawer with live quantity adjustments, free express shipping meter (unlocked at $75), and promo coupon code validation (try `URBAN15` for 15% off).
- **Comprehensive Catalogue & Filters**: Filter by gender (Women / Men), category, size, color, max price, and dynamic sorting (Newest, Price, Rating) with instant autocomplete search.
- **Product Details Page (PDP)**: Multi-angle high-resolution gallery, interactive color swatches, size selector with sold-out flags, quantity stepper, expandable garment care accordions, and related pieces recommendations.
- **Studio Admin Workspace**: KPI dashboard (Revenue, Orders, Garment count, AOV), inline price editing, garment creation & edit form, order status management (Pending, Contacted, Paid, Delivered), and direct WhatsApp customer messaging.

---

## ⚡ Quick Start & Run Locally

```bash
cd shop
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔑 Demo Login & Admin Credentials

You can test all customer and administrator features immediately without needing to configure a database first.

### Fast 1-Click Access
On the `/login` or `/admin` page, simply click:
- **"⚡ Demo Customer"**: Automatically signs you in as a customer with sample orders and saved shipping profile.
- **"⚡ Demo Admin"**: Instantly enters the studio control panel.

### Manual Credentials
| Account Role | Email | Password | Access Route |
| :--- | :--- | :--- | :--- |
| **Store Admin** | `admin@urbanthread.com` | `admin2026` | `/admin` or via logo 5-tap |
| **VIP Customer** | `customer@urbanthread.com` | `demo1234` | `/login` → `/account` |

*Note: You can also access the admin page at any time by tapping the **Urban Thread** logo 5 times in rapid succession.*

---

## 🌿 Supabase Configuration (Optional)

The application features auto-detecting dual-mode:
- **Cloud Mode**: When valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, it connects to your live Supabase database.
- **Standalone Mode**: Runs gracefully with full local state persistence in localStorage if Supabase is offline or not yet configured.

### Environment Variables (`.env`)
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-jwt-key>
VITE_ADMIN_PATH=/admin
VITE_SELLER_WHATSAPP=2340000000000
```
*(Ensure `VITE_SUPABASE_URL` does not have `/rest/v1` appended; the client handles the proper root URL).*

---

## 🚀 Production Build

To bundle the application for production:
```bash
npm run build
npm run preview
```
All routes (`/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/login`, `/signup`, `/account`, `/admin`) are pre-configured for client-side routing and Vercel deployment via `vercel.json`.
