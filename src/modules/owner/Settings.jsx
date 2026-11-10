import { useState } from 'react';
import { Palette, Building2, Scale, MessageSquare, Crown, RotateCcw, CheckCircle2, ShieldCheck, Clock, Copy, Smartphone } from 'lucide-react';
import PaymentsTab from './PaymentsTab';
import { LIVE } from '../../config';
import { useStore } from '../../data/store';
import { useMe } from '../../lib/session';
import { PageHeader, Tabs, Card, CardHeader, Field, Input, Textarea, Button, Badge, toast, confirmDialog, cx } from '../../components/ui';
import { LogoPicker, ColourPicker, StylePicker, BrandPreview } from '../shared/BrandEditor';
import { TermsEditor, DEFAULT_TERMS } from '../shared/Lease';
import PayModal from '../../components/PayModal';
import { payOnline } from '../../lib/pay';
import { wallet } from '../../lib/billing';
import { money, fmtDate } from '../../lib/format';

export default function Settings() {
  const { owner } = useMe();
  const s = useStore();
  const [tab, setTab] = useState('brand');
  const set = (patch) => s.saveBranding(owner.id, patch);
  const setSettings = (patch) => s.update('owners', owner.id, (o) => ({ settings: { ...o.settings, ...patch } }));
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your brand, business details, rent rules and plan" />
      <Tabs value={tab} onChange={setTab} className="mb-6" tabs={[{ value: 'brand', label: 'Branding', icon: Palette }, { value: 'payments', label: 'Payments', icon: Smartphone }, { value: 'business', label: 'Business', icon: Building2 }, { value: 'rules', label: 'Rent rules', icon: Scale }, { value: 'sms', label: 'SMS', icon: MessageSquare }, { value: 'plan', label: 'Plan', icon: Crown }]} />

      {tab === 'brand' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name"><Input value={owner.company} onChange={(e) => set({ company: e.target.value })} /></Field>
                <Field label="Tagline"><Input value={owner.tagline || ''} onChange={(e) => set({ tagline: e.target.value })} /></Field>
              </div>
              <div className="mt-5"><LogoPicker value={owner.logo} owner={owner} onChange={(logo) => (logo ? set({ logo }) : toast.error('A logo is required', 'Upload a new one to replace it.'))} /></div>
            </Card>
            <Card className="p-5 sm:p-6"><ColourPicker theme={owner.theme} onChange={(t) => set({ theme: t })} /></Card>
            <Card className="p-5 sm:p-6"><StylePicker theme={owner.theme} onChange={(t) => set({ theme: t })} /></Card>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="label">Preview</p>
            <BrandPreview owner={owner} />
            <p className="mt-3 text-center text-xs text-slate-500">Changes save automatically and apply for your staff and tenants too.</p>
          </div>
        </div>
      )}

      {tab === 'business' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Contact details" subtitle="Shown on receipts and agreements" icon={Building2} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Contact person"><Input value={owner.contactName} onChange={(e) => set({ contactName: e.target.value })} /></Field>
              <Field label="Phone"><Input value={owner.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
              <Field label="Email" className="sm:col-span-2"><Input value={owner.email} onChange={(e) => set({ email: e.target.value })} /></Field>
              <Field label="Office address / GPS" className="sm:col-span-2"><Input value={owner.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader title="Verification" icon={ShieldCheck} action={owner.status === 'approved' ? <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Verified</Badge> : <Badge tone="amber"><Clock className="h-3 w-3" /> Under review</Badge>} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Ghana Card"><Input value={owner.kyc.ghanaCard} onChange={(e) => set({ kyc: { ...owner.kyc, ghanaCard: e.target.value } })} /></Field>
                <Field label="Business registration"><Input value={owner.kyc.businessReg} onChange={(e) => set({ kyc: { ...owner.kyc, businessReg: e.target.value } })} /></Field>
                <Field label="TIN (GRA)" className="sm:col-span-2"><Input value={owner.kyc.tin} onChange={(e) => set({ kyc: { ...owner.kyc, tin: e.target.value } })} /></Field>
              </div>
            </Card>
            <Card className="p-5">
              <p className="label">Your company code</p>
              <div className="flex items-center gap-3"><p className="rounded-xl bg-brand-50 px-4 py-2 font-mono text-2xl font-bold tracking-widest text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{owner.code}</p><Button variant="ghost" size="sm" icon={Copy} onClick={() => { navigator.clipboard?.writeText(owner.code); toast.success('Copied'); }}>Copy</Button></div>
              <p className="mt-2 text-xs text-slate-500">Tenants enter this code when they first open the app to join your company.</p>
            </Card>
            {!LIVE && <Card className="p-5">
              <p className="font-semibold">Reset demo data</p>
              <p className="mt-1 text-xs text-slate-500">Puts all sample data back the way it started. Only affects this browser.</p>
              <Button className="mt-3" variant="soft-red" icon={RotateCcw} onClick={async () => (await confirmDialog('Reset the demo?', 'All changes in this browser are lost.')) && s.resetDemo()}>Reset demo</Button>
            </Card>}
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Late payment" icon={Scale} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Grace period (days)" hint="Days after the due date before rent counts as late"><Input type="number" value={owner.settings.graceDays} onChange={(e) => setSettings({ graceDays: Number(e.target.value) })} /></Field>
              <Field label="Late fee (%)" hint="0 = no late fee. Added once per late bill."><Input type="number" value={owner.settings.lateFeePct} onChange={(e) => setSettings({ lateFeePct: Number(e.target.value) })} /></Field>
              <Field label="Remind tenants (days before due)"><Input type="number" value={owner.settings.reminderDays} onChange={(e) => setSettings({ reminderDays: Number(e.target.value) })} /></Field>
              <label className="flex items-center gap-3 self-end rounded-xl border border-ivory-200 p-3 text-sm dark:border-white/10"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={owner.settings.autoReminders} onChange={(e) => setSettings({ autoReminders: e.target.checked })} /> Send reminders automatically</label>
            </div>
          </Card>
          <Card>
            <CardHeader title="Tenancy agreement terms" subtitle="One clause per line" />
            <div className="space-y-3 p-5">
              <TermsEditor value={owner.settings.leaseTerms} onChange={(v) => setSettings({ leaseTerms: v })} />
              <Button variant="ghost" size="sm" onClick={() => setSettings({ leaseTerms: DEFAULT_TERMS })}>Restore default terms</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'sms' && (
        <Card className="max-w-3xl">
          <CardHeader title="SMS settings" subtitle="Placeholders: {name} {amount} {unit} {due} {ref} {company}" icon={MessageSquare} />
          <div className="space-y-4 p-5">
            <Field label="Sender ID" hint="Up to 11 letters — what tenants see as the sender (needs approval by the SMS provider)"><Input maxLength={11} value={owner.settings.smsSender || ''} onChange={(e) => setSettings({ smsSender: e.target.value })} className="max-w-xs uppercase" /></Field>
            {[['reminder', 'Rent reminder'], ['overdue', 'Overdue notice'], ['receipt', 'Payment receipt'], ['expiry', 'Tenancy ending']].map(([k, l]) => (
              <Field key={k} label={l}><Textarea className="!min-h-[72px]" value={owner.settings.templates[k]} onChange={(e) => setSettings({ templates: { ...owner.settings.templates, [k]: e.target.value } })} /></Field>
            ))}
          </div>
        </Card>
      )}

      {tab === 'plan' && <PlanTab />}
      {tab === 'payments' && <PaymentsTab />}
    </div>
  );
}

function PlanTab() {
  const { owner } = useMe();
  const s = useStore();
  const [buy, setBuy] = useState(null);
  const units = s.units.filter((u) => u.ownerId === owner.id).length;
  const w = wallet(s, owner.id);
  const history = s.subscriptions.filter((x) => x.ownerId === owner.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {s.platform.plans.map((p) => {
          const current = owner.plan === p.id;
          const tooSmall = units > p.units;
          return (
            <Card key={p.id} className={cx('flex flex-col p-6', current && 'ring-2 ring-brand-600')}>
              <div className="flex items-center justify-between"><p className="text-lg font-bold">{p.name}</p>{current && <Badge tone="brand">Current plan</Badge>}</div>
              <p className="mt-2 text-3xl font-extrabold">{p.price ? money(p.price) : 'Free'}<span className="text-sm font-medium text-slate-400">{p.price ? ' / month' : ''}</span></p>
              <ul className="mt-4 flex-1 space-y-2">{p.perks.map((x) => <li key={x} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-brand-600" /> {x}</li>)}</ul>
              {current ? <p className="mt-5 text-xs text-slate-500">{owner.planRenews ? `Renews ${fmtDate(owner.planRenews)}` : 'No renewal needed'} · using {units} units</p> : (
                <Button className="mt-5" variant={tooSmall ? 'secondary' : 'primary'} disabled={tooSmall} onClick={async () => { if (p.price) return setBuy(p); try { await s.changePlan(owner.id, p.id); toast.success(`Switched to ${p.name}`); } catch (e) { toast.error('Plan not changed', e.message); } return null; }}>{tooSmall ? `You have ${units} units` : p.price > (s.platform.plans.find((x) => x.id === owner.plan)?.price || 0) ? 'Upgrade' : 'Switch'}</Button>
              )}
            </Card>
          );
        })}
      </div>
      {history.length > 0 && (
        <Card>
          <CardHeader title="Plan payments" />
          <div className="divide-y divide-ivory-200 px-5 pb-3 dark:divide-white/5">{history.map((h) => <div key={h.id} className="flex justify-between py-2.5 text-sm"><span>{fmtDate(h.at)} · {h.plan}</span><span className="font-semibold">{money(h.amount)} <span className="text-xs font-normal text-slate-500">{h.fromWallet ? 'from wallet' : h.method}</span></span></div>)}</div>
        </Card>
      )}
      <PayModal open={!!buy} onClose={() => setBuy(null)} title={`Upgrade to ${buy?.name}`} subtitle="Monthly subscription" amount={buy?.price} editable={false} phone={owner.phone} payee="Efie Wura Pro"
        provider={owner.provider}
        pay={(p, u) => payOnline({ ownerId: owner.id, plan: buy.id, ...p }, u)}
        onDone={() => toast.success(`You’re on ${buy.name} now`)} />
      {buy && w.balance >= buy.price && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <Button className="shadow-lift" variant="secondary" onClick={async () => { try { await s.changePlan(owner.id, buy.id, { fromWallet: true }); setBuy(null); toast.success(`You’re on ${buy.name} now`, 'Paid from your wallet'); } catch (e) { toast.error('Plan not changed', e.message); } }}>Or pay {money(buy.price)} from wallet balance ({money(w.balance)})</Button>
        </div>
      )}
    </div>
  );
}
