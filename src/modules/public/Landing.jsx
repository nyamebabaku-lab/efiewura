import { useState } from 'react';
import { Building2, Users, Smartphone, Wallet, Palette, ShieldCheck, ArrowRight, KeyRound, UserCog, Crown, Sparkles, CheckCircle2, BellRing, FileSignature, BarChart3, Download } from 'lucide-react';
import { useStore } from '../../data/store';
import { EfieLogo } from '../../components/layout/Logo';
import { Button, cx } from '../../components/ui';
import PayLogo from '../../components/PayLogo';
import Register from './Register';
import { AuthModal } from './LiveAuth';
import { LIVE, DEMO_SITE, APKS } from '../../config';
import { useInstall } from '../../lib/install';

const DEMOS = [
  { id: 'u_owner', icon: Building2, title: 'Property Owner', who: 'Ama · Adom Properties Ltd', text: '5 properties, 38 units, wallet & withdrawals', tone: 'from-blue-600 to-blue-800' },
  { id: 'u_new', icon: Sparkles, title: 'New Owner (first login)', who: 'Kwesi Mensah', text: 'See the branding set-up: logo, colours, company name', tone: 'from-amber-500 to-orange-600' },
  { id: 'u_mgr', icon: UserCog, title: 'Property Manager', who: 'Kofi · works for Adom', text: 'Only assigned properties, no wallet access', tone: 'from-teal-600 to-emerald-700' },
  { id: 'u_tenant', icon: KeyRound, title: 'Tenant', who: 'Efua · Adom Court A2', text: 'Pay rent with MoMo, receipts, repairs, e-sign lease', tone: 'from-rose-500 to-pink-700' },
  { id: 'u_admin', icon: Crown, title: 'Super Admin', who: 'Efie Wura HQ', text: 'Approve owners, payouts, fees and plans', tone: 'from-emerald-700 to-[#072e25]' },
];

const FEATURES = [
  [Building2, 'Properties & units', 'Apartments, compound houses, shops, offices and hostels — all in one place with occupancy at a glance.'],
  [Users, 'Tenants & tenancies', 'Ghana Card details, tenancy agreements with e-signature, renewals and expiry alerts.'],
  [Smartphone, 'Rent by MoMo or card', 'Monthly, quarterly, yearly or 2-year advance. Part-payments allowed. Instant receipts.'],
  [Wallet, 'Owner wallet & payouts', 'Online rent lands in your wallet. Withdraw to MTN, Telecel, AT Money or any bank.'],
  [Palette, 'Your brand, your app', 'Upload your logo, pick your colours and fonts. Tenants see your company, not ours.'],
  [BellRing, 'SMS reminders', 'Automatic due-date and overdue reminders, receipts and notices by SMS.'],
  [FileSignature, 'Repairs & expenses', 'Tenants report issues with photos; you assign, track costs and stay on top.'],
  [BarChart3, 'Reports', 'Income, arrears, occupancy and profit per property. Export to Excel or PDF.'],
];

