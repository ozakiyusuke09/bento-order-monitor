create extension if not exists pgcrypto;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'confirmed', 'cooking', 'completed', 'cancelled')),
  customer_name text not null,
  phone text,
  pickup_date date not null,
  pickup_time time not null,
  receive_type text not null check (receive_type in ('pickup', 'delivery')),
  delivery_address text,
  payment_method text default 'cash',
  note text,
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  rice_option text default 'normal',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists order_attachments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  source text not null default 'manual',
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

alter table orders enable row level security;
alter table order_items enable row level security;
alter table status_logs enable row level security;
alter table order_attachments enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on orders to authenticated;
grant select, insert, update on order_items to authenticated;
grant select, insert on status_logs to authenticated;
grant select, insert on order_attachments to authenticated;
grant select on products to authenticated;
grant select on customers to authenticated;

create policy "authenticated can read orders"
on orders for select
to authenticated
using (true);

create policy "authenticated can insert orders"
on orders for insert
to authenticated
with check (true);

create policy "authenticated can update orders"
on orders for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read order items"
on order_items for select
to authenticated
using (true);

create policy "authenticated can insert order items"
on order_items for insert
to authenticated
with check (true);

create policy "authenticated can update order items"
on order_items for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read status logs"
on status_logs for select
to authenticated
using (true);

create policy "authenticated can insert status logs"
on status_logs for insert
to authenticated
with check (true);

create policy "authenticated can read attachments"
on order_attachments for select
to authenticated
using (true);

create policy "authenticated can insert attachments"
on order_attachments for insert
to authenticated
with check (true);

insert into storage.buckets (id, name, public)
values ('order-attachments', 'order-attachments', true)
on conflict (id) do nothing;

create policy "authenticated can upload order attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'order-attachments');

create policy "authenticated can read order attachments"
on storage.objects for select
to authenticated
using (bucket_id = 'order-attachments');

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table status_logs;
alter publication supabase_realtime add table order_attachments;
