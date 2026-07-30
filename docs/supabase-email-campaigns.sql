-- FlexMed Resend marketing email campaigns.
-- Run this once in the Supabase SQL Editor before using the campaign panel.

create extension if not exists pgcrypto;

create table if not exists public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  is_subscribed boolean not null default false,
  source text not null default 'account',
  unsubscribe_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_subscribers_active_idx
  on public.marketing_subscribers (is_subscribed, updated_at desc);

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  body_text text not null,
  status text not null default 'draft',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint email_campaigns_status_check check (status in ('draft', 'sending', 'sent', 'failed'))
);

create table if not exists public.email_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  subscriber_id uuid references public.marketing_subscribers(id) on delete set null,
  email text not null,
  resend_id text,
  status text not null default 'sent',
  error_message text,
  sent_at timestamptz not null default now(),
  constraint email_campaign_sends_status_check check (status in ('sent', 'failed'))
);

create index if not exists email_campaign_sends_campaign_idx
  on public.email_campaign_sends (campaign_id, sent_at desc);

alter table public.marketing_subscribers enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_campaign_sends enable row level security;

-- These tables are accessed through server routes with the Supabase service role.
-- No public client policy is intentionally created.
