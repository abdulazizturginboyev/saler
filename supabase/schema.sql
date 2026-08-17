-- SALER ilovasi uchun Supabase sxemasi
-- Buni Supabase loyihangizda: SQL Editor -> New query -> shu faylni joylashtiring -> Run

create extension if not exists "pgcrypto";

-- TOVARLAR
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text default '',
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock numeric not null default 0,
  unit text not null default 'dona',
  min_stock numeric,
  image_url text,
  created_at timestamptz not null default now()
);

-- SOTUVLAR
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  total numeric not null default 0,
  profit numeric not null default 0,
  created_at timestamptz not null default now()
);

-- SOTUV TARKIBI (har bir sotuvdagi tovarlar)
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  qty numeric not null,
  price numeric not null,
  buy_price numeric not null default 0,
  total numeric not null
);

-- TOVAR KIRIMLARI
create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  qty numeric not null,
  buy_price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- QARZDORLAR
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text default '',
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

-- QARZ TO'LOVLARI
create table if not exists debt_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references debts(id) on delete cascade,
  amount numeric not null,
  created_at timestamptz not null default now()
);

-- XARAJATLAR
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY: har bir foydalanuvchi faqat o'z ma'lumotini ko'radi/o'zgartiradi
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table incomes enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;
alter table expenses enable row level security;

create policy "owner_all_products" on products for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_sales" on sales for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_sale_items" on sale_items for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_incomes" on incomes for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_debts" on debts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_debt_payments" on debt_payments for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner_all_expenses" on expenses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Tezkor qidiruv uchun indekslar
create index if not exists idx_products_owner on products(owner_id);
create index if not exists idx_sales_owner on sales(owner_id);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_debts_owner on debts(owner_id);
create index if not exists idx_expenses_owner on expenses(owner_id);

-- TOVAR RASMLARI UCHUN STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Faqat tizimga kirgan (login qilgan) foydalanuvchi rasm yuklay/o'zgartira/o'chira oladi
create policy "product_images_authenticated_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "product_images_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "product_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- Rasmlar ilova ichida ko'rinishi uchun hamma o'qiy oladi (bucket public bo'lgani uchun)
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
