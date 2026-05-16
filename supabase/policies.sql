drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "authenticated can insert orders" on public.orders;
drop policy if exists "authenticated can update orders" on public.orders;
drop policy if exists "authenticated can read order items" on public.order_items;
drop policy if exists "authenticated can insert order items" on public.order_items;
drop policy if exists "authenticated can update order items" on public.order_items;
drop policy if exists "authenticated can read status logs" on public.status_logs;
drop policy if exists "authenticated can insert status logs" on public.status_logs;
drop policy if exists "authenticated can read attachments" on public.order_attachments;
drop policy if exists "authenticated can insert attachments" on public.order_attachments;

create policy "authenticated can read orders"
on public.orders for select
to authenticated
using (true);

create policy "authenticated can insert orders"
on public.orders for insert
to authenticated
with check (true);

create policy "authenticated can update orders"
on public.orders for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read order items"
on public.order_items for select
to authenticated
using (true);

create policy "authenticated can insert order items"
on public.order_items for insert
to authenticated
with check (true);

create policy "authenticated can update order items"
on public.order_items for update
to authenticated
using (true)
with check (true);

create policy "authenticated can read status logs"
on public.status_logs for select
to authenticated
using (true);

create policy "authenticated can insert status logs"
on public.status_logs for insert
to authenticated
with check (true);

create policy "authenticated can read attachments"
on public.order_attachments for select
to authenticated
using (true);

create policy "authenticated can insert attachments"
on public.order_attachments for insert
to authenticated
with check (true);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.status_logs to authenticated;
grant select, insert, update, delete on table public.order_attachments to authenticated;

select
  has_table_privilege('authenticated', 'public.orders', 'insert') as orders_insert_ok,
  has_table_privilege('authenticated', 'public.order_items', 'insert') as order_items_insert_ok,
  has_table_privilege('authenticated', 'public.status_logs', 'insert') as status_logs_insert_ok;