export default function Landing() {
  const login = useStore((s) => s.login);
  const [reg, setReg] = useState(false);
  const [auth, setAuth] = useState(null);
  const openReg = () => (LIVE ? setAuth('signup') : setReg(true));
  const install = useInstall();
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-navy-950">
      <section className="relative overflow-hidden bg-[#072e25] text-white">
        <div className="hero-glow absolute inset-0" style={{ '--accent-400': '226 178 50', '--brand-400': '58 151 121' }} />
        <div className="kente-soft absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pb-24">
          <div className="flex items-center justify-between gap-3">
            <EfieLogo light />
            <div className="flex items-center gap-2">
              {install.canInstall && <Button variant="ghost" size="sm" icon={Download} className="!text-white hover:!bg-white/10" onClick={install.prompt}>Install app</Button>}
              {LIVE && <Button size="sm" variant="ghost" className="!text-white hover:!bg-white/10" onClick={() => setAuth('signin')}>Sign in</Button>}
              <Button size="sm" className="!bg-[#e2b232] !text-[#072e25] hover:!bg-[#ecc552]" onClick={openReg}>{LIVE ? 'Create account' : 'Register'}</Button>
            </div>
          </div>
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#ecc552] ring-1 ring-white/15"><span className="h-1.5 w-1.5 rounded-full bg-[#ecc552]" /> Made for Ghanaian landlords</p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl" style={{ fontFamily: 'Fraunces, serif' }}>
                Collect rent. <span className="text-[#ecc552]">Not excuses.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                <b className="text-white">Efie Wura</b> means “house owner”. Manage your properties and tenants, take rent by MoMo or card, and withdraw to your MoMo or bank — under your own brand, on any phone or computer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {LIVE ? (
                  <Button size="lg" className="!bg-[#e2b232] !text-[#072e25] hover:!bg-[#ecc552]" icon={ArrowRight} onClick={() => setAuth('signin')}>Sign in</Button>
                ) : (
                  <Button size="lg" className="!bg-[#e2b232] !text-[#072e25] hover:!bg-[#ecc552]" icon={ArrowRight} onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>Try the live demo</Button>
                )}
                <Button size="lg" variant="ghost" className="!text-white ring-1 ring-white/25 hover:!bg-white/10" onClick={openReg}>Register your business</Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                {['mtn', 'telecel', 'at', 'card'].map((m) => <PayLogo key={m} method={m} className="h-8 w-12" />)}
                <span className="ml-1 text-xs text-white/60">Works on Android, iPhone & desktop</span>
              </div>
            </div>
            <HeroPreview />
          </div>
        </div>
        <div className="kente h-1.5" style={{ '--accent-400': '226 178 50', '--brand-700': '11 74 58' }} />
      </section>

      {LIVE ? (
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a87b16]">Get started</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#072e25] dark:text-white">One app for everyone</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[[Building2, 'Property owners', 'Register your company, add properties and units, move tenants in and collect rent online.', 'Register your business'], [KeyRound, 'Tenants', 'Your landlord gives you a 6-letter company code. Sign up with the phone number they saved for you.', 'Join as a tenant'], [UserCog, 'Managers & caretakers', 'The owner invites you by SMS. Sign up with the company code and your phone number.', 'Join as staff']].map(([Icon, t, d, cta]) => (
            <div key={t} className="card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f604a] text-white"><Icon className="h-6 w-6" /></div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{t}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{d}</p>
              <button type="button" onClick={() => setAuth('signup')} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0f604a] dark:text-emerald-300">{cta} <ArrowRight className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-[var(--radius)] bg-[#072e25] p-6 text-white">
          <p className="flex items-center gap-2 font-bold"><Download className="h-5 w-5 text-[#ecc552]" /> Get the Android apps</p>
          <p className="mt-1 text-sm text-white/70">On iPhone, open this website in Safari → Share → Add to Home Screen.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.values(APKS).map((a) => (
              <a key={a.name} href={a.url} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 transition hover:bg-white/15">
                <p className="font-bold">{a.name}</p>
                <p className="text-xs text-white/60">{a.who}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#ecc552]"><Download className="h-3.5 w-3.5" /> Download APK</p>
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-500">Just looking? <a href={DEMO_SITE} className="font-semibold text-[#0f604a] underline dark:text-emerald-300">Try the demo with sample data</a>.</p>
      </section>
      ) : (
      <section id="demo" className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a87b16]">One-click demo</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#072e25] dark:text-white">Step inside as…</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Every role uses the same sample data, so a payment made as the tenant shows up instantly in the owner’s wallet and the Super Admin’s transactions.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((d) => (
            <button key={d.id} type="button" onClick={() => login(d.id)} className="group card relative overflow-hidden p-5 text-left transition hover:-translate-y-1 hover:shadow-lift">
              <div className={cx('mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', d.tone)}><d.icon className="h-6 w-6" /></div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</p>
              <p className="text-xs font-semibold text-slate-400">{d.who}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{d.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0f604a] dark:text-emerald-300">Enter <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </button>
          ))}
          <button type="button" onClick={openReg} className="card flex flex-col items-center justify-center border-2 border-dashed border-ivory-300 p-5 text-center transition hover:border-[#0f604a]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory-200 text-[#0f604a] dark:bg-white/10"><Building2 className="h-6 w-6" /></div>
            <p className="font-bold text-slate-900 dark:text-white">Register as a new owner</p>
            <p className="mt-1 text-sm text-slate-500">Create your company and set up your brand</p>
          </button>
        </div>
      </section>
      )}

      <section className="border-y border-ivory-200 bg-white py-14 dark:border-white/5 dark:bg-navy-900">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-[#072e25] dark:text-white">Everything a landlord needs</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([Icon, t, d]) => (
              <div key={t}>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f3ee] text-[#0f604a] dark:bg-emerald-500/10 dark:text-emerald-300"><Icon className="h-5 w-5" /></div>
                <p className="mt-3 font-bold text-slate-900 dark:text-white">{t}</p>
                <p className="mt-1 text-sm text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-[#072e25] dark:text-white">Simple pricing</h2>
        <p className="mt-2 text-sm text-slate-500">Plus a small {useStore.getState().platform.feePct}% fee on rent paid online. Cash and bank records are free.</p>
        <Plans />
      </section>

      <footer className="bg-[#072e25] py-8 text-center text-xs text-white/60">
        <div className="mx-auto mb-3 flex justify-center"><EfieLogo light /></div>
        <p className="flex items-center justify-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {LIVE ? 'Secure payments by Paystack & Hubtel' : 'Demo version · data stays in this browser'} · © {new Date().getFullYear()} Efie Wura Pro</p>
      </footer>
      <Register open={reg} onClose={() => setReg(false)} />
      {LIVE && <AuthModal open={!!auth} start={auth || 'signin'} onClose={() => setAuth(null)} />}
    </div>
  );
}

function Plans() {
  const plans = useStore((s) => s.platform.plans);
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {plans.map((p, i) => (
        <div key={p.id} className={cx('card p-6', i === 1 && 'ring-2 ring-[#c99a1e]')}>
          <div className="flex items-center justify-between"><p className="font-bold text-slate-900 dark:text-white">{p.name}</p>{i === 1 && <span className="chip bg-[#faeec6] text-[#6e4a18]">Popular</span>}</div>
          <p className="mt-3 text-3xl font-extrabold text-[#072e25] dark:text-white">{p.price ? `GH₵ ${p.price}` : 'Free'}<span className="text-sm font-medium text-slate-400">{p.price ? ' / month' : ''}</span></p>
          <ul className="mt-4 space-y-2">{p.perks.map((x) => <li key={x} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle2 className="h-4 w-4 text-[#0f604a] dark:text-emerald-400" /> {x}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[40px] bg-[#e2b232]/20 blur-3xl" />
      <div className="relative animate-float rounded-[28px] bg-white p-5 text-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e40af] font-bold text-white">AP</div>
          <div><p className="text-sm font-bold">Adom Properties Ltd</p><p className="text-xs text-slate-400">Good morning, Ama</p></div>
        </div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#172e7a] p-4 text-white">
          <p className="text-xs text-white/70">Wallet balance</p>
          <p className="mt-1 text-3xl font-extrabold">GH₵ 17,910.84</p>
          <div className="mt-3 flex gap-2"><span className="rounded-full bg-[#e2b232] px-3 py-1 text-xs font-bold text-[#172e7a]">Withdraw</span><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">To MoMo · Bank</span></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['92%', 'Occupied'], ['38', 'Units'], ['GH₵ 9.6k', 'Arrears']].map(([v, l]) => <div key={l} className="rounded-xl bg-slate-50 p-2"><p className="text-sm font-extrabold">{v}</p><p className="text-[10px] text-slate-400">{l}</p></div>)}
        </div>
        <div className="mt-4 space-y-2">
          {[['Efua Asante', 'A2 · Adom Court', 'GH₵ 4,500', 'mtn'], ['Kojo Badu', 'Shop 3 · Osu', 'GH₵ 7,800', 'telecel']].map(([n, u, a, m]) => (
            <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
              <PayLogo method={m} className="h-8 w-11" />
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{n}</p><p className="text-[10px] text-slate-400">{u}</p></div>
              <p className="text-xs font-extrabold text-emerald-600">+{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
