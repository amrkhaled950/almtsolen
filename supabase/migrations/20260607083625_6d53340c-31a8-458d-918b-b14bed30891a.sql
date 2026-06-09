
-- =========================
-- 1) Products price fields
-- =========================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketing_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS misc_expenses NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Profit margin = price - (cost + marketing + misc), generated column
ALTER TABLE public.products
  DROP COLUMN IF EXISTS profit_margin;
ALTER TABLE public.products
  ADD COLUMN profit_margin NUMERIC(12,2)
  GENERATED ALWAYS AS (price - COALESCE(cost_price,0) - COALESCE(marketing_cost,0) - COALESCE(misc_expenses,0)) STORED;

-- =========================
-- 2) site_settings (singleton: id = 1)
-- =========================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  favicon_url TEXT,
  site_name_ar TEXT DEFAULT 'المتسولين',
  site_name_en TEXT DEFAULT 'Al-Motasawelin',
  tagline_ar TEXT DEFAULT 'مكتبتك العربية المفضلة',
  tagline_en TEXT DEFAULT 'Your favorite Arabic bookstore',
  meta_description_ar TEXT,
  meta_description_en TEXT,
  hero_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  hero_title_ar TEXT,
  hero_title_en TEXT,
  hero_subtitle_ar TEXT,
  hero_subtitle_en TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_tiktok TEXT,
  social_youtube TEXT,
  social_whatsapp TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address_ar TEXT,
  contact_address_en TEXT,
  footer_about_ar TEXT,
  footer_about_en TEXT,
  privacy_policy_ar TEXT,
  privacy_policy_en TEXT,
  terms_ar TEXT,
  terms_en TEXT,
  refund_policy_ar TEXT,
  refund_policy_en TEXT,
  shipping_policy_ar TEXT,
  shipping_policy_en TEXT,
  about_ar TEXT,
  about_en TEXT,
  custom_strings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public read" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings admin manage" ON public.site_settings;
CREATE POLICY "site_settings admin manage" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed singleton row
INSERT INTO public.site_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- =========================
-- 3) Marketing costs ledger
-- =========================
CREATE TABLE IF NOT EXISTS public.marketing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  channel TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_costs TO authenticated;
GRANT ALL ON public.marketing_costs TO service_role;

ALTER TABLE public.marketing_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_costs admin manage" ON public.marketing_costs;
CREATE POLICY "marketing_costs admin manage" ON public.marketing_costs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_marketing_costs_updated_at ON public.marketing_costs;
CREATE TRIGGER update_marketing_costs_updated_at
  BEFORE UPDATE ON public.marketing_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_marketing_costs_date ON public.marketing_costs(cost_date);
