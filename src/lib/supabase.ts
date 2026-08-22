import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ywfimxqmsitqvnpbobor.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZmlteHFtc2l0cXZucGJvYm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzEyMjEsImV4cCI6MjEwMjkwNzIyMX0.dP4FYQD2PDMa-17PZcb3XdebHwFR8MU_dlX5sQ5nqzk';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false },
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

export const SUPABASE_SCHEMA_SQL = `-- سكربت إنشاء جداول قاعات نادي اجوان في Supabase

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
`;
