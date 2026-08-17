# Saler — qurilish mollari magazini uchun ilova

Next.js + Supabase (backend/database/auth) asosida qurilgan, Vercel'ga bir zumda joylanadigan ilova.

## 1-qadam: Supabase loyihasini yaratish

1. [supabase.com](https://supabase.com) saytida ro'yxatdan o'ting, **New Project** yarating.
2. Loyiha ochilgach, chap menyudan **SQL Editor** → **New query**'ga o'ting.
3. `supabase/schema.sql` faylidagi barcha kodni nusxalab, shu yerga joylashtiring va **Run** tugmasini bosing.
   Bu barcha jadvallarni (tovarlar, sotuvlar, qarzlar, xarajatlar va h.k.) va xavfsizlik siyosatlarini yaratadi.
4. Chap menyudan **Authentication → Users** → **Add user** orqali o'zingiz uchun email va parol bilan foydalanuvchi yarating (bu sizning ilovaga kirish login-parolingiz bo'ladi).
5. Chap menyudan **Settings → API**'ga o'ting, quyidagilarni nusxalab oling:
   - **Project URL**
   - **anon public** key

## 2-qadam: Loyihani GitHub'ga yuklash

1. [github.com](https://github.com) da yangi bo'sh repository yarating (masalan `saler-app`).
2. Shu papkadagi barcha fayllarni o'sha repository'ga yuklang (GitHub Desktop yoki `git` orqali):
   ```
   git init
   git add .
   git commit -m "Saler app"
   git branch -M main
   git remote add origin https://github.com/USERNAME/saler-app.git
   git push -u origin main
   ```

## 3-qadam: Vercel'ga joylash

1. [vercel.com](https://vercel.com) ga GitHub hisobingiz bilan kiring.
2. **Add New → Project** → GitHub repository'ngizni tanlang → **Import**.
3. **Environment Variables** bo'limiga quyidagilarni qo'shing (2-qadamda olgan qiymatlar bilan):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon public key
4. **Deploy** tugmasini bosing. Bir necha daqiqadan so'ng sizga tayyor link beriladi (masalan `https://saler-app.vercel.app`).

## 4-qadam: Telefonga "ilova" sifatida o'rnatish

Vercel linkini telefon brauzerida oching → menyudan **"Bosh ekranga qo'shish" / "Add to Home Screen"** ni tanlang. Ilova ikonkasi bosh ekranga chiqadi va to'liq ekranli, mustaqil ilova kabi ishlaydi (offline ma'lumot ko'rsatishda cheklov bo'ladi, chunki ma'lumotlar endi serverda — Supabase'da saqlanadi, shuning uchun internet aloqasi kerak).

Agar haqiqiy `.apk` fayl kerak bo'lsa, shu Vercel linkini [pwabuilder.com](https://pwabuilder.com) ga kiritib, bir necha daqiqada APK generatsiya qilishingiz mumkin — ilova endi to'g'ri manifest va internetga ulangan holda ishlaydi, shuning uchun to'liq funksional bo'ladi.

## Lokal ishga tushirish (ixtiyoriy, sinov uchun)

```
npm install
cp .env.local.example .env.local   # so'ng .env.local ichiga o'z Supabase kalitlaringizni yozing
npm run dev
```

## Ilova imkoniyatlari

- **Bosh sahifa** — bugungi savdo/foyda/xarajat, umumiy qarz, kam qolgan tovarlar
- **Tovarlar** — qo'shish, tahrirlash, o'chirish, qidirish, **tovar rasmi yuklash**, qoldiqni kuzatish
- **Sotuv** — tovar tanlash (rasmi bilan), miqdor, avtomatik hisob-kitob
- **Qarzlar** — qarzdorlar, to'lov qabul qilish
- **Hisobot** — bugungi/oylik statistika
- **Login** — faqat siz Supabase'da yaratgan foydalanuvchi kira oladi (Row Level Security bilan himoyalangan — ma'lumotlaringizni faqat siz ko'rasiz)

## Tovar rasmi qanday ishlaydi

Rasmlar Supabase Storage'dagi `product-images` bucket'ida saqlanadi. `schema.sql` shu bucket'ni va uni ochish/o'qish uchun kerakli xavfsizlik siyosatlarini avtomatik yaratadi.

- **Yangi loyiha o'rnatayotgan bo'lsangiz**: shunchaki `supabase/schema.sql`ni ishga tushiring — hammasi tayyor bo'ladi.
- **Loyihani avval o'rnatgan va endi rasm funksiyasini qo'shmoqchi bo'lsangiz**: `supabase/migration_product_images.sql` faylini SQL Editor'da ishga tushiring, keyin GitHub'dagi kodni yangilab, Vercel qayta deploy qiladi.

Tovar qo'shish yoki tahrirlash oynasida endi "Rasm tanlash" tugmasi bor — telefon galereyasidan yoki kameradan rasm tanlash mumkin. Tovarlar ro'yxati va Sotuv bo'limida endi harf o'rniga aynan shu rasm ko'rinadi.
