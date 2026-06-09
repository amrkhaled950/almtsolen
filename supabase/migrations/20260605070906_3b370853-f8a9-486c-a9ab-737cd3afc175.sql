ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_guest_phone_egyptian_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_guest_phone_egyptian_check
  CHECK (
    guest_phone IS NULL
    OR guest_phone ~ '^01[0125][0-9]{8}$'
  );

DROP POLICY IF EXISTS "Guests create orders" ON public.orders;

CREATE POLICY "Guests create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND guest_phone IS NOT NULL
  AND guest_name IS NOT NULL
);