-- Multi-category support via junction. Run manually on self-hosted Supabase.
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id  uuid NOT NULL REFERENCES public.products(id)   ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX IF NOT EXISTS product_categories_category_idx ON public.product_categories(category_id);
CREATE INDEX IF NOT EXISTS product_categories_product_idx  ON public.product_categories(product_id);

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL    ON public.product_categories TO service_role;

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories readable by everyone" ON public.product_categories;
CREATE POLICY "product_categories readable by everyone"
  ON public.product_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_categories admin write" ON public.product_categories;
CREATE POLICY "product_categories admin write"
  ON public.product_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
