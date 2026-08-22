# قاعات نادي اجوان - نظام إدارة الحجوزات الذكي 👑
### Ajwan Club Halls - Wedding Booking Management System

نظام إدارة وحجوزات قاعات الأفراح والمناسبات مصمم بأحدث التقنيات وأعلى معايير التصميم الفاخر (Dark Luxury Slate & Gold Theme) ومتجاوب بالكامل مع كافة مقاسات شاشات الهواتف والأجهزة الذكية، ومحمي بنظام تسجيل دخول ذكي لقاعدة البيانات.

---

## 🔐 نظام الحماية وتسجيل الدخول
- لا يمكن لأي شخص الدخول إلى النظام دون إدخال اسم مستخدم وكلمة مرور مسجلين في قاعدة بيانات Supabase.
- **بيانات الدخول المبدئية**:
  - **اسم المستخدم**: `admin`
  - **كلمة المرور**: `admin`
- يمكن للأدمن تعديل اسم المستخدم وكلمة المرور في أي وقت من خلال زر **حساب الأدمن** الموجود في الهيدر العلوي.

---

## 🚀 التقنيات المستخدمة (Tech Stack)
- **Frontend**: React 19, TypeScript
- **Bundler & Tooling**: Vite 6
- **Styling**: Tailwind CSS v4, Cairo Google Font, FontAwesome Icons
- **Database / Backend**: Supabase (@supabase/supabase-js)
- **Interactivity**: Canvas Confetti, WhatsApp Direct Messaging

---

## 🌟 المميزات الرئيسية
- 🔐 **صفحة تسجيل دخول فاخرة وآمنة**: التحقق المباشر من قاعدة البيانات وتخزين الجلسة بأمان.
- 🏛️ **مبدل القاعات السريع**: تصفية فورية للحجوزات حسب القاعة أو عرض كافة القاعات مع شارات السعة والإحصائيات.
- 📅 **جدول الـ 7 أيام القادمة**: استعراض فوري للأيام المتاحة والمحجوزة مع إمكانية الحجز المباشر بالموعد.
- 🗓️ **التقويم الشهري الذكي**: تقويم شهري تفاعلي مع تمييز اليوم الحالي وتأثيرات بصرية للحجوزات.
- 📋 **سجل الحجوزات والبحث الفوري**: جدول متجاوب يتيح البحث باسم العريس أو رقم الهاتف أو جهة التوصية.
- 💬 **إرسال رسائل الواتساب**: توليد رسائل تهنئة وتأكيد حجز احترافية بصيغة جاهزة للواتساب بضغطة زر.
- 📱 **تصميم متجاوب 100%**: متوافق تماماً مع جميع مقاسات الشاشات والهواتف الذكية.
- ☁️ **مزامنة Supabase**: حفظ فوري ومباشر في جداول Supabase السحابية.

---

## 🛠️ التشغيل محلياً (Local Development)

1. **تثبيت الحزم والمكتبات**:
```bash
npm install
```

2. **تشغيل خادم التطوير**:
```bash
npm run dev
```

3. **بناء النسخة الإنتاجية**:
```bash
npm run build
```

---

## 🗄️ إعداد قاعدة البيانات في Supabase (SQL Schema)
قم بتنفيذ السكربت التالي في **SQL Editor** داخل Supabase:

```sql
-- 1. جدول القاعات (halls)
CREATE TABLE IF NOT EXISTS public.halls (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الحجوزات (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    groom_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT DEFAULT '',
    recommendation TEXT DEFAULT '',
    hall_id TEXT NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    remaining_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول مسؤولي النظام وتسجيل الدخول (admins)
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY DEFAULT 'admin-1',
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إدراج حساب المسؤول الافتراضي (admin / admin)
INSERT INTO public.admins (id, username, password)
VALUES ('admin-1', 'admin', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 5. تفعيل الأمان وسياسات الوصول (RLS)
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for halls"
ON public.halls FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for bookings"
ON public.bookings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read-write for admins"
ON public.admins FOR ALL USING (true) WITH CHECK (true);
```
