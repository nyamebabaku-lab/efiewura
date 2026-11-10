import { Download } from 'lucide-react';
import { useStore } from '../../data/store';
import { PageHeader, DataTable, Button } from '../../components/ui';
import { money, fmtDateTime, downloadCSV } from '../../lib/format';
import { METHOD_LABEL } from '../../lib/billing';
import { Method } from '../shared/bits';

export default function AdminTransactions() {
  const s = useStore();
  const O = Object.fromEntries(s.owners.map((o) => [o.id, o]));
  const T = Object.fromEntries(s.tenants.map((t) => [t.id, t]));
  const rows = s.payments.filter((p) => p.online).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <PageHeader title="Transactions" subtitle="Every rent payment made online through Efie Wura" actions={<Button variant="secondary" icon={Download} onClick={() => downloadCSV('transactions', rows.map((p) => ({ Date: fmtDateTime(p.at), Ref: p.ref, Owner: O[p.ownerId]?.company, Tenant: T[p.tenantId]?.name, Method: METHOD_LABEL[p.method], Payer: p.payer, Amount: p.amount, Fee: p.fee, Net: p.net })))}>Export</Button>} />
      <DataTable rows={rows} searchText={(p) => `${p.ref} ${O[p.ownerId]?.company} ${T[p.tenantId]?.name} ${p.payer}`} columns={[
        { key: 'at', label: 'Date', render: (p) => fmtDateTime(p.at) },
        { key: 'ref', label: 'Ref', render: (p) => <span className="font-mono text-xs">{p.ref}</span> },
        { key: 'owner', label: 'Owner', render: (p) => O[p.ownerId]?.company },
        { key: 'tenant', label: 'Tenant', hideOnMobile: true, render: (p) => T[p.tenantId]?.name },
        { key: 'method', label: 'Method', hideOnMobile: true, render: (p) => <Method m={p.method} /> },
        { key: 'amount', label: 'Amount', render: (p) => <b>{money(p.amount)}</b> },
        { key: 'fee', label: 'Fee', render: (p) => <span className="text-emerald-600">{money(p.fee)}</span> },
      ]} />
    </div>
  );
}
