import { PRODUCTS, adminClient, corsHeaders, json, requireUser, razorpay } from '../_shared/commerce.ts';

Deno.serve(async (req) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const user = await requireUser(req);
    const { product_code } = await req.json();
    const product = PRODUCTS[product_code as keyof typeof PRODUCTS];
    if (!product) return json({ error: 'Invalid product.' }, 400, headers);

    const admin = adminClient();
    const existing = await admin.from('purchases').select('id').eq('user_id', user.id).eq('product_code', product_code).eq('status', 'paid').limit(1);
    if (existing.data?.length) return json({ already_purchased: true, product_code }, 200, headers);

    const receipt = `rjd_${product_code.slice(-8)}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const order = await razorpay('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: product.amount,
        currency: product.currency,
        receipt,
        notes: { user_id: user.id, product_code, email: user.email || '' }
      })
    });

    const { error: insertError } = await admin.from('purchases').insert({
      user_id: user.id,
      product_code,
      razorpay_order_id: order.id,
      amount_paise: product.amount,
      status: 'pending'
    });
    if (insertError) throw insertError;

    return json({
      order_id: order.id,
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      amount: product.amount,
      currency: product.currency,
      name: 'ROJGARDWAAR.IN',
      description: product.name
    }, 200, headers);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unable to create payment order.' }, 400, headers);
  }
});
