# FlexMed Supabase Admin Architecture

This is the direction for making the admin page the only operational interface founder and employees need to touch.

## Goal

Founder and employees should work from the FlexMed admin only:

- catalog availability
- live single-item prices
- inventory and low-stock warnings
- promo labels and offer details
- incoming and out-of-stock state
- order queue
- fulfilled orders
- payment proof review
- Jotform/manual-payment follow-up

The public marketplace should read the same source automatically.

## Recommended structure

Use Supabase for:

- Postgres tables
- file storage for payment proof uploads
- Row Level Security
- admin authentication
- realtime or server reads for storefront updates

## Core tables

### `catalog_products`

One row per storefront product/slug.

Suggested fields:

- `slug`
- `display_name`
- `full_name`
- `status`
- `price_vial`
- `inventory_on_hand`
- `low_stock_threshold`
- `promo_label`
- `promo_detail`
- `public_visible`
- `updated_at`

### `manual_orders`

One row per order.

Suggested fields:

- `id`
- `created_at`
- `status`
- `payment_method`
- `customer_first_name`
- `customer_last_name`
- `customer_email`
- `customer_phone`
- `shipping_address_json`
- `billing_address_json`
- `order_json`
- `payment_proof_status`
- `notes`

### `order_messages`

One row per proof-of-payment or customer follow-up.

Suggested fields:

- `id`
- `order_id`
- `source`
- `message_type`
- `message_text`
- `file_url`
- `status`
- `created_at`

### `site_promos`

Optional sitewide promo table.

Suggested fields:

- `id`
- `title`
- `detail`
- `scope`
- `target_slug`
- `is_active`
- `starts_at`
- `ends_at`

## Runtime model

The admin page should write to Supabase.
The public site should read from Supabase.

That means:

- founder changes price/inventory in admin
- storefront updates automatically
- orders appear in admin queue
- proof uploads attach to orders

## Suggested implementation order

1. Add Supabase project and env vars
2. Create `catalog_products` table
3. Move admin inventory writes from local draft to Supabase
4. Keep storefront reading the same rows
5. Add `manual_orders`
6. Add `order_messages` + storage bucket for payment proof
7. Add admin auth and role restrictions

## Why not make Sheets the main source

Sheets is fine for exports and backups, but not ideal as the operational backbone for:

- file uploads
- order status transitions
- inbox review
- employee access control
- product promos
- row-level security

So the better structure is:

`Admin Dashboard -> Supabase -> Public Marketplace`
