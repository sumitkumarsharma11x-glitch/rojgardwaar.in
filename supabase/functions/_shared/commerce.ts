import { createClient } from 'npm:@supabase/supabase-js@2';

export const PRODUCTS = {
  'technician-grade-iii': { name: 'RRB Technician Grade-III — 50 Mock Test Series', amount: 4900, currency: 'INR', description: '50 full mock tests · 3 free + 47 premium' },
  'technician-grade-i-signal': { name: 'RRB Technician Grade-I Signal — 50 Mock Test Series', amount: 4900, currency: 'INR', description: '50 full mock tests · 3 free + 47 premium' }
} as const;

export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://rojgardwaar.in',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-retry-count',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
export function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
export function publishableKey() {
  const map = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (map) { try { return JSON.parse(map).default || ''; } catch (_) {} }
  return Deno.env.get('SUPABASE_ANON_KEY') || '';
}
export function secretKey() {
  const map = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (map) { try { return JSON.parse(map).default || ''; } catch (_) {} }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
export function userClient(accessToken: string) {
  return createClient(supabaseUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
export function adminClient() {
  return createClient(supabaseUrl(), secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function requireUser(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('Login required.');
  const client = userClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('Your login session is invalid or expired.');
  return data.user;
}
export async function hmacHex(message: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function safeEqual(a: string, b: string) {
  const aa = new TextEncoder().encode(a), bb = new TextEncoder().encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0; for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
export async function razorpay(path: string, init: RequestInit = {}) {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID'), secret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keyId || !secret) throw new Error('Razorpay server configuration is incomplete.');
  const auth = btoa(`${keyId}:${secret}`);
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Basic ${auth}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers });
  const text = await response.text();
  let body: any; try { body = JSON.parse(text); } catch (_) { body = { raw: text }; }
  if (!response.ok) throw new Error(body?.error?.description || `Razorpay API error (${response.status})`);
  return body;
}
