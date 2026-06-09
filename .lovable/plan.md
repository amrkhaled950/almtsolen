# خطة المراحل 2 → 5

## نظرة عامة
الباك إند الخاص بالإعدادات (`site-settings.functions.ts` + جدول `site_settings`) موجود بالفعل ويحتوي كل الحقول المطلوبة (لوجو/favicon/نصوص ar+en/سوشيال/Hero/سياسات). صفحة `/admin/settings` الحالية فيها تابات شكلية بس مش متربطة بالـ backend. هنبني على اللي موجود.

---

## المرحلة 2 — `/admin/settings` كاملة

تابات جديدة بدل القديمة:
- **العلامة التجارية**: لوجو + favicon (رفع لـ Supabase Storage bucket `site-assets`) + اسم الموقع ar/en + tagline ar/en + meta description ar/en
- **Hero**: صور Hero متعددة (URL + title ar/en + link لكل صورة) + Hero title/subtitle ar/en — Drag to reorder
- **التواصل والسوشيال**: تليفون/إيميل/عنوان ar/en + فيسبوك/انستجرام/تويتر/تيكتوك/يوتيوب/واتساب
- **الفوتر**: نص "عن المتجر" ar/en
- **الصفحات القانونية**: سياسة الخصوصية، الشروط، الاسترجاع، الشحن، عن المتجر — كل واحدة ar+en (textarea كبيرة، Markdown مدعوم)

كل تاب فيه زرار Save بيستخدم mutation موجودة `updateSiteSettings`.

---

## المرحلة 3 — CRUD تصنيفات + ربط Settings بالواجهة

**التصنيفات** (`/admin/categories` موجودة جزئيا):
- جدول بكل التصنيفات
- إضافة/تعديل/حذف بـ modal
- حقول: slug، الاسم ar/en، الصورة، الترتيب، إظهار/إخفاء
- استخدام functions موجودة في `admin-catalog.functions.ts` أو إضافة الناقص

**ربط Settings**:
- `SiteHeader`: لوجو + اسم الموقع من Settings
- `SiteFooter`: روابط السوشيال + نص about + معلومات الاتصال
- `index.tsx` Hero: الصور + النصوص من Settings
- صفحات `/privacy /terms /returns /shipping /about`: المحتوى من Settings
- `__root.tsx`: favicon ديناميكي + meta description

كله عبر `getSiteSettings` server fn + React Query.

---

## المرحلة 4 — تصدير CSV + بوليصة شحن PDF + تحديث حالات الطلبات

**تحديث حالة الطلب** (في `/admin/orders`):
- Dropdown بحالات: pending, confirmed, processing, shipped, delivered, cancelled, returned
- زرار حفظ + server fn `updateOrderStatus`
- Timeline بسيط لتاريخ التغييرات (جدول `order_status_history`)

**تصدير CSV**:
- زرار "تصدير CSV" مع فلاتر (تاريخ، حالة)
- server fn `exportOrdersCsv` ترجع نص CSV
- تنزيل client-side عبر Blob

**بوليصة شحن PDF**:
- زرار "طباعة بوليصة" لكل طلب
- استخدام `jspdf` (مفيش subprocess) + خط عربي (Cairo/Tajawal من Google Fonts كـ base64)
- محتوى: اسم/تليفون/عنوان العميل، المحافظة، المنتجات، الإجمالي، تعليمات، QR code رقم الطلب
- يفتح في تاب جديد للطباعة

---

## المرحلة 5 — صفحة التحليلات بفلتر تاريخ

تطوير `/admin/analytics` الموجودة:
- فلتر تاريخ (آخر 7 أيام / 30 يوم / مخصص بـ Date Range Picker)
- مقاييس: عدد الطلبات، الإيرادات، متوسط قيمة الطلب، عدد الزبائن الجدد
- رسوم بيانية (`recharts` لو متركب، وإلا SVG بسيط):
  - مبيعات يومية (line)
  - الطلبات حسب الحالة (donut)
  - أفضل 10 منتجات (bar)
  - الطلبات حسب المحافظة (bar)
- تحديث `admin-analytics.functions.ts` لقبول `from`/`to`

---

## تفاصيل تقنية

**Schema جديد**:
```sql
-- Storage bucket
create bucket 'site-assets' public

-- order status history
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  changed_by uuid,
  note text,
  created_at timestamptz default now()
);
```

**حزم محتاجة**:
- `jspdf` + `qrcode` (للبوليصة)
- `recharts` (لو مش موجود)
- `react-day-picker` (موجود مع shadcn calendar)

**ترتيب التنفيذ**:
1. أبدأ بالمرحلة 2 كاملة (UI + ربط بالباك إند الموجود)
2. بعد موافقتك أكمل للمرحلة 3
3. ثم 4 ثم 5

هل أبدأ بالمرحلة 2 دلوقتي؟ أم عايز تعديل في الخطة قبل ما أبدأ؟
