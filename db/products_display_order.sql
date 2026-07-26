-- Add display_order to products for manual sorting in dashboard.
-- Lower number = appears first. Ties fall back to created_at DESC.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_display_order_idx
  ON public.products (display_order ASC, created_at DESC);
