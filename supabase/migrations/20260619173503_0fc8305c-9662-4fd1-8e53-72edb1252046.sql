GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.categories TO service_role;