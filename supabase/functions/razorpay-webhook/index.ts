import { adminClient, corsHeaders, hmacHex, json, razorpay, safeEqual } from '../_shared/commerce.ts';

Deno.serve(async (req) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) throw new Error('Webhook secret is not configured.');
    const expected = await hmacHex(raw, secret);
    if (!safeEqual(expected, signature)) return json({ error: 'Invalid webhook signature.' }, 401, headers);

    const payload = JSON.parse(raw);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const refundEntity = payload.payload?.refund?.entity;
    const orderId = paymentEntity?.order_id || refundEntity?.order_id;
    if (!orderId) return json({ received: true }, 200, headers);

    const admin = adminClient();
    const { data: purchase } = await admin.from('purchases').select('*').eq('razorpay_order_id', orderId).maybeSingle();
    if (!purchase) return json({ received: true }, 200, headers);

    if (event === 'payment.captured') {
      await admin.from('purchases').update({
        status: 'paid',
        razorpay_payment_id: paymentEntity.id,
        purchased_at: new Date().toISOString()
      }).eq('id', purchase.id);
    } else if (event === 'payment.failed') {
      await admin.from('purchases').update({ status: 'failed', razorpay_payment_id: paymentEntity?.id || null }).eq('id', purchase.id);
    } else if (event === 'refund.processed') {
      await admin.from('purchases').update({ status: 'refunded' }).eq('id', purchase.id);
    }
    return json({ received: true }, 200, headers);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Webhook error.' }, 400, headers);
  }
});
