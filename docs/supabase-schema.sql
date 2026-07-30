create extension if not exists pgcrypto;

create table if not exists public.catalog_products (
  slug text primary key,
  display_name text not null,
  full_name text not null,
  status text not null default 'in_stock',
  price_vial text not null default '',
  inventory_on_hand integer,
  low_stock_threshold integer,
  promo_label text not null default '',
  promo_detail text not null default '',
  public_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table if exists public.catalog_products add column if not exists sku text not null default '';
alter table if exists public.catalog_products add column if not exists strength_value numeric not null default 0;
alter table if exists public.catalog_products add column if not exists unit text not null default 'mg';
alter table if exists public.catalog_products add column if not exists collection text not null default 'peptides';
alter table if exists public.catalog_products add column if not exists research_category text not null default 'General Research';
alter table if exists public.catalog_products add column if not exists format_type text not null default 'vial';
alter table if exists public.catalog_products add column if not exists summary_short text not null default '';
alter table if exists public.catalog_products add column if not exists summary_full text not null default '';
alter table if exists public.catalog_products add column if not exists research_focus_points jsonb not null default '[]'::jsonb;
alter table if exists public.catalog_products add column if not exists listing_notes jsonb not null default '[]'::jsonb;
alter table if exists public.catalog_products add column if not exists coa_not_required boolean not null default false;
alter table if exists public.catalog_products add column if not exists variant_group text;
alter table if exists public.catalog_products add column if not exists variant_label text;
alter table if exists public.catalog_products add column if not exists custom_product boolean not null default false;
alter table if exists public.catalog_products add column if not exists archived boolean not null default false;
alter table if exists public.catalog_products add column if not exists featured boolean not null default false;
alter table if exists public.catalog_products add column if not exists featured_order integer;

create table if not exists public.manual_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'submitted',
  payment_method text not null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address_json jsonb not null,
  billing_address_json jsonb not null,
  order_json jsonb not null,
  payment_proof_status text not null default 'not_received',
  notes text,
  fulfillment_notes text,
  tracking_carrier text,
  tracking_number text,
  package_details text,
  shipment_photo_url text,
  fulfillment_updated_at timestamptz,
  inventory_change_json jsonb,
  inventory_adjusted_at timestamptz
);

alter table if exists public.manual_orders add column if not exists inventory_change_json jsonb;
alter table if exists public.manual_orders add column if not exists inventory_adjusted_at timestamptz;
alter table if exists public.manual_orders add column if not exists affiliate_id uuid;
alter table if exists public.manual_orders add column if not exists affiliate_code text;
alter table if exists public.manual_orders add column if not exists affiliate_name text;
alter table if exists public.manual_orders add column if not exists affiliate_source text;
alter table if exists public.manual_orders add column if not exists affiliate_landing_path text;
alter table if exists public.manual_orders add column if not exists package_type text;
alter table if exists public.manual_orders add column if not exists label_document_name text;
alter table if exists public.manual_orders add column if not exists label_document_url text;
alter table if exists public.manual_orders add column if not exists label_document_type text;
alter table if exists public.manual_orders add column if not exists label_extraction_json jsonb;

create table if not exists public.payment_proofs (
  id text primary key,
  order_id text not null references public.manual_orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  payment_method text not null,
  amount_paid numeric(10, 2) not null default 0,
  transaction_reference text,
  notes text,
  screenshot_name text,
  screenshot_url text,
  status text not null default 'submitted'
);

create index if not exists payment_proofs_order_id_idx on public.payment_proofs(order_id);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id text references public.manual_orders(id) on delete cascade,
  source text not null,
  message_type text not null,
  message_text text,
  file_url text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.site_promos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  promo_kind text not null default 'sitewide',
  placement text not null default 'banner',
  scope text not null default 'sitewide',
  target_slug text,
  target_slugs jsonb,
  badge_label text not null default '',
  popup_image_url text not null default '',
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table if exists public.site_promos add column if not exists promo_kind text not null default 'sitewide';
alter table if exists public.site_promos add column if not exists placement text not null default 'banner';
alter table if exists public.site_promos add column if not exists target_slugs jsonb;
alter table if exists public.site_promos add column if not exists badge_label text not null default '';
alter table if exists public.site_promos add column if not exists updated_at timestamptz not null default now();
alter table if exists public.site_promos add column if not exists discount_type text not null default 'announcement';
alter table if exists public.site_promos add column if not exists discount_percent integer;
alter table if exists public.site_promos add column if not exists buy_quantity integer not null default 1;
alter table if exists public.site_promos add column if not exists get_quantity integer not null default 1;
alter table if exists public.site_promos add column if not exists placements jsonb not null default '[]'::jsonb;
alter table if exists public.site_promos add column if not exists target_family_keys jsonb not null default '[]'::jsonb;
alter table if exists public.site_promos add column if not exists target_vial_case_ids jsonb not null default '[]'::jsonb;
alter table if exists public.site_promos add column if not exists popup_image_url text not null default '';

update public.catalog_products
set collection = 'topicals'
where collection = 'serums';

