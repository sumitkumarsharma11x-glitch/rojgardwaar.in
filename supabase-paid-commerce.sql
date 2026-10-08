-- ROJGARDWAAR paid Railway test-series foundation.
-- Run this after supabase-schema.sql in Supabase SQL Editor.

create index if not exists purchases_user_status_idx
on public.purchases(user_id, status);

create index if not exists purchases_order_idx
on public.purchases(razorpay_order_id);

-- Only the logged-in owner can read their purchase history.
drop policy if exists "Users can read own purchases" on public.purchases;
create policy "Users can read own purchases"
on public.purchases for select
using (auth.uid() = user_id);

-- Browser clients must not be able to create or change purchases.
drop policy if exists "Users cannot insert purchases from browser" on public.purchases;
drop policy if exists "Users cannot update purchases from browser" on public.purchases;
-- No INSERT/UPDATE/DELETE policy is intentionally created.
-- The payment Edge Functions use the Supabase secret key server-side.
