// Shared helpers for the Efie Wura Edge Functions: admin DB client, Paystack and Hubtel calls.
import { createClient } from 'npm:@supabase/supabase-js@2';

export const env = (k: string) => Deno.env.get(k) || '';
export const admin = () => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { db: { schema: 'efiewura' }, auth: { persistSession: false } });
export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
export const FN_URL = `${env('SUPABASE_URL')}/functions/v1`;

export const configured = () => ({
  paystack: !!env('PAYSTACK_SECRET_KEY'),
  hubtel: !!(env('HUBTEL_API_ID') && env('HUBTEL_API_KEY') && env('HUBTEL_POS_SALES_ID')),
  hubtelPayouts: !!(env('HUBTEL_API_ID') && env('HUBTEL_API_KEY') && env('HUBTEL_PREPAID_ID')),
  sms: !!env('MNOTIFY_API_KEY'),
});

/** 024… / +23324… → 23324… */
export const msisdn = (p: string) => `233${String(p || '').replace(/\D/g, '').slice(-9)}`;
export const local = (p: string) => `0${String(p || '').replace(/\D/g, '').slice(-9)}`;

export async function hookSecret() {
  const { data } = await admin().from('secrets').select('hook_secret').single();
  return data?.hook_secret as string;
}

// ---------------------------------------------------------------- Paystack
const PS = 'https://api.paystack.co';
export async function paystack(path: string, body?: unknown, method = body ? 'POST' : 'GET') {
  const r = await fetch(PS + path, { method, headers: { Authorization: `Bearer ${env('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === false) throw new Error(j.message || `Paystack error ${r.status}`);
  return j.data;
}
export const PAYSTACK_MOMO: Record<string, string> = { mtn: 'mtn', telecel: 'vod', at: 'atl' };
export const PAYSTACK_TRANSFER_MOMO: Record<string, string> = { mtn: 'MTN', telecel: 'VOD', at: 'ATL' };

export async function verifyPaystackSignature(raw: string, sig: string | null) {
  if (!sig) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('PAYSTACK_SECRET_KEY')), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === sig;
}

// ---------------------------------------------------------------- Hubtel
const basic = () => `Basic ${btoa(`${env('HUBTEL_API_ID')}:${env('HUBTEL_API_KEY')}`)}`;
export async function hubtel(url: string, body?: unknown, method = body ? 'POST' : 'GET') {
  const r = await fetch(url, { method, headers: { Authorization: basic(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.Message || j.message || `Hubtel error ${r.status}`);
  return j;
}
export const HUBTEL_CHANNEL: Record<string, string> = { mtn: 'mtn-gh', telecel: 'vodafone-gh', at: 'tigo-gh' };
export const hubtelReceiveUrl = () => `https://rmp.hubtel.com/merchantaccount/merchants/${env('HUBTEL_POS_SALES_ID')}/receive/mobilemoney`;
export const hubtelCheckoutUrl = 'https://payproxyapi.hubtel.com/items/initiate';
export const hubtelStatusUrl = (ref: string) => `https://api-txnstatus.hubtel.com/transactions/${env('HUBTEL_POS_SALES_ID')}/status?clientReference=${encodeURIComponent(ref)}`;
export const hubtelSendUrl = () => `https://smp.hubtel.com/api/merchants/${env('HUBTEL_PREPAID_ID')}/send/mobilemoney`;
