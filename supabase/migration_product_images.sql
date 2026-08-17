-- Agar schema.sql'ni ILGARI ishga tushirgan bo'lsangiz, faqat SHU faylni ishga tushiring
-- (tovar rasmi funksiyasini qo'shish uchun). Yangi loyiha bo'lsa, buni ishlatish shart emas —
-- yangilangan schema.sql'ning o'zi yetarli.

alter table products add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_authenticated_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "product_images_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "product_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
