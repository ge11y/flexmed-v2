begin;

alter table if exists public.site_promos
  add column if not exists discount_type text not null default 'announcement',
  add column if not exists discount_percent integer,
  add column if not exists buy_quantity integer not null default 1,
  add column if not exists get_quantity integer not null default 1,
  add column if not exists placements jsonb not null default '[]'::jsonb,
  add column if not exists target_family_keys jsonb not null default '[]'::jsonb,
  add column if not exists target_vial_case_ids jsonb not null default '[]'::jsonb,
  add column if not exists popup_image_url text not null default '';

alter table if exists public.site_promos
  alter column target_slugs set default '[]'::jsonb;

update public.site_promos
set target_slugs = '[]'::jsonb
where target_slugs is null;

update public.site_promos
set
  discount_type = case
    when placement = 'free_shipping' then 'free_shipping'
    else coalesce(nullif(discount_type, ''), 'announcement')
  end,
  placements = case
    when jsonb_typeof(placements) = 'array' and jsonb_array_length(placements) > 0 then placements
    when placement = 'product_badge' then '["product"]'::jsonb
    when placement = 'free_shipping' then '["banner", "checkout"]'::jsonb
    when placement = 'popup' then '["popup"]'::jsonb
    else '["banner"]'::jsonb
  end;

create index if not exists site_promos_active_schedule_idx
  on public.site_promos (is_active, starts_at, ends_at, updated_at desc);

commit;

notify pgrst, 'reload schema';

select
  current_database() as database_name,
  to_regclass('public.site_promos') as promo_table,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_promos'
      and column_name = 'buy_quantity'
  ) as has_buy_quantity,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_promos'
      and column_name = 'get_quantity'
  ) as has_get_quantity,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_promos'
      and column_name = 'popup_image_url'
  ) as has_popup_image_url;
