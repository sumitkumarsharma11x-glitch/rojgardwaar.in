# ROJGARDWAAR Paid Railway Test Series — Setup

Implemented products:
- RRB Technician Grade-III — ₹49 launch price
- RRB Technician Grade-I Signal — ₹49 launch price

## Flow
1. Logged-in student clicks Buy Full Test Series.
2. Supabase Edge Function creates the Razorpay Order using the server-side price.
3. Razorpay Checkout opens.
4. Checkout returns payment/order/signature data.
5. verify-payment validates the payment signature and captured status.
6. razorpay-webhook records captured, failed and refunded events.
7. Verified purchase is stored in public.purchases.
8. My Account shows PURCHASED • UNLOCKED.
9. Premium Railway tests require the matching paid product; Mock Tests 1–3 stay free.

## Supabase SQL
Run these in Supabase SQL Editor in order:
1. supabase-schema.sql
2. supabase-paid-commerce.sql

Do not add browser INSERT/UPDATE policies to public.purchases.

## Edge Functions
Deploy: create-order, verify-payment, razorpay-webhook.
Shared code: supabase/functions/_shared/commerce.ts.

CLI:
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-order
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook

## Production secrets
Set these as Supabase Edge Function secrets. Never put them in GitHub or browser JavaScript:
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

The browser receives only the Razorpay Key ID from the secure order-creation response.

## Razorpay
Use Test mode while testing and Live mode only when ready to launch.
Webhook URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook

Enable at least: payment.captured, payment.failed, refund.processed.
Ensure automatic payment capture is enabled before launch.

## Important security note
The payment and entitlement checks are server-verified. Never put the Razorpay Secret Key in frontend code.

The current repository gate blocks unauthorised users from entering premium tests through the website. However, any premium question bank shipped as a public GitHub JSON file can still be fetched directly. Before loading real premium questions, move the premium bank to a private Supabase Storage bucket or authenticated server endpoint and deliver it only to entitled users.