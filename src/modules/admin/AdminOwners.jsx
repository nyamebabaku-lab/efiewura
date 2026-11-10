import { useState } from 'react';
import { CheckCircle2, Ban, RotateCcw, Eye } from 'lucide-react';
import { useStore } from '../../data/store';
import { PageHeader, DataTable, Button, Modal, KeyValue, Segmented, toast, confirmDialog, Badge } from '../../components/ui';
import { CompanyLogo } from '../../components/layout/Logo';
import { wallet } from '../../lib/billing';
import { money, fmtDate, sum } from '../../lib/format';
import { Status } from '../shared/bits';

export default function AdminOwners() {
  const s = useStore();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(null);
  const rows = s.owners.map((o) => ({ ...o, units: s.units.filter((u) => u.ownerId === o.id).length, props: s.properties.filter((p) => p.ownerId === o.id).length, volume: sum(s.payments.filter((p) => p.ownerId === o.id && p.online), (p) => p.amount), wallet: wallet(s, o.id).balance }));
  const list = rows.filter((o) => filter === 'all' || o.status === filter);
  const setStatus = async (o, status) => {
    if (status === 'suspended' && !(await confirmDialog('Suspend owner?', `${o.company || o.contactName}, their staff and tenants lose access until you restore it.`))) return;
    try { await s.setOwnerStatus(o.id, status); } catch (e) { toast.error('Not changed', e.message); return; }
    toast.success(status === 'approved' ? 'Owner approved' : status === 'suspended' ? 'Owner suspended' : 'Owner restored');
    setView(null);
  };
  const o = view && rows.find((x) => x.id === view);
  return (
    <div>
      <PageHeader title="Property owners" subtitle="Verify Ghana Card & business details before switching on online rent and payouts" />
      <DataTable rows={list} onRowClick={(r) => setView(r.id)} searchText={(r) => `${r.company} ${r.contactName} ${r.phone} ${r.email}`}
        toolbar={<Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'suspended', label: 'Suspended' }]} />}
        columns={[
          { key: 'company', label: 'Company', render: (r) => <div className="flex items-center gap-3"><CompanyLogo owner={r} size="sm" /><div><p className="font-semibold">{r.company || <i className="text-slate-400">Not set up yet</i>}</p><p className="text-xs text-slate-500">{r.contactName} · {r.phone}</p></div></div> },
          { key: 'plan', label: 'Plan', render: (r) => <Badge tone="brand" className="capitalize">{r.plan}</Badge> },
          { key: 'units', label: 'Units', hideOnMobile: true, render: (r) => `${r.units} in ${r.props} properties` },
          { key: 'volume', label: 'Online rent', hideOnMobile: true, render: (r) => money(r.volume) },
          { key: 'wallet', label: 'Wallet', hideOnMobile: true, render: (r) => money(r.wallet) },
          { key: 'status', label: 'Status', render: (r) => <Status s={r.status} /> },
          { key: 'a', label: '', nosort: true, render: (r) => r.status === 'pending' && <Button size="sm" icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); setStatus(r, 'approved'); }}>Approve</Button> },
        ]} />
      <Modal open={!!o} onClose={() => setView(null)} title={o?.company || o?.contactName} subtitle={o && `Registered ${fmtDate(o.createdAt)} · code ${o.code}`} size="lg"
        footer={o && <>
          {o.status !== 'suspended' && <Button variant="soft-red" icon={Ban} onClick={() => setStatus(o, 'suspended')}>Suspend</Button>}
          {o.status === 'suspended' && <Button variant="secondary" icon={RotateCcw} onClick={() => setStatus(o, 'approved')}>Restore</Button>}
          {o.status === 'pending' && <Button icon={CheckCircle2} onClick={() => setStatus(o, 'approved')}>Approve owner</Button>}
        </>}>
        {o && (
          <div className="space-y-5">
            <div className="flex items-center gap-4"><CompanyLogo owner={o} size="lg" /><div><p className="font-display text-xl font-semibold">{o.company || 'No company name yet'}</p><p className="text-sm text-slate-500">{o.tagline}</p><div className="mt-1 flex gap-1.5"><Status s={o.status} />{o.setupDone ? <Badge tone="green">Branding done</Badge> : <Badge tone="amber">Branding not finished</Badge>}</div></div></div>
            <KeyValue items={[['Contact', o.contactName], ['Phone', o.phone], ['Email', o.email], ['Address', o.address], ['Ghana Card', o.kyc.ghanaCard], ['Business reg.', o.kyc.businessReg], ['TIN', o.kyc.tin], ['Plan', o.plan], ['Units', o.units], ['Online rent', money(o.volume)], ['Wallet balance', money(o.wallet)], ['Payout accounts', o.payoutAccounts.map((a) => (a.kind === 'bank' ? `${a.bank} ${a.number}` : `${a.network.toUpperCase()} ${a.number}`)).join(', ')]]} />
            {o.status === 'pending' && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Check the Ghana Card with NIA and the business registration with ORC before approving. Once approved, tenants can pay this owner online and the owner can withdraw.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
