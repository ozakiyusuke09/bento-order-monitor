grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.status_logs to authenticated;
grant select, insert, update, delete on table public.order_attachments to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;

grant usage, select on all sequences in schema public to authenticated;

select
  has_table_privilege('authenticated', 'public.orders', 'select') as orders_select_ok,
  has_table_privilege('authenticated', 'public.orders', 'insert') as orders_insert_ok,
  has_table_privilege('authenticated', 'public.order_items', 'select') as order_items_select_ok,
  has_table_privilege('authenticated', 'public.status_logs', 'insert') as status_logs_insert_ok;
