import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../../data/store';
import { PageHeader, DataTable, Button, Segmented, StatCard, Modal, Field, Input, toast } from '../../components/ui';
import { money, fmtDateTime, sum } from '../../lib/format';
import { wallet } from '../../lib/billing';
import { Status } from '../shared/bits';

export default function AdminPayouts() {
  const s = useStore();
  const [filter, setFilter] = useState('pending');
  const [reject, setReject] = useState(null);
  const O = Object.fromEntries(s.owners.map((o) => [o.id, o]));
  const rows = [...s.withdrawals].sort((a, b) => b.at.localeCompare(a.at)).filter((w) => filter === 'all' || w.status === filter);
  return (
    <div>
      <PageHeader title="Payouts" subtitle={`Owner withdrawals · amounts over ${money(s.platform.autoLimit)} wait for review`} />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Waiting for review" value={s.withdrawals.filter((w) => w.status === 'pending').length} tone="amber" />
        <StatCard label="Paid out (all time)" value={money(sum(s.withdrawals.filter((w) => w.status === 'paid'), (w) => w.amount))} tone="green" />
        <StatCard label="Payout fees earned" value={money(sum(s.withdrawals.filter((w) => w.status === 'paid'), (w) => w.fee))} tone="gold" />
        <StatCard label="Held in owner wallets" value={money(sum(s.owners, (o) => wallet(s, o.id).balance))} tone="brand" />
      </div>
      <DataTable rows={rows} searchText={(w) => `${O[w.ownerId]?.company} ${w.dest} ${w.ref}`}
        toolbar={<Segmented value={filter} onChange={setFilter} options={[{ value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'paid', label: 'Paid' }, { value: 'rejected', label: 'Rejected' }, { value: 'all', label: 'All' }]} />}
        columns={[
          { key: 'at', label: 'Requested', render: (w) => fmtDateTime(w.at) },
          { key: 'owner', label: 'Owner', render: (w) => <div><p className="font-semibold">{O[w.ownerId]?.company}</p><p className="text-xs text-slate-500">by {w.by}</p></div> },
          { key: 'dest', label: 'To' },
          { key: 'amount', label: 'Amount', render: (w) => <b>{money(w.amount)}</b> },
          { key: 'status', label: 'Status', render: (w) => <Status s={w.status} /> },
          { key: 'a', label: '', nosort: true, render: (w) => w.status === 'pending' && (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setReject({ ...w, reason: '' })}>Decline</Button>
              <Button size="sm" icon={CheckCircle2} onClick={() => { s.decideWithdrawal(w.id, true); toast.success('Payout approved', `${money(w.amount - w.fee)} sent to ${w.dest}`); }}>Approve</Button>
            </div>
          ) },
        ]} />
      <Modal open={!!reject} onClose={() => setReject(null)} title="Decline payout" size="sm" footer={<Button variant="danger" onClick={() => { s.decideWithdrawal(reject.id, false, reject.reason || 'Declined after review'); setReject(null); toast.success('Payout declined', 'The money stays in the owner’s wallet'); }}>Decline</Button>}>
        <Field label="Reason (the owner sees this)"><Input value={reject?.reason || ''} onChange={(e) => setReject({ ...reject, reason: e.target.value })} placeholder="e.g. Account name does not match Ghana Card" /></Field>
      </Modal>
    </div>
  );
}
