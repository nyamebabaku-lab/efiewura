// Payments for Efie Wura Pro (signed-in users).
// actions: providers | charge {id} | otp {id, otp} | verify {id} | payout {owner, id}
// The database decides who may pay what (start_checkout); this function only talks to Paystack / Hubtel
// and settles a checkout after the provider confirms it.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { admin, cors, json, env, configured, msisdn, local, paystack, PAYSTACK_MOMO, PAYSTACK_TRANSFER_MOMO, hubtel, HUBTEL_CHANNEL,
  hubtelReceiveUrl, hubtelCheckoutUrl, hubtelStatusUrl, hubtelSendUrl, hookSecret, FN_URL } from '../_shared/efiewura.ts';

const SITE = env('EFIEWURA_SITE') || 'https://nyamebabaku-lab.github.io/efiewura/';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'providers') return json(configured());
    const user = (await createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }).auth.getUser()).data.user;
    if (!user) return json({ error: 'Please sign in again' }, 401);
    const db = admin();

    if (body.action === 'payout') return json(await payout(db, user.id, body.owner, body.id));

    const { data: c } = await db.from('checkouts').select('*').eq('id', body.id).single();
    if (!c || c.created_by !== user.id) return json({ error: 'Payment not found' }, 404);
    if (c.test) return json({ error: 'Test-mode payments are confirmed with confirm_test_checkout' }, 400);
    const cfg = configured();
    if (!(cfg as Record<string, boolean>)[c.provider]) {
      await db.rpc('fail_checkout', { p_id: c.id, p_error: `${c.provider} is not connected yet` });
      return json({ status: 'failed', error: `${c.provider === 'hubtel' ? 'Hubtel' : 'Paystack'} is not connected yet. Please try later.` });
    }
    if (body.action === 'charge') return json(await charge(db, c, user.email || ''));
    if (body.action === 'otp') {
      if (c.provider !== 'paystack') return json({ error: 'No code needed' }, 400);
      const d = await paystack('/charge/submit_otp', { otp: String(body.otp || ''), reference: c.id });
      return json(d.status === 'success' ? await verify(db, c) : { status: 'pending', message: d.display_text || 'Approve the prompt on your phone' });
    }
    if (body.action === 'verify') return json(await verify(db, c));
    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});

// deno-lint-ignore no-explicit-any
async function charge(db: any, c: any, email: string) {
  if (c.status !== 'pending') return { status: c.status, error: c.error };
  const amount = Number(c.amount);
  const label = c.kind === 'plan' ? `Efie Wura ${c.plan} plan` : 'Rent payment';
  const hook = await hookSecret();
  if (c.provider === 'paystack') {
    const payEmail = email && !email.endsWith('.app') ? email : `${local(c.payer || '0000000000')}@tenants.efiewura.app`;
    if (c.method === 'card') {
      const d = await paystack('/transaction/initialize', { email: payEmail, amount: Math.round(amount * 100), currency: 'GHS', reference: c.id, channels: ['card'], callback_url: `${SITE}#/paid?ck=${c.id}`, metadata: { kind: c.kind, owner: c.owner_id } });
      await db.from('checkouts').update({ pay_url: d.authorization_url, provider_ref: d.access_code }).eq('id', c.id);
      return { status: 'redirect', url: d.authorization_url };
    }
    const d = await paystack('/charge', { email: payEmail, amount: Math.round(amount * 100), currency: 'GHS', reference: c.id, mobile_money: { phone: local(c.payer), provider: PAYSTACK_MOMO[c.method] }, metadata: { kind: c.kind, owner: c.owner_id } });
    if (d.status === 'success') return verify(db, c);
    if (d.status === 'failed') { await db.rpc('fail_checkout', { p_id: c.id, p_error: d.gateway_response || 'Payment failed' }); return { status: 'failed', error: d.gateway_response || 'Payment failed' }; }
    if (d.status === 'send_otp') return { status: 'need_otp', message: d.display_text || 'Enter the code sent to your phone (Telecel: dial *110# → Make Payments → My Approvals)' };
    return { status: 'pending', message: d.display_text || 'Approve the prompt on your phone' };
  }
  // Hubtel
  const callback = `${FN_URL}/efiewura-webhook?p=hubtel&k=${hook}`;
  if (c.method === 'card') {
    const d = await hubtel(hubtelCheckoutUrl, { totalAmount: amount, description: label, callbackUrl: callback, returnUrl: `${SITE}#/paid?ck=${c.id}`, cancellationUrl: `${SITE}#/`, merchantAccountNumber: env('HUBTEL_POS_SALES_ID'), clientReference: c.id });
    const url = d.data?.checkoutUrl || d.Data?.CheckoutUrl;
    await db.from('checkouts').update({ pay_url: url }).eq('id', c.id);
    return { status: 'redirect', url };
  }
  const d = await hubtel(hubtelReceiveUrl(), { CustomerName: 'Tenant', CustomerMsisdn: msisdn(c.payer), CustomerEmail: '', Channel: HUBTEL_CHANNEL[c.method], Amount: amount, PrimaryCallbackUrl: callback, Description: label, ClientReference: c.id });
  if (d.ResponseCode && !['0000', '0001'].includes(d.ResponseCode)) { await db.rpc('fail_checkout', { p_id: c.id, p_error: d.Message || 'Payment failed' }); return { status: 'failed', error: d.Message }; }
  await db.from('checkouts').update({ provider_ref: d.Data?.TransactionId || null }).eq('id', c.id);
  return { status: 'pending', message: 'Approve the prompt on your phone' };
}

