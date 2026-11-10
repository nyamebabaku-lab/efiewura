import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Plus, Landmark, Smartphone, Trash2, Star, Clock, CheckCircle2, Info, ArrowDownLeft } from 'lucide-react';
import { useStore } from '../../data/store';
import { useMe } from '../../lib/session';
import { PageHeader, Button, Card, CardHeader, DataTable, Modal, Field, Input, Select, toast, FormModal, Badge, cx, confirmDialog } from '../../components/ui';
import PayLogo from '../../components/PayLogo';
import { wallet, payoutFee } from '../../lib/billing';
import { money, fmtDateTime, round2, sum } from '../../lib/format';
import { Status, Method } from '../shared/bits';

const BANKS = ['GCB Bank', 'Ecobank Ghana', 'Stanbic Bank', 'Absa Bank Ghana', 'Fidelity Bank', 'CalBank', 'Zenith Bank', 'Access Bank', 'Republic Bank', 'Societe Generale', 'ADB', 'NIB', 'Prudential Bank', 'UBA Ghana', 'First Atlantic Bank', 'Consolidated Bank Ghana'];
const accountFields = [
  { name: 'kind', label: 'Account type', type: 'select', options: [{ value: 'momo', label: 'Mobile money' }, { value: 'bank', label: 'Bank account' }], required: true },
  { name: 'network', label: 'Network', type: 'select', options: [{ value: 'mtn', label: 'MTN MoMo' }, { value: 'telecel', label: 'Telecel Cash' }, { value: 'at', label: 'AT Money' }], hidden: (v) => v.kind !== 'momo', required: true },
  { name: 'bank', label: 'Bank', type: 'select', options: BANKS, hidden: (v) => v.kind !== 'bank', required: true },
  { name: 'branch', label: 'Branch', hidden: (v) => v.kind !== 'bank' },
  { name: 'number', label: 'Number', required: true, placeholder: 'MoMo number or account number' },
  { name: 'name', label: 'Account name', required: true, hint: 'Must match the name registered on the account' },
];

export default function WalletPage() {
  const { owner, user } = useMe();
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const [wd, setWd] = useState(false);
  const [acc, setAcc] = useState(false);
  useEffect(() => { if (params.get('withdraw')) { setWd(true); setParams({}, { replace: true }); } }, [params, setParams]);
  const w = wallet(s, owner.id);
  const outs = s.withdrawals.filter((x) => x.ownerId === owner.id).sort((a, b) => b.at.localeCompare(a.at));
  const ins = useMemo(() => s.payments.filter((p) => p.ownerId === owner.id && p.online).sort((a, b) => b.at.localeCompare(a.at)), [s.payments, owner.id]);
  const T = useMemo(() => Object.fromEntries(s.tenants.map((t) => [t.id, t])), [s.tenants]);
  const [tab, setTab] = useState('out');

  const saveAccount = (v) => {
    const list = [...owner.payoutAccounts, { ...v, id: `pa_${Date.now()}`, default: !owner.payoutAccounts.length }];
    s.update('owners', owner.id, { payoutAccounts: list });
    setAcc(false);
    toast.success('Payout account added');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet" subtitle="Rent paid online lands here. Withdraw to MoMo or bank any time." actions={<Button icon={ArrowUpRight} onClick={() => setWd(true)}>Withdraw</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-lift">
          <div className="kente-soft absolute inset-0" />
          <div className="relative">
            <p className="text-sm text-white/70">Available to withdraw</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">{money(w.balance)}</p>
            {w.pending > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-200"><Clock className="h-3.5 w-3.5" /> {money(w.pending)} being paid out</p>}
            <Button className="mt-6 !bg-accent-400 !text-brand-950 hover:!bg-accent-300" icon={ArrowUpRight} onClick={() => setWd(true)}>Withdraw now</Button>
          </div>
        </div>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">All-time</p>
          <div className="mt-3 space-y-3 text-sm">
            <Row label="Rent received online" value={money(w.credits + w.fees)} />
            <Row label={`Efie Wura fee (${s.platform.feePct}%)`} value={`− ${money(w.fees)}`} />
            <Row label="Withdrawn" value={`− ${money(w.withdrawn)}`} />
            <Row label="Plan charges from wallet" value={`− ${money(sum(s.subscriptions.filter((x) => x.ownerId === owner.id && x.fromWallet), (x) => x.amount))}`} />
            <div className="border-t border-ivory-200 pt-3 dark:border-white/10"><Row label="Balance" value={money(w.balance)} bold /></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Payout accounts" icon={Landmark} action={<Button size="sm" variant="soft" icon={Plus} onClick={() => setAcc(true)}>Add</Button>} />
          <div className="space-y-2 p-4">
            {owner.payoutAccounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ivory-200 p-3 dark:border-white/10">
                {a.kind === 'momo' ? <PayLogo method={a.network} className="h-9 w-12" /> : <span className="flex h-9 w-12 items-center justify-center rounded-xl bg-slate-800 text-white"><Landmark className="h-4 w-4" /></span>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.kind === 'bank' ? a.bank : a.number}</p><p className="truncate text-xs text-slate-500">{a.kind === 'bank' ? `${a.number} · ` : ''}{a.name}</p></div>
                {a.default ? <Badge tone="gold">Default</Badge> : (
                  <div className="flex">
                    <button type="button" title="Make default" onClick={() => s.update('owners', owner.id, { payoutAccounts: owner.payoutAccounts.map((x) => ({ ...x, default: x.id === a.id })) })} className="rounded-lg p-1.5 text-slate-400 hover:bg-ivory-200"><Star className="h-4 w-4" /></button>
                    <button type="button" title="Remove" onClick={async () => (await confirmDialog('Remove account?', `${a.number} will no longer receive payouts.`)) && s.update('owners', owner.id, { payoutAccounts: owner.payoutAccounts.filter((x) => x.id !== a.id) })} className="rounded-lg p-1.5 text-slate-400 hover:bg-ivory-200"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            ))}
            {!owner.payoutAccounts.length && <p className="py-6 text-center text-sm text-slate-500">Add a MoMo or bank account to withdraw.</p>}
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        {[['out', 'Withdrawals'], ['in', 'Money in']].map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? 'primary' : 'secondary'} onClick={() => setTab(k)}>{l}</Button>)}
      </div>
      {tab === 'out' ? (
        <DataTable rows={outs} search={false} columns={[
          { key: 'at', label: 'Requested', render: (x) => fmtDateTime(x.at) },
          { key: 'dest', label: 'To' },
          { key: 'amount', label: 'Amount', render: (x) => <b>{money(x.amount)}</b> },
          { key: 'fee', label: 'Fee', hideOnMobile: true, render: (x) => money(x.fee) },
          { key: 'net', label: 'You receive', hideOnMobile: true, render: (x) => money(x.amount - x.fee) },
          { key: 'status', label: 'Status', render: (x) => <div><Status s={x.status} />{x.needsApproval && x.status === 'pending' && <p className="mt-0.5 text-[10px] text-slate-400">Waiting for Efie Wura review</p>}{x.reason && <p className="mt-0.5 text-[10px] text-red-500">{x.reason}</p>}</div> },
        ]} />
      ) : (
        <DataTable rows={ins} columns={[
          { key: 'at', label: 'Date', render: (p) => fmtDateTime(p.at) },
          { key: 'tenant', label: 'From', render: (p) => T[p.tenantId]?.name },
          { key: 'method', label: 'Method', render: (p) => <Method m={p.method} /> },
          { key: 'amount', label: 'Paid', render: (p) => money(p.amount) },
          { key: 'fee', label: 'Fee', hideOnMobile: true, render: (p) => <span className="text-slate-500">− {money(p.fee)}</span> },
          { key: 'net', label: 'To wallet', render: (p) => <b className="text-emerald-600"><ArrowDownLeft className="mr-1 inline h-3.5 w-3.5" />{money(p.net)}</b> },
        ]} />
      )}

      <WithdrawModal open={wd} onClose={() => setWd(false)} owner={owner} balance={w.balance} onDone={(v) => {
        try {
          const r = s.requestWithdrawal({ ownerId: owner.id, amount: v.amount, accountId: v.accountId, by: user.name });
          toast.success(r.needsApproval ? 'Withdrawal sent for review' : 'Withdrawal on its way', r.needsApproval ? `Amounts over ${money(s.platform.autoLimit)} are checked by Efie Wura first.` : `${money(r.amount - r.fee)} to ${r.dest}`);
          setWd(false);
        } catch (e) { toast.error('Withdrawal not sent', e.message); }
      }} onAddAccount={() => { setWd(false); setAcc(true); }} />
      <FormModal open={acc} onClose={() => setAcc(false)} title="Add payout account" fields={accountFields} initial={{ kind: 'momo', network: 'mtn', name: owner.contactName }} onSubmit={saveAccount} size="md" />
    </div>
  );
}

const Row = ({ label, value, bold }) => <div className="flex justify-between gap-3"><span className={cx('text-slate-500', bold && 'font-bold text-slate-900 dark:text-white')}>{label}</span><span className={cx('font-semibold', bold && 'text-lg font-extrabold')}>{value}</span></div>;

