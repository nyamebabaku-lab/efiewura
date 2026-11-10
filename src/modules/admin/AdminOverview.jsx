import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Landmark, Building2, Banknote, Coins, Clock, ArrowLeftRight, ChevronRight } from 'lucide-react';
import { useStore } from '../../data/store';
import { PageHeader, StatCard, Card, CardHeader, Button, Badge } from '../../components/ui';
import { CompanyLogo } from '../../components/layout/Logo';
import { monthly } from '../../lib/stats';
import { money, moneyShort, sum, fmtDate } from '../../lib/format';

export default function AdminOverview() {
  const s = useStore();
  const nav = useNavigate();
  const online = s.payments.filter((p) => p.online);
  const series = useMemo(() => monthly(online, [], 12).map((m) => ({ ...m, fees: sum(online.filter((p) => p.at.startsWith(m.key)), (p) => p.fee) + sum(s.subscriptions.filter((x) => x.at.startsWith(m.key)), (x) => x.amount) })), [online, s.subscriptions]);
  const pendingOwners = s.owners.filter((o) => o.status === 'pending');
  const pendingPayouts = s.withdrawals.filter((w) => w.status === 'pending');
  const revenue = sum(online, (p) => p.fee) + sum(s.subscriptions, (x) => x.amount);
  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" subtitle="Everything happening across Efie Wura Pro" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Owners" value={s.owners.length} sub={`${pendingOwners.length} waiting for approval`} icon={Landmark} tone="brand" onClick={() => nav('/owners')} />
        <StatCard label="Units managed" value={s.units.length} sub={`${s.properties.length} properties`} icon={Building2} tone="teal" />
        <StatCard label="Rent processed online" value={moneyShort(sum(online, (p) => p.amount))} icon={Banknote} tone="green" sub="all time" />
        <StatCard label="Platform revenue" value={moneyShort(revenue)} icon={Coins} tone="gold" sub="fees + subscriptions" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Online rent volume" subtitle="Last 12 months" />
          <div className="h-72 p-3">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs><linearGradient id="vol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--brand-600))" stopOpacity={0.35} /><stop offset="1" stopColor="rgb(var(--brand-600))" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(120 113 108 / .15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip formatter={(v, n) => [money(v), n === 'collected' ? 'Volume' : 'Revenue']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area dataKey="collected" stroke="rgb(var(--brand-600))" strokeWidth={2.5} fill="url(#vol)" />
                <Area dataKey="fees" stroke="rgb(var(--accent-500))" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Owners to approve" icon={Clock} action={<Button size="sm" variant="ghost" onClick={() => nav('/owners')}>All <ChevronRight className="h-4 w-4" /></Button>} />
            <div className="px-3 pb-3">
              {pendingOwners.map((o) => <button key={o.id} type="button" onClick={() => nav('/owners')} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-ivory-100 dark:hover:bg-white/5"><CompanyLogo owner={o} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{o.company || o.contactName}</p><p className="text-xs text-slate-500">Registered {fmtDate(o.createdAt)}</p></div><Badge tone="amber">Review</Badge></button>)}
              {!pendingOwners.length && <p className="py-4 text-center text-sm text-slate-500">All caught up.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Payouts to review" icon={ArrowLeftRight} action={<Button size="sm" variant="ghost" onClick={() => nav('/payouts')}>All <ChevronRight className="h-4 w-4" /></Button>} />
            <div className="px-3 pb-3">
              {pendingPayouts.map((w) => <button key={w.id} type="button" onClick={() => nav('/payouts')} className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left hover:bg-ivory-100 dark:hover:bg-white/5"><div><p className="text-sm font-semibold">{s.owners.find((o) => o.id === w.ownerId)?.company}</p><p className="text-xs text-slate-500">{w.dest}</p></div><b>{money(w.amount)}</b></button>)}
              {!pendingPayouts.length && <p className="py-4 text-center text-sm text-slate-500">No payouts waiting.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
