-- Customer dashboard: documents (DigiLocker status), car reviews, saved addresses, referrals,
-- and coupon visibility/ownership.
--
-- NOT APPLIED AUTOMATICALLY. Review, then run once in the Supabase SQL editor (or `supabase db push`).
-- Until it runs, the dashboard shows these sections as "being set up" — nothing else breaks.
--
-- Access: every table has row level security ON with no public policies. Only the server
-- (app/api/dashboard/*, using the service role after verifying the user's login token) reads or
-- writes them, always filtered to that user.

begin;

-- 1. Documents verified through DigiLocker (renters). Shown read-only on the Documents page.
--    Aadhaar: verified yes/no and the LAST 4 DIGITS only (UIDAI allows masked display only; the
--    full number is never stored). Licence number stored masked (first 4 + last 4 characters).
create table if not exists public.customer_kyc (
  user_id uuid primary key references public.users(id) on delete cascade,
  dl_verified boolean not null default false,
  dl_number_masked text,
  aadhaar_verified boolean not null default false,
  aadhaar_last4 text check (aadhaar_last4 is null or aadhaar_last4 ~ '^[0-9]{4}$'),
  name_on_record text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.customer_kyc enable row level security;

-- 2. Car reviews: one per completed booking, editable by its author.
create table if not exists public.car_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id text not null unique,
  vehicle_id bigint not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists car_reviews_user_idx on public.car_reviews (user_id);
create index if not exists car_reviews_vehicle_idx on public.car_reviews (vehicle_id);
alter table public.car_reviews enable row level security;

-- 3. Saved addresses (Home, Work, …). One default per user; the default is also copied to
--    customers.address so checkout keeps working as before.
create table if not exists public.customer_addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 30),
  address text not null check (char_length(address) between 5 and 300),
  landmark text check (landmark is null or char_length(landmark) <= 120),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses (user_id);
create unique index if not exists customer_addresses_one_default
  on public.customer_addresses (user_id) where is_default;
alter table public.customer_addresses enable row level security;

-- 4. Referrals: you and your friend each get a ₹200 coupon once your friend completes their
--    first trip. A friend joins through mmmiles.com/?ref=CODE and counts only on a first login.
create table if not exists public.referral_codes (
  user_id uuid primary key references public.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{6,12}$'),
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;

create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_id uuid not null unique references public.users(id) on delete cascade,
  status text not null default 'joined' check (status in ('joined', 'rewarded')),
  referrer_coupon text,
  referred_coupon text,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
alter table public.referrals enable row level security;

-- 5. Coupons
--    show_in_dashboard: public offers listed under "My coupons" (off by default, so internal or
--    private codes never appear). assigned_user_id: personal coupons (referral rewards) that only
--    their owner can apply — checkout enforces this.
alter table public.coupons add column if not exists show_in_dashboard boolean not null default false;
alter table public.coupons add column if not exists assigned_user_id uuid references public.users(id) on delete cascade;
create index if not exists coupons_assigned_user_idx on public.coupons (assigned_user_id) where assigned_user_id is not null;

-- No codes are listed yet. The first-trip ₹350 and the free hour are automatic (lib/offers.js),
-- so a separate first-trip code would compete with them. To list a public offer later:
--   update public.coupons set show_in_dashboard = true where code = 'YOURCODE';

commit;

-- Note for referral rewards: the server creates them in public.coupons as a ₹200 flat discount,
-- single use, usage_limit 1, no expiry, copying discount_type from an existing flat coupon. If the
-- coupons table has other required columns without defaults, the reward stays pending (the server
-- logs the error) and is retried on the next dashboard visit.
