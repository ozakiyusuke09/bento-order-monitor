alter table public.orders
add column if not exists deleted_at timestamptz;

alter table public.orders
add column if not exists deleted_by uuid references auth.users(id);

create index if not exists orders_deleted_at_idx
on public.orders (deleted_at);

