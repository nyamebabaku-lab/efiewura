// Live app sign-in / sign-up, and the "finish setting up" screen for accounts without a company yet.
import { useEffect, useState } from 'react';
import { Building2, KeyRound, UserCog, ArrowLeft, Loader2, Crown, LogOut, Eye, EyeOff } from 'lucide-react';
import { Modal, Button, Field, Input, Segmented, toast, cx } from '../../components/ui';
import { EfieLogo } from '../../components/layout/Logo';
import { signIn, registerOwner, joinCompany, claimAdmin, signOut, resetPassword, useLive } from '../../data/live';
import { friendly } from '../../lib/supabase';

const ROLES = [
  { id: 'owner', icon: Building2, title: 'Property owner', text: 'Register your company and manage your properties' },
  { id: 'tenant', icon: KeyRound, title: 'Tenant', text: 'Pay rent and get receipts — use the code from your landlord' },
  { id: 'staff', icon: UserCog, title: 'Staff', text: 'Manager or caretaker invited by an owner' },
];

function Password({ value, onChange, label = 'Password', hint }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="pr-10" autoComplete="current-password" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Show password">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
    </Field>
  );
}

/** Role form for sign-up (or for finishing an account that exists without a company). */
function RoleForm({ role, v, set, withAccount }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name *"><Input value={v.name || ''} onChange={(e) => set({ name: e.target.value })} /></Field>
      <Field label="Phone (MoMo) *" hint={role !== 'owner' ? 'The number your landlord / employer saved for you' : undefined}><Input inputMode="tel" value={v.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder="024 123 4567" /></Field>
      {withAccount && <Field label="Email (optional)" hint="Lets you reset a forgotten password"><Input type="email" value={v.email || ''} onChange={(e) => set({ email: e.target.value })} /></Field>}
      {withAccount && <Password value={v.password || ''} onChange={(x) => set({ password: x })} hint="At least 8 characters" />}
      {role === 'owner' ? (
        <>
          <Field label="Company / business name"><Input value={v.company || ''} onChange={(e) => set({ company: e.target.value })} placeholder="You can change it later" /></Field>
          <Field label="Ghana Card number *"><Input value={v.ghanaCard || ''} onChange={(e) => set({ ghanaCard: e.target.value })} placeholder="GHA-000000000-0" /></Field>
          <Field label="Business registration no." className="sm:col-span-2"><Input value={v.businessReg || ''} onChange={(e) => set({ businessReg: e.target.value })} placeholder="Optional" /></Field>
        </>
      ) : (
        <Field label="Company code *" className="sm:col-span-2" hint="6 letters/numbers — ask your landlord or employer"><Input value={v.code || ''} onChange={(e) => set({ code: e.target.value.toUpperCase() })} maxLength={6} className="font-mono text-lg tracking-widest" /></Field>
      )}
    </div>
  );
}

const check = (role, v, withAccount) => {
  if (!v.name?.trim()) return 'Enter your name';
  if (!/^0\d{9}$/.test((v.phone || '').replace(/\s|\+233/g, '').replace(/^233/, '0'))) return 'Enter a 10-digit phone number, e.g. 0241234567';
  if (withAccount && (v.password || '').length < 8) return 'Use a password of at least 8 characters';
  if (role === 'owner' && !v.ghanaCard?.trim()) return 'Enter your Ghana Card number';
  if (role !== 'owner' && (v.code || '').trim().length !== 6) return 'Enter the 6-character company code';
  return '';
};
const normPhone = (p) => `0${String(p).replace(/\D/g, '').slice(-9)}`;

