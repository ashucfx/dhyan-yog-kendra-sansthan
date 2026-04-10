-- 0. ENABLE EXTENSIONS
create extension if not exists "pgcrypto";

-- 1. STORE SETTINGS
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null default 'INR',
  currency_symbol text not null default 'Rs.',
  support_email text not null,
  support_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PROFILES (USER DATA)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. ADDRESSES (USER SHIPPING)
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. COMMERCE BASE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_slug text not null references public.categories(slug) on update cascade,
  name text not null,
  sku text not null unique,
  short_description text not null,
  description text,
  badge text,
  image_url text not null,
  gallery jsonb not null default '[]'::jsonb,
  base_price integer not null check (base_price >= 0),
  sale_price integer not null check (sale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  video_url text,
  benefits jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null,
  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value integer not null check (discount_value >= 0),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. ORDERS & SHIPMENTS
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status text not null,
  fulfillment_status text not null,
  payment_provider text not null,
  payment_status text not null,
  payment_reference text,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  shipping integer not null default 0 check (shipping >= 0),
  tax integer not null default 0 check (tax >= 0),
  total integer not null check (total >= 0),
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  shipping_meta jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total_price integer not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  partner text not null,
  awb text,
  status text not null,
  tracking_url text,
  label_url text,
  pickup_scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. CART & COUPONS
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value integer not null check (discount_value >= 0),
  minimum_order_amount integer not null default 0 check (minimum_order_amount >= 0),
  usage_limit integer,
  usage_count integer not null default 0,
  max_discount_amount integer,
  per_user_limit integer,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. ENABLE RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.shipments enable row level security;
alter table public.store_settings enable row level security;
alter table public.product_reviews enable row level security;
alter table public.offers enable row level security;

-- 8. POLICIES
-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Addresses: Users can manage their own addresses
create policy "Users can view own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "Users can insert own addresses" on public.addresses for insert with check (auth.uid() = user_id);
create policy "Users can update own addresses" on public.addresses for update using (auth.uid() = user_id);
create policy "Users can delete own addresses" on public.addresses for delete using (auth.uid() = user_id);

-- Products & Categories: Public read access
create policy "Public read products" on public.products for select using (true);
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read reviews" on public.product_reviews for select using (true);
create policy "Public read offers" on public.offers for select using (true);

-- Orders: Users can view their own orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can view own order items" on public.order_items for select using (exists (
  select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
));

-- Cart: Users manage their own cart
create policy "Users can manage own cart" on public.cart_items for all using (auth.uid() = user_id);

-- 9. SERVICE ROLE (ADMIN BYPASS)
-- The server-side code uses the service role key, which bypasses RLS.
-- This is necessary for image uploads, full order management, etc.

-- 10. TRIGGER FOR NEW PROFILES
-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
