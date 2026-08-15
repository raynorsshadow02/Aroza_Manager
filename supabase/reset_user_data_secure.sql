CREATE OR REPLACE FUNCTION public.reset_user_data_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized reset';
  END IF;

  -- Restrict search_path to safe schema
  SET LOCAL search_path = public, pg_catalog;

  -- Delete child/dependent records first
  DELETE FROM public.sale_items WHERE user_id = uid;
  DELETE FROM public.purchase_items WHERE user_id = uid;
  DELETE FROM public.product_images WHERE user_id = uid;
  DELETE FROM public.stock_movements WHERE user_id = uid;

  -- Delete parent records
  DELETE FROM public.sales WHERE user_id = uid;
  DELETE FROM public.purchases WHERE user_id = uid;
  DELETE FROM public.products WHERE user_id = uid;
  DELETE FROM public.expenses WHERE user_id = uid;
  DELETE FROM public.invoices WHERE user_id = uid;
  DELETE FROM public.receipts WHERE user_id = uid;
  DELETE FROM public.suppliers WHERE user_id = uid;
  DELETE FROM public.categories WHERE user_id = uid;
  -- Settings are retained
END;
$$;

-- Restrict execute permission to only authenticated users
REVOKE ALL ON FUNCTION public.reset_user_data_secure() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_user_data_secure() TO anon;
GRANT EXECUTE ON FUNCTION public.reset_user_data_secure() TO authenticated;