update public.catalog_products
set collection = 'water'
where collection = 'other';

update public.catalog_products
set coa_not_required = true
where collection = 'water'
   or lower(display_name) like '%glutathione%'
   or lower(full_name) like '%glutathione%';

update public.site_promos
set
  discount_type = case when placement = 'free_shipping' then 'free_shipping' else coalesce(nullif(discount_type, ''), 'announcement') end,
  placements = case
    when jsonb_array_length(coalesce(placements, '[]'::jsonb)) > 0 then placements
    when placement = 'product_badge' then '["product"]'::jsonb
    when placement = 'free_shipping' then '["banner", "checkout"]'::jsonb
    when placement = 'popup' then '["popup"]'::jsonb
    else '["banner"]'::jsonb
  end
where placements is null or jsonb_array_length(coalesce(placements, '[]'::jsonb)) = 0;

create table if not exists public.email_automation_settings (
  key text primary key,
  subject text not null,
  body_text text not null,
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_sender_settings (
  id text primary key,
  business_name text not null default '',
  sender_name text not null default '',
  sender_email text not null default '',
  reply_to_email text not null default '',
  provider_label text not null default 'Resend',
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_purchase_logs (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.catalog_products(slug) on delete cascade,
  product_name text not null,
  strength_label text not null,
  vendor_name text not null default '',
  status text not null default 'ordered',
  vial_quantity integer not null default 0,
  kit_quantity integer not null default 0,
  units_per_kit integer not null default 10,
  quantity_ordered integer not null default 0,
  ordered_on date not null,
  price_per_vial numeric(10, 2) not null default 0,
  price_per_kit numeric(10, 2) not null default 0,
  cost_paid numeric(10, 2) not null default 0,
  arrived_at timestamptz,
  inventory_applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inventory_purchase_logs_slug_idx on public.inventory_purchase_logs(slug);

alter table public.inventory_purchase_logs add column if not exists vendor_name text not null default '';
alter table public.inventory_purchase_logs add column if not exists status text not null default 'ordered';
alter table public.inventory_purchase_logs add column if not exists vial_quantity integer not null default 0;
alter table public.inventory_purchase_logs add column if not exists kit_quantity integer not null default 0;
alter table public.inventory_purchase_logs add column if not exists units_per_kit integer not null default 10;
alter table public.inventory_purchase_logs add column if not exists price_per_vial numeric(10, 2) not null default 0;
alter table public.inventory_purchase_logs add column if not exists price_per_kit numeric(10, 2) not null default 0;
alter table public.inventory_purchase_logs add column if not exists arrived_at timestamptz;
alter table public.inventory_purchase_logs add column if not exists inventory_applied_at timestamptz;

create table if not exists public.vial_cases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_label text not null default '',
  price_amount numeric(10, 2) not null default 0,
  image_url text,
  image_source text not null default 'none',
  image_gallery jsonb not null default '[]'::jsonb,
  public_visible boolean not null default true,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.vial_cases add column if not exists description text not null default '';
alter table if exists public.vial_cases add column if not exists price_label text not null default '';
alter table if exists public.vial_cases add column if not exists price_amount numeric(10, 2) not null default 0;
alter table if exists public.vial_cases add column if not exists image_url text;
alter table if exists public.vial_cases add column if not exists image_source text not null default 'none';
alter table if exists public.vial_cases add column if not exists image_gallery jsonb not null default '[]'::jsonb;
alter table if exists public.vial_cases add column if not exists public_visible boolean not null default true;
alter table if exists public.vial_cases add column if not exists archived boolean not null default false;
alter table if exists public.vial_cases add column if not exists sort_order integer not null default 0;
alter table if exists public.vial_cases add column if not exists updated_at timestamptz not null default now();

insert into public.vial_cases (id, name, description, price_label, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', '3ml single vial', 'Single 3ml vial presentation case.', '$2 each', 10),
  ('00000000-0000-0000-0000-000000000102', '3ml diamond cut', 'Diamond-cut 3ml case option.', '$5 each', 20),
  ('00000000-0000-0000-0000-000000000103', '3ml 4 ct', 'Four-count 3ml vial case.', '$8', 30),
  ('00000000-0000-0000-0000-000000000104', '3ml 10 ct', 'Ten-count 3ml vial case.', '$12', 40),
  ('00000000-0000-0000-0000-000000000105', '3ml 20 ct', 'Twenty-count 3ml vial case.', '$20', 50),
  ('00000000-0000-0000-0000-000000000106', '10ml diamond cut', 'Diamond-cut 10ml case option.', '$8 each', 60),
  ('00000000-0000-0000-0000-000000000107', 'Larger cases', 'Large vial case option.', '$35', 70)
on conflict (id) do nothing;

update public.vial_cases
set price_amount = coalesce(nullif(regexp_replace(price_label, '[^0-9.]', '', 'g'), '')::numeric, price_amount)
where price_amount = 0
  and price_label <> '';

create table if not exists public.app_settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  code text not null unique,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
