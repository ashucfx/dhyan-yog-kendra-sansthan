create extension if not exists "pgcrypto";

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null default 'INR',
  currency_symbol text not null default 'Rs.',
  support_email text not null,
  support_phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  line1 text not null,
  landmark text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value integer not null check (discount_value >= 0),
  minimum_order_amount integer not null default 0 check (minimum_order_amount >= 0),
  usage_limit integer,
  usage_count integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

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

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  status text not null check (status in ('created', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
  amount integer not null check (amount >= 0),
  currency_code text not null default 'INR',
  provider_order_id text,
  provider_payment_id text,
  failure_code text,
  failure_message text,
  payload jsonb not null default '{}'::jsonb,
  attempted_at timestamptz not null default now(),
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses add column if not exists landmark text;

create index if not exists products_category_slug_idx on public.products(category_slug);
create index if not exists products_featured_idx on public.products(featured);
create index if not exists addresses_user_id_idx on public.addresses(user_id);
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists admin_users_role_idx on public.admin_users(role);
create index if not exists payment_records_order_id_idx on public.payment_records(order_id);
create index if not exists payment_records_user_id_idx on public.payment_records(user_id);
create unique index if not exists payment_records_provider_payment_id_idx on public.payment_records(provider_payment_id) where provider_payment_id is not null;
create index if not exists shipments_order_id_idx on public.shipments(order_id);
create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_reviews enable row level security;
alter table public.offers enable row level security;
alter table public.coupons enable row level security;
alter table public.admin_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_records enable row level security;
alter table public.shipments enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "addresses_manage_own" on public.addresses;
create policy "addresses_manage_own" on public.addresses
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
for select to anon, authenticated
using (true);

drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active" on public.products
for select to anon, authenticated
using (active = true);

drop policy if exists "offers_public_read_active" on public.offers;
create policy "offers_public_read_active" on public.offers
for select to anon, authenticated
using (active = true);

drop policy if exists "coupons_authenticated_read" on public.coupons;
create policy "coupons_authenticated_read" on public.coupons
for select to authenticated
using (true);

drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read" on public.product_reviews
for select to anon, authenticated
using (true);

drop policy if exists "product_reviews_authenticated_insert" on public.product_reviews;
create policy "product_reviews_authenticated_insert" on public.product_reviews
for insert to authenticated
with check (true);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "shipments_select_own" on public.shipments;
create policy "shipments_select_own" on public.shipments
for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = shipments.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "cart_items_manage_own" on public.cart_items;
create policy "cart_items_manage_own" on public.cart_items
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own" on public.admin_users
for select to authenticated
using (auth.uid() = id);

drop policy if exists "payment_records_select_own" on public.payment_records;
create policy "payment_records_select_own" on public.payment_records
for select to authenticated
using (auth.uid() = user_id);

create or replace function public.create_order_with_payment(
  p_order_id text,
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_status text,
  p_fulfillment_status text,
  p_payment_provider text,
  p_payment_status text,
  p_subtotal integer,
  p_discount integer,
  p_shipping integer,
  p_total integer,
  p_coupon_code text,
  p_shipping_address jsonb,
  p_items jsonb,
  p_payment_reference text default null,
  p_currency_code text default 'INR'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_payment_id uuid;
begin
  insert into public.orders (
    id, user_id, customer_name, customer_email, customer_phone, status, fulfillment_status, payment_provider,
    payment_status, payment_reference, subtotal, discount, shipping, total, coupon_code, shipping_address
  )
  values (
    p_order_id, p_user_id, p_customer_name, p_customer_email, p_customer_phone, p_status, p_fulfillment_status,
    p_payment_provider, p_payment_status, p_payment_reference, p_subtotal, p_discount, p_shipping, p_total,
    p_coupon_code, coalesce(p_shipping_address, '{}'::jsonb)
  );

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.order_items (
      id, order_id, product_id, product_name, sku, quantity, unit_price, total_price
    )
    values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      p_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      v_item->>'sku',
      greatest((v_item->>'quantity')::integer, 1),
      greatest((v_item->>'unit_price')::integer, 0),
      greatest((v_item->>'total_price')::integer, 0)
    );
  end loop;

  insert into public.payment_records (
    order_id, user_id, provider, status, amount, currency_code, payload
  )
  values (
    p_order_id, p_user_id, p_payment_provider, p_payment_status, p_total, coalesce(nullif(p_currency_code, ''), 'INR'),
    jsonb_build_object('source', 'checkout')
  )
  returning id into v_payment_id;

  update public.orders
  set payment_reference = coalesce(
    p_payment_reference,
    jsonb_build_object('provider', p_payment_provider, 'paymentRecordId', v_payment_id, 'mode', 'gateway')::text
  )
  where id = p_order_id;

  return jsonb_build_object('payment_record_id', v_payment_id);
end;
$$;

create or replace function public.finalize_payment_capture(
  p_order_id text,
  p_payment_record_id uuid,
  p_provider text,
  p_external_order_id text default null,
  p_external_payment_id text default null,
  p_payment_status text default 'captured',
  p_order_status text default 'paid',
  p_payment_reference text default null,
  p_failure_code text default null,
  p_failure_message text default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payment_records%rowtype;
  v_item record;
  v_rows integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order was not found.';
  end if;

  select * into v_payment
  from public.payment_records
  where id = p_payment_record_id and order_id = p_order_id
  for update;
  if not found then
    raise exception 'Payment record was not found.';
  end if;

  if v_order.payment_provider <> p_provider or v_payment.provider <> p_provider then
    raise exception 'Payment provider mismatch for this order.';
  end if;

  if v_payment.status = 'captured' or v_order.payment_status = 'captured' then
    return jsonb_build_object('order_id', p_order_id, 'payment_record_id', p_payment_record_id, 'already_processed', true);
  end if;

  if p_payment_status <> 'captured' then
    update public.payment_records
    set
      status = p_payment_status,
      provider_order_id = coalesce(p_external_order_id, provider_order_id),
      provider_payment_id = coalesce(p_external_payment_id, provider_payment_id),
      failure_code = p_failure_code,
      failure_message = p_failure_message,
      payload = coalesce(payload, '{}'::jsonb) || coalesce(p_payload, '{}'::jsonb),
      updated_at = now()
    where id = p_payment_record_id;

    update public.orders
    set
      payment_status = p_payment_status,
      status = p_order_status,
      payment_reference = coalesce(p_payment_reference, payment_reference),
      updated_at = now()
    where id = p_order_id;

    return jsonb_build_object('order_id', p_order_id, 'payment_record_id', p_payment_record_id, 'status', p_payment_status);
  end if;

  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id
  loop
    update public.products
    set stock = stock - v_item.quantity, updated_at = now()
    where id = v_item.product_id and stock >= v_item.quantity;

    get diagnostics v_rows = row_count;
    if v_rows = 0 then
      raise exception 'One or more ordered products are no longer in stock.';
    end if;
  end loop;

  if v_order.coupon_code is not null then
    update public.coupons
    set usage_count = usage_count + 1
    where code = v_order.coupon_code
      and active = true
      and (usage_limit is null or usage_count < usage_limit);
  end if;

  update public.payment_records
  set
    status = 'captured',
    provider_order_id = coalesce(p_external_order_id, provider_order_id),
    provider_payment_id = coalesce(p_external_payment_id, provider_payment_id),
    failure_code = null,
    failure_message = null,
    payload = coalesce(payload, '{}'::jsonb) || coalesce(p_payload, '{}'::jsonb),
    captured_at = now(),
    updated_at = now()
  where id = p_payment_record_id;

  update public.orders
  set
    payment_status = 'captured',
    status = p_order_status,
    fulfillment_status = 'processing',
    payment_reference = coalesce(p_payment_reference, payment_reference),
    updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'payment_record_id', p_payment_record_id, 'status', 'captured');
end;
$$;
