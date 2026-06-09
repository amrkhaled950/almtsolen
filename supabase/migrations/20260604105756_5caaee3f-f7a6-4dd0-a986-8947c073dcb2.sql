
-- handle_new_user is only a trigger; no one should call it directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten order_items insert: only allow inserting items for an order you just created (or as admin)
DROP POLICY IF EXISTS "Anyone insert order items" ON public.order_items;
CREATE POLICY "Users insert items for own orders" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Guests insert items for guest orders" ON public.order_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id IS NULL));
