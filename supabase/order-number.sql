alter table public.orders
add column if not exists order_no text;

alter table public.orders
add column if not exists daily_sequence integer;

create unique index if not exists orders_order_no_unique
on public.orders (order_no)
where order_no is not null;

create index if not exists orders_pickup_date_daily_sequence_idx
on public.orders (pickup_date, daily_sequence);