function WithdrawModal({ open, onClose, owner, balance, onDone, onAddAccount }) {
  const platform = useStore((s) => s.platform);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [step, setStep] = useState('form');
  const [otp, setOtp] = useState('');
  useEffect(() => { if (open) { setAmount(''); setStep('form'); setOtp(''); setAccountId(owner.payoutAccounts.find((a) => a.default)?.id || owner.payoutAccounts[0]?.id || ''); } }, [open, owner.payoutAccounts]);
  const acc = owner.payoutAccounts.find((a) => a.id === accountId);
  const fee = acc ? payoutFee(platform, acc.kind) : 0;
  const amt = round2(Number(amount) || 0);
  const next = () => {
    if (owner.status !== 'approved') return toast.error('Not yet approved', 'Withdrawals open once Efie Wura has verified your account.');
    if (!acc) return toast.error('Choose where to send the money');
    if (amt < platform.minWithdraw) return toast.error(`Minimum withdrawal is ${money(platform.minWithdraw)}`);
    if (amt > balance) return toast.error('Not enough balance', `You can withdraw up to ${money(balance)}`);
    setStep('otp');
    return toast.info('Code sent', `Demo code: 123456 (sent to ${owner.phone})`);
  };
  return (
    <Modal open={open} onClose={onClose} title="Withdraw money" subtitle={`Available: ${money(balance)}`} size="md"
      footer={step === 'form' ? <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={next}>Continue</Button></> : <><Button variant="secondary" onClick={() => setStep('form')}>Back</Button><Button icon={CheckCircle2} disabled={otp.length !== 6} onClick={() => (otp === '123456' ? onDone({ amount: amt, accountId }) : toast.error('Wrong code', 'Use 123456 in the demo'))}>Confirm withdrawal</Button></>}>
      {step === 'form' ? (
        <div className="space-y-5">
          <Field label="Amount (GH₵)">
            <Input inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-extrabold" placeholder="0.00" />
          </Field>
          <div className="-mt-2 flex flex-wrap gap-2">
            {[500, 1000, 5000].filter((x) => x <= balance).map((x) => <button key={x} type="button" onClick={() => setAmount(x)} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:bg-white/10 dark:text-white">{money(x)}</button>)}
            <button type="button" onClick={() => setAmount(balance)} className="rounded-full bg-accent-100 px-3 py-1.5 text-xs font-semibold text-accent-800">Everything · {money(balance)}</button>
          </div>
          <div>
            <span className="label">Send to</span>
            <div className="space-y-2">
              {owner.payoutAccounts.map((a) => (
                <button key={a.id} type="button" onClick={() => setAccountId(a.id)} className={cx('flex w-full items-center gap-3 rounded-xl border p-3 text-left', accountId === a.id ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/15 dark:bg-brand-500/10' : 'border-ivory-200 dark:border-white/10')}>
                  {a.kind === 'momo' ? <PayLogo method={a.network} className="h-9 w-12" /> : <span className="flex h-9 w-12 items-center justify-center rounded-xl bg-slate-800 text-white"><Landmark className="h-4 w-4" /></span>}
                  <div className="flex-1"><p className="text-sm font-semibold">{a.kind === 'bank' ? `${a.bank} · ${a.number}` : a.number}</p><p className="text-xs text-slate-500">{a.name} · fee {money(payoutFee(platform, a.kind))} · {a.kind === 'momo' ? 'arrives in minutes' : 'same/next working day'}</p></div>
                  {a.kind === 'momo' ? <Smartphone className="h-4 w-4 text-slate-400" /> : <Landmark className="h-4 w-4 text-slate-400" />}
                </button>
              ))}
              <Button variant="ghost" size="sm" icon={Plus} onClick={onAddAccount}>Add an account</Button>
            </div>
          </div>
          {amt > 0 && acc && (
            <div className="rounded-xl bg-ivory-100 p-4 text-sm dark:bg-white/5">
              <Row label="Withdraw" value={money(amt)} />
              <div className="mt-1" /><Row label="Transfer fee" value={`− ${money(fee)}`} />
              <div className="mt-2 border-t border-ivory-300 pt-2 dark:border-white/10"><Row label="You receive" value={money(Math.max(0, amt - fee))} bold /></div>
            </div>
          )}
          {amt > platform.autoLimit && <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Withdrawals above {money(platform.autoLimit)} are reviewed by Efie Wura for your safety — usually within a few hours.</p>}
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">Enter the 6-digit code we sent to <b>{owner.phone}</b> to confirm sending <b>{money(amt)}</b> to <b>{acc?.kind === 'bank' ? acc.bank : acc?.number}</b>.</p>
          <Input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="mx-auto max-w-[220px] text-center text-2xl font-bold tracking-[.5em]" placeholder="••••••" />
          <p className="text-xs text-slate-400">Demo code: 123456</p>
        </div>
      )}
    </Modal>
  );
}
