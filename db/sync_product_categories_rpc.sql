-- Atomic multi-category sync for a product. Runs as SECURITY DEFINER so it
-- works regardless of whether the caller is service_role or a signed-in admin,
-- as long as the invoker is an admin. Run once on the self-hosted Supabase DB.

CREATE OR REPLACE FUNCTION public.sync_product_categories(
  p_product_id  uuid,
  p_category_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Allow either the service_role (bypasses RLS entirely) or an authenticated admin.
  IF auth.role() <> 'service_role' THEN
    SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
    IF NOT COALESCE(is_admin, false) THEN
      RAISE EXCEPTION 'Forbidden: admin role required';
    END IF;
  END IF;

  DELETE FROM public.product_categories WHERE product_id = p_product_id;

  IF p_category_ids IS NOT NULL AND array_length(p_category_ids, 1) > 0 THEN
    INSERT INTO public.product_categories (product_id, category_id)
    SELECT p_product_id, cid
    FROM unnest(p_category_ids) AS cid
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_product_categories(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.sync_product_categories(uuid, uuid[]) TO authenticated, service_role;
