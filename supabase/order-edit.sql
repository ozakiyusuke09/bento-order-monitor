drop policy if exists "authenticated can delete order items" on public.order_items;

create policy "authenticated can delete order items"
on public.order_items for delete
to authenticated
using (true);

grant select, insert, update, delete on table public.order_items to authenticated;
