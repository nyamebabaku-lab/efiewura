import { useStore } from '../../data/store';
import { PageHeader, Card, CardHeader, Field, Input, Button, toast, confirmDialog } from '../../components/ui';
import { RotateCcw, FlaskConical } from 'lucide-react';

export default function AdminPlatform() {
  const s = useStore();
  const p = s.platform;
  const set = (patch) => useStore.setState((st) => ({ platform: { ...st.platform, ...patch } }));
  const setPlan = (id, patch) => set({ plans: p.plans.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  return (
    <div className="space-y-6">
      <PageHeader title="Fees & plans" subtitle="Changes apply to every owner straight away" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Transaction & payout fees" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Fee on online rent (%)" hint="Taken from each MoMo/card payment"><Input type="number" step="0.1" value={p.feePct} onChange={(e) => set({ feePct: Number(e.target.value) })} /></Field>
            <Field label="Grace days (default)"><Input type="number" value={p.graceDays} onChange={(e) => set({ graceDays: Number(e.target.value) })} /></Field>
            <Field label="MoMo payout fee (GH₵)"><Input type="number" value={p.payoutFees.momo} onChange={(e) => set({ payoutFees: { ...p.payoutFees, momo: Number(e.target.value) } })} /></Field>
            <Field label="Bank payout fee (GH₵)"><Input type="number" value={p.payoutFees.bank} onChange={(e) => set({ payoutFees: { ...p.payoutFees, bank: Number(e.target.value) } })} /></Field>
            <Field label="Minimum withdrawal (GH₵)"><Input type="number" value={p.minWithdraw} onChange={(e) => set({ minWithdraw: Number(e.target.value) })} /></Field>
            <Field label="Auto-approve payouts up to (GH₵)"><Input type="number" value={p.autoLimit} onChange={(e) => set({ autoLimit: Number(e.target.value) })} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Subscription plans" />
          <div className="space-y-4 p-5">
            {p.plans.map((pl) => (
              <div key={pl.id} className="grid grid-cols-3 gap-3 rounded-xl border border-ivory-200 p-3 dark:border-white/10">
                <Field label="Plan"><Input value={pl.name} onChange={(e) => setPlan(pl.id, { name: e.target.value })} /></Field>
                <Field label="GH₵ / month"><Input type="number" value={pl.price} onChange={(e) => setPlan(pl.id, { price: Number(e.target.value) })} /></Field>
                <Field label="Max units"><Input type="number" value={pl.units} onChange={(e) => setPlan(pl.id, { units: Number(e.target.value) })} /></Field>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4" /> Test mode</p>
          <p className="mt-1 text-xs text-slate-500">While on, a banner tells everyone payments are simulated. In the live app this switches between the payment provider’s test and live keys.</p>
          <Button className="mt-3" variant={p.testMode ? 'primary' : 'secondary'} onClick={() => { set({ testMode: !p.testMode }); toast.success(p.testMode ? 'Test mode off' : 'Test mode on'); }}>{p.testMode ? 'Turn test mode off' : 'Turn test mode on'}</Button>
        </Card>
        <Card className="p-5">
          <p className="font-semibold">Reset demo data</p>
          <p className="mt-1 text-xs text-slate-500">Restores all sample owners, tenants and payments in this browser.</p>
          <Button className="mt-3" variant="soft-red" icon={RotateCcw} onClick={async () => (await confirmDialog('Reset the demo?', 'All changes in this browser are lost.')) && s.resetDemo()}>Reset demo</Button>
        </Card>
      </div>
    </div>
  );
}
