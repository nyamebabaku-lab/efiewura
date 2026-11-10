import { addMonths, format, startOfMonth, parseISO, differenceInCalendarDays } from 'date-fns';
import { sum, round2 } from './format';
import { balance, invoiceStatus, leaseEnd, daysLeft } from './billing';

export function monthly(payments, invoices, months = 12) {
  const start = startOfMonth(addMonths(new Date(), -(months - 1)));
  return Array.from({ length: months }, (_, i) => {
    const m = addMonths(start, i);
    const k = format(m, 'yyyy-MM');
    return {
      key: k,
      month: format(m, 'MMM'),
      label: format(m, 'MMM yyyy'),
      collected: round2(sum(payments.filter((p) => p.at.startsWith(k)), (p) => p.amount)),
      billed: round2(sum(invoices.filter((x) => !x.void && x.due.startsWith(k)), (x) => x.amount)),
    };
  });
}

export const arrearsOf = (invoices) => invoices.filter((i) => invoiceStatus(i) === 'overdue');
export const arrearsTotal = (invoices) => round2(sum(arrearsOf(invoices), balance));

/** Tenants grouped with how much they owe, biggest first. */
export function debtors(invoices, T, U) {
  const by = {};
  arrearsOf(invoices).forEach((i) => {
    const d = (by[i.tenantId] ||= { tenant: T[i.tenantId], unit: U[i.unitId], owed: 0, oldest: i.due, count: 0 });
    d.owed = round2(d.owed + balance(i));
    d.count += 1;
    if (i.due < d.oldest) d.oldest = i.due;
  });
  return Object.values(by).filter((d) => d.tenant).map((d) => ({ ...d, days: differenceInCalendarDays(new Date(), parseISO(d.oldest)) })).sort((a, b) => b.owed - a.owed);
}

export const expiring = (leases, within = 60) => leases.filter((l) => l.status === 'active' && daysLeft(l) <= within).map((l) => ({ ...l, end: leaseEnd(l), left: daysLeft(l) })).sort((a, b) => a.left - b.left);

export function occupancy(units) {
  const occ = units.filter((u) => u.status === 'occupied').length;
  return { occ, total: units.length, pct: units.length ? Math.round((occ / units.length) * 100) : 0, vacant: units.filter((u) => u.status === 'vacant').length, repair: units.filter((u) => u.status === 'repair').length };
}

export const thisMonth = () => format(new Date(), 'yyyy-MM');
