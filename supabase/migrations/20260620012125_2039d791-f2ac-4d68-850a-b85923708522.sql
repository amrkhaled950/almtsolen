CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text := NEW.raw_user_meta_data->>'phone';
  v_email text := NEW.email;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', v_phone);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');

  -- Link previous guest orders matching this user's email or phone
  UPDATE public.orders
  SET user_id = NEW.id,
      guest_email = NULL,
      guest_phone = NULL,
      guest_name = NULL
  WHERE user_id IS NULL
    AND (
      (v_email IS NOT NULL AND lower(guest_email) = lower(v_email))
      OR (v_phone IS NOT NULL AND v_phone <> '' AND regexp_replace(guest_phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g'))
    );

  RETURN NEW;
END;
$function$;