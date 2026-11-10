// First-login set-up every owner must finish: company name, logo, colours and style.
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Image, Palette, Sparkles, PartyPopper, LogOut } from 'lucide-react';
import { useStore } from '../../data/store';
import { useMe } from '../../lib/session';
import { Button, Field, Input, cx, toast } from '../../components/ui';
import { EfieLogo } from '../../components/layout/Logo';
import { LogoPicker, ColourPicker, StylePicker, BrandPreview } from './BrandEditor';

const STEPS = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'logo', label: 'Logo', icon: Image },
  { key: 'colours', label: 'Colours', icon: Palette },
  { key: 'style', label: 'Style', icon: Sparkles },
];

export default function SetupWizard() {
  const { owner, user } = useMe();
  const saveBranding = useStore((s) => s.saveBranding);
  const update = useStore((s) => s.update);
  const logout = useStore((s) => s.logout);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const set = (patch) => saveBranding(owner.id, patch);
  const setTheme = (patch) => saveBranding(owner.id, { theme: patch });

  const next = () => {
    if (step === 0 && !owner.company?.trim()) return toast.error('Company name needed', 'Your tenants will see this name on receipts and in the app.');
    if (step === 1 && !owner.logo) return toast.error('Please upload your logo', 'Every owner’s app carries their own logo.');
    if (step < STEPS.length - 1) return setStep(step + 1);
    setDone(true);
    return null;
  };

  if (done)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950 p-6 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 animate-pop items-center justify-center rounded-3xl bg-accent-400 text-brand-950"><PartyPopper className="h-10 w-10" /></div>
          <h1 className="font-display text-3xl font-semibold">{owner.company} is ready!</h1>
          <p className="mt-3 text-white/75">Your app now carries your logo and colours. Next, add your first property and its units — then invite tenants with your company code <b className="rounded bg-white/15 px-1.5 font-mono">{owner.code}</b>.</p>
          <Button size="lg" className="mt-8 !bg-accent-400 !text-brand-950" icon={ArrowRight} onClick={() => update('owners', owner.id, { setupDone: true })}>Go to my dashboard</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-navy-950">
      <header className="border-b border-ivory-200 bg-white/80 backdrop-blur dark:border-white/5 dark:bg-navy-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <EfieLogo />
          <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Sign out</Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold text-brand-600">Welcome, {user.name.split(' ')[0]} 👋</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Make Efie Wura your own</h1>
        <p className="mt-1 text-sm text-slate-500">Your tenants and staff will see your company name, logo and colours everywhere — on the app, receipts and tenancy agreements.</p>

        <ol className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button type="button" onClick={() => i < step && setStep(i)} className={cx('flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition', i === step ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25' : i < step ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200' : 'bg-white text-slate-400 dark:bg-white/5')}>
                <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', i === step ? 'bg-white/25' : 'bg-black/5 dark:bg-white/10')}>{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="card p-5 sm:p-6">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name *" className="sm:col-span-2"><Input autoFocus value={owner.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Mensah Homes Ltd" /></Field>
                <Field label="Tagline" className="sm:col-span-2" hint="A short line under your name"><Input value={owner.tagline || ''} onChange={(e) => set({ tagline: e.target.value })} placeholder="e.g. Comfortable homes in Dansoman" /></Field>
                <Field label="Phone"><Input value={owner.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
                <Field label="Email"><Input value={owner.email} onChange={(e) => set({ email: e.target.value })} /></Field>
                <Field label="Office address / GPS" className="sm:col-span-2"><Input value={owner.address} onChange={(e) => set({ address: e.target.value })} /></Field>
              </div>
            )}
            {step === 1 && <LogoPicker value={owner.logo} owner={owner} onChange={(logo) => set({ logo })} />}
            {step === 2 && <ColourPicker theme={owner.theme} onChange={setTheme} />}
            {step === 3 && <StylePicker theme={owner.theme} onChange={setTheme} />}
            <div className="mt-8 flex items-center justify-between border-t border-ivory-200 pt-5 dark:border-white/5">
              <Button variant="secondary" icon={ArrowLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
              <Button onClick={next}>{step === STEPS.length - 1 ? 'Finish set-up' : 'Continue'} <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="label">Live preview</p>
            <BrandPreview owner={owner} />
            <p className="mt-3 text-center text-xs text-slate-500">You can change all of this later in Settings → Branding.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
