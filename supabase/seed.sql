insert into orders (id, status, customer_name, phone, pickup_date, pickup_time, receive_type, delivery_address, payment_method, note, source)
values
  ('11111111-1111-1111-1111-111111111111', 'new', '山田商事', '03-0000-1111', current_date, '10:30', 'delivery', '東京都千代田区丸の内1-1-1', 'invoice', '領収書あり。受付で担当者へ連絡。', 'manual'),
  ('22222222-2222-2222-2222-222222222222', 'confirmed', '田中様', '090-1234-5678', current_date, '11:00', 'pickup', null, 'cash', 'ご飯少なめ1つ', 'phone'),
  ('33333333-3333-3333-3333-333333333333', 'cooking', '株式会社ABC', '03-2222-3333', current_date, '11:30', 'delivery', '東京都港区芝公園4-2-8', 'invoice', '搬入口から納品', 'email'),
  ('44444444-4444-4444-4444-444444444444', 'completed', '佐藤工務店', '045-111-2222', current_date, '12:00', 'pickup', null, 'cashless', null, 'manual')
on conflict (id) do nothing;

insert into order_items (order_id, product_name, quantity, rice_option)
values
  ('11111111-1111-1111-1111-111111111111', '唐揚げ弁当', 12, 'normal'),
  ('11111111-1111-1111-1111-111111111111', 'お茶', 12, 'none'),
  ('22222222-2222-2222-2222-222222222222', '日替わり弁当', 3, 'small'),
  ('33333333-3333-3333-3333-333333333333', '唐揚げ弁当', 20, 'normal'),
  ('33333333-3333-3333-3333-333333333333', 'のり弁', 10, 'large'),
  ('44444444-4444-4444-4444-444444444444', '幕の内弁当', 18, 'normal');

insert into products (name, price, is_active, display_order)
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
  select 1 from products where products.name = seed.name
);

insert into status_logs (order_id, old_status, new_status, note)
values
  ('11111111-1111-1111-1111-111111111111', null, 'new', 'ダミーデータ登録'),
  ('22222222-2222-2222-2222-222222222222', null, 'new', 'ダミーデータ登録'),
  ('22222222-2222-2222-2222-222222222222', 'new', 'confirmed', '確認済みに変更'),
  ('33333333-3333-3333-3333-333333333333', null, 'new', 'ダミーデータ登録'),
  ('33333333-3333-3333-3333-333333333333', 'new', 'confirmed', '確認済みに変更'),
  ('33333333-3333-3333-3333-333333333333', 'confirmed', 'cooking', '調理開始'),
  ('44444444-4444-4444-4444-444444444444', null, 'new', 'ダミーデータ登録'),
  ('44444444-4444-4444-4444-444444444444', 'cooking', 'completed', '完了');