export function AuthModal({ open, onClose, start = 'signin' }) {
  const [tab, setTab] = useState(start);
  const [role, setRole] = useState(null);
  const [v, setV] = useState({});
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  useEffect(() => { if (open) { setTab(start); setRole(null); setV({}); setForgot(false); } }, [open, start]);
  const set = (p) => setV((x) => ({ ...x, ...p }));

  const doSignIn = async () => {
    if (!v.id || !v.password) return toast.error('Enter your phone/email and password');
    setBusy(true);
    try { await signIn(v.id, v.password); onClose(); } catch (e) { toast.error('Could not sign in', e.message); }
    setBusy(false);
    return null;
  };
  const doSignUp = async () => {
    const err = check(role, v, true);
    if (err) return toast.error(err);
    setBusy(true);
    const f = { ...v, phone: normPhone(v.phone) };
    try {
      if (role === 'owner') { await registerOwner(f); toast.success('Account created', 'Now let’s set up your brand'); }
      else { const r = await joinCompany(f); toast.success(r === 'manager' ? 'Welcome to the team' : 'Welcome home', 'Your account is ready'); }
      onClose();
    } catch (e) { toast.error('Could not create your account', friendly(e)); }
    setBusy(false);
    return null;
  };
  const doReset = async () => {
    if (!v.id?.includes('@')) return toast.error('Enter the email on your account', 'Phone-only accounts: ask your landlord or Efie Wura support to reset it.');
    try { await resetPassword(v.id); toast.success('Check your email', 'We sent a link to set a new password'); setForgot(false); } catch (e) { toast.error('Not sent', e.message); }
    return null;
  };

  return (
    <Modal open={open} onClose={onClose} title={tab === 'signin' ? (forgot ? 'Reset password' : 'Welcome back') : 'Create your account'} size={tab === 'signup' && role ? 'lg' : 'md'}
      footer={tab === 'signin' ? (
        forgot ? <Button className="w-full" onClick={doReset}>Send reset link</Button> : <Button className="w-full" disabled={busy} onClick={doSignIn}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</Button>
      ) : role && <><Button variant="secondary" icon={ArrowLeft} onClick={() => setRole(null)}>Back</Button><Button disabled={busy} onClick={doSignUp}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create account</Button></>}>
      <Segmented className="mb-5 w-full [&>button]:flex-1" value={tab} onChange={(t) => { setTab(t); setRole(null); }} options={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]} />
      {tab === 'signin' ? (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); forgot ? doReset() : doSignIn(); }}>
          <Field label="Phone number or email"><Input autoFocus value={v.id || ''} onChange={(e) => set({ id: e.target.value })} placeholder="0241234567 or you@email.com" autoComplete="username" /></Field>
          {!forgot && <Password value={v.password || ''} onChange={(x) => set({ password: x })} />}
          <button type="button" onClick={() => setForgot(!forgot)} className="text-xs font-semibold text-brand-600">{forgot ? 'Back to sign in' : 'Forgot password?'}</button>
          <button type="submit" className="hidden" />
        </form>
      ) : !role ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Who are you?</p>
          {ROLES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRole(r.id)} className="flex w-full items-center gap-4 rounded-2xl border border-ivory-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50/50 dark:border-white/10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white"><r.icon className="h-5 w-5" /></span>
              <span><span className="block font-bold">{r.title}</span><span className="text-xs text-slate-500">{r.text}</span></span>
            </button>
          ))}
        </div>
      ) : (
        <RoleForm role={role} v={v} set={set} withAccount />
      )}
    </Modal>
  );
}

/** Signed in, but the account has no company yet (e.g. sign-up was interrupted). */
export function FinishSetup() {
  const { email, adminExists } = useLive();
  const [role, setRole] = useState(null);
  const [v, setV] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (p) => setV((x) => ({ ...x, ...p }));
  const reserved = email === 'nyamebabaku@gmail.com';
  const go = async () => {
    if (role === 'admin') { setBusy(true); try { await claimAdmin(v.name || 'Efie Wura HQ'); } catch (e) { toast.error(e.message); } setBusy(false); return null; }
    const err = check(role, v, false);
    if (err) return toast.error(err);
    setBusy(true);
    try { if (role === 'owner') await registerOwner({ ...v, phone: normPhone(v.phone) }); else await joinCompany({ ...v, phone: normPhone(v.phone) }); } catch (e) { toast.error('Not done', friendly(e)); }
    setBusy(false);
    return null;
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 p-4 dark:bg-navy-950">
      <div className="card w-full max-w-xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between"><EfieLogo /><Button variant="ghost" size="sm" icon={LogOut} onClick={signOut}>Sign out</Button></div>
        <h1 className="font-display text-2xl font-semibold">Finish setting up</h1>
        <p className="mt-1 text-sm text-slate-500">Signed in as {email?.replace(/@phone\.efiewura\.app$/, '')}. Tell us who you are.</p>
        {!role ? (
          <div className="mt-6 space-y-3">
            {ROLES.map((r) => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)} className="flex w-full items-center gap-4 rounded-2xl border border-ivory-200 p-4 text-left hover:border-brand-400 dark:border-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white"><r.icon className="h-5 w-5" /></span>
                <span><span className="block font-bold">{r.title}</span><span className="text-xs text-slate-500">{r.text}</span></span>
              </button>
            ))}
            {reserved && !adminExists && (
              <button type="button" onClick={() => setRole('admin')} className={cx('flex w-full items-center gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left dark:bg-amber-500/10')}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white"><Crown className="h-5 w-5" /></span>
                <span><span className="block font-bold">Efie Wura Super Admin</span><span className="text-xs text-slate-500">Reserved for this email</span></span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {role === 'admin' ? <Field label="Your name"><Input value={v.name || ''} onChange={(e) => set({ name: e.target.value })} placeholder="Efie Wura HQ" /></Field> : <RoleForm role={role} v={v} set={set} />}
            <div className="flex justify-between"><Button variant="secondary" icon={ArrowLeft} onClick={() => setRole(null)}>Back</Button><Button disabled={busy} onClick={go}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Continue</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}
