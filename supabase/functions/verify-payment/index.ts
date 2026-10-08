import { PRODUCTS, adminClient, corsHeaders, hmacHex, json, requireUser, razorpay, safeEqual } from '../_shared/commerce.ts';

Deno.serve(async (req) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return json({ error: 'Incomplete payment response.' }, 400, headers);

    const admin = adminClient();
    const { data: purchase, error: purchaseError } = await admin.from('purchases')
      .select('*').eq('razorpay_order_id', razorpay_order_id).eq('user_id', user.id).maybeSingle();
    if (purchaseError || !purchase) return json({ error: 'Payment order was not found.' }, 404, headers);

    const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!secret) throw new Error('Razorpay server configuration is incomplete.');
    const expected = await hmacHex(`${razorpay_order_id}|${razorpay_payment_id}`, secret);
    if (!safeEqual(expected, razorpay_signature)) return json({ error: 'Payment signature verification failed.' }, 400, headers);

    const payment = await razorpay(`/payments/${encodeURIComponent(razorpay_payment_id)}`);
    if (payment.order_id !== razorpay_order_id || Number(payment.amount) !== Number(purchase.amount_paise) || payment.currency !== 'INR') {
      return json({ error: 'Payment details do not match this order.' }, 400, headers);
    }
    if (payment.status !== 'captured') return json({ error: 'Payment is not captured yet. Please wait a moment and refresh My Account.' }, 409, headers);

    const product = PRODUCTS[purchase.product_code as keyof typeof PRODUCTS];
    if (!product) return json({ error: 'Unknown product.' }, 400, headers);

    const { error: updateError } = await admin.from('purchases').update({
      razorpay_payment_id,
      status: 'paid',
      purchased_at: new Date().toISOString()
    }).eq('id', purchase.id);
    if (updateError) throw updateError;

    return json({ success: true, product_code: purchase.product_code, product_name: product.name }, 200, headers);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Payment verification failed.' }, 400, headers);
  }
});
