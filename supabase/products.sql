create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists products_display_order_idx
on public.products (display_order, name);

alter table public.products enable row level security;

drop policy if exists "authenticated can read products" on public.products;
drop policy if exists "authenticated can insert products" on public.products;
drop policy if exists "authenticated can update products" on public.products;

create policy "authenticated can read products"
on public.products for select
to authenticated
using (true);

create policy "authenticated can insert products"
on public.products for insert
to authenticated
with check (true);

create policy "authenticated can update products"
on public.products for update
to authenticated
using (true)
with check (true);

grant select, insert, update on table public.products to authenticated;

insert into public.products (name, price, is_active, display_order)
select seed.name, null, true, seed.display_order
from (
  values
    ('唐揚げ弁当', 1),
    ('日替わり弁当', 2),
    ('幕の内弁当', 3),
    ('のり弁', 4),
    ('焼き魚弁当', 5),
    ('お茶', 6)
) as seed(name, display_order)
where not exists (
  select 1 from public.products where products.name = seed.name
);