/** Asks the provider whether the payment went through; settles or fails the checkout. */
// deno-lint-ignore no-explicit-any
export async function verify(db: any, c: any) {
  if (c.status !== 'pending') return { status: c.status, error: c.error };
  if (c.provider === 'paystack') {
    const d = await paystack(`/transaction/verify/${encodeURIComponent(c.id)}`);
    if (d.status === 'success' && Math.round(d.amount) === Math.round(Number(c.amount) * 100) && d.currency === 'GHS') {
      const { data } = await db.rpc('settle_checkout', { p_id: c.id, p_ref: String(d.id) });
      return data;
    }
    if (['failed', 'abandoned', 'reversed'].includes(d.status) && d.gateway_response !== 'Transaction ongoing') {
      if (d.status !== 'abandoned') await db.rpc('fail_checkout', { p_id: c.id, p_error: d.gateway_response || 'Payment failed' });
      return { status: d.status === 'abandoned' ? 'pending' : 'failed', error: d.gateway_response };
    }
    return { status: 'pending' };
  }
  const d = await hubtel(hubtelStatusUrl(c.id));
  const st = (d.data?.status || d.Data?.Status || '').toLowerCase();
  const amt = Number(d.data?.amount ?? d.Data?.Amount ?? 0);
  if (st === 'paid' && Math.abs(amt - Number(c.amount)) < 0.01) {
    const { data } = await db.rpc('settle_checkout', { p_id: c.id, p_ref: d.data?.transactionId || d.Data?.TransactionId || null });
    return data;
  }
  if (st === 'unpaid' || st === 'failed') { await db.rpc('fail_checkout', { p_id: c.id, p_error: 'Payment was not completed' }); return { status: 'failed', error: 'Payment was not completed' }; }
  return { status: 'pending' };
}

/** Sends an approved withdrawal to the owner's MoMo / bank. */
// deno-lint-ignore no-explicit-any
async function payout(db: any, userId: string, ownerId: string, id: string) {
  const { data: me } = await db.from('profiles').select('*').eq('user_id', userId).single();
  if (!me || !(me.role === 'admin' || (me.role === 'owner' && me.owner_id === ownerId))) return { error: 'Not allowed' };
  const { data: rec } = await db.from('records').select('data').eq('owner_id', ownerId).eq('col', 'withdrawals').eq('id', id).single();
  const w = rec?.data;
  if (!w || w.status !== 'processing' || w.test) return { status: w?.status, note: 'Nothing to send' };
  if (w.providerSent) return { status: 'processing' };
  // Mark as sent first so a double click can never pay twice.
  await db.from('records').update({ data: { ...w, providerSent: true } }).eq('owner_id', ownerId).eq('col', 'withdrawals').eq('id', id);
  const cfg = configured();
  const send = Number(w.amount) - Number(w.fee || 0);
  const acc = w.account;
  try {
    if (w.provider === 'hubtel' && acc.kind === 'momo' && cfg.hubtelPayouts) {
      const hook = await hookSecret();
      const d = await hubtel(hubtelSendUrl(), { RecipientName: acc.name, RecipientMsisdn: msisdn(acc.number), CustomerEmail: '', Channel: HUBTEL_CHANNEL[acc.network], Amount: send, PrimaryCallbackURL: `${FN_URL}/efiewura-webhook?p=hubtel-payout&k=${hook}&o=${ownerId}`, Description: 'Efie Wura withdrawal', ClientReference: id });
      if (d.ResponseCode && !['0000', '0001'].includes(d.ResponseCode)) throw new Error(d.Message || 'Hubtel payout failed');
      if (d.ResponseCode === '0000') await db.rpc('payout_result', { p_owner: ownerId, p_id: id, p_status: 'paid', p_note: d.Data?.TransactionId || '' });
      return { status: d.ResponseCode === '0000' ? 'paid' : 'processing' };
    }
    if (!cfg.paystack) throw new Error('No payout provider is connected yet');
    let recipient;
    if (acc.kind === 'bank') {
      const banks = await paystack('/bank?currency=GHS&type=ghipss');
      // deno-lint-ignore no-explicit-any
      const bank = banks.find((b: any) => b.name.toLowerCase().includes(String(acc.bank).toLowerCase().split(' ')[0]));
      if (!bank) throw new Error(`Bank ${acc.bank} not found at Paystack`);
      recipient = await paystack('/transferrecipient', { type: 'ghipss', name: acc.name, account_number: acc.number, bank_code: bank.code, currency: 'GHS' });
    } else {
      recipient = await paystack('/transferrecipient', { type: 'mobile_money', name: acc.name, account_number: local(acc.number), bank_code: PAYSTACK_TRANSFER_MOMO[acc.network], currency: 'GHS' });
    }
    const t = await paystack('/transfer', { source: 'balance', amount: Math.round(send * 100), recipient: recipient.recipient_code, reference: id, reason: 'Efie Wura withdrawal' });
    if (t.status === 'success') await db.rpc('payout_result', { p_owner: ownerId, p_id: id, p_status: 'paid', p_note: t.transfer_code });
    return { status: t.status === 'success' ? 'paid' : 'processing' };
  } catch (e) {
    await db.rpc('payout_result', { p_owner: ownerId, p_id: id, p_status: 'failed', p_note: (e as Error).message });
    return { status: 'failed', error: (e as Error).message };
  }
}
