// Demo data: three owners, 5 properties in Accra/Tema/Kumasi, ~40 units, tenants, leases, invoices,
// payments (mostly MoMo), payouts, maintenance and expenses — all relative to today.
import { addDays, addMonths, format, parseISO } from 'date-fns';
import { leaseInvoices, allocate, ONLINE, balance } from '../lib/billing';
import { monogramLogo, DEFAULT_THEME } from '../lib/theme';
import { round2 } from '../lib/format';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 0, units: 5, perks: ['Up to 5 units', 'Online rent collection', 'Receipts & reminders'] },
  { id: 'growth', name: 'Growth', price: 150, units: 40, perks: ['Up to 40 units', 'Staff accounts', 'Reports & exports', 'SMS reminders'] },
  { id: 'enterprise', name: 'Enterprise', price: 450, units: 100000, perks: ['Unlimited units', 'Priority payouts', 'Dedicated support', 'Custom SMS sender'] },
];

export const PLATFORM = {
  name: 'Efie Wura Pro',
  feePct: 2,
  payoutFees: { momo: 1, bank: 5 },
  minWithdraw: 10,
  autoLimit: 5000,
  graceDays: 5,
  testMode: true,
  plans: PLANS,
};

export const SMS_TEMPLATES = {
  reminder: 'Hello {name}, your rent of {amount} for {unit} is due on {due}. Pay easily with MoMo in the {company} app. Thank you.',
  overdue: 'Dear {name}, your rent balance of {amount} for {unit} is overdue. Kindly pay today to avoid a late fee. – {company}',
  receipt: 'Payment received: {amount} for {unit}. Receipt {ref}. Thank you, {name}! – {company}',
  expiry: 'Hello {name}, your tenancy for {unit} ends on {due}. Reply or call us to renew. – {company}',
};

const FIRST = ['Kwame', 'Ama', 'Kofi', 'Akosua', 'Yaw', 'Abena', 'Kwabena', 'Adwoa', 'Kojo', 'Efua', 'Kwaku', 'Akua', 'Kwesi', 'Esi', 'Nana', 'Afia', 'Selorm', 'Elikem', 'Dzifa', 'Mawuli', 'Naa', 'Nii', 'Fatima', 'Ibrahim', 'Abdul', 'Mariam', 'Delali', 'Seyram', 'Edem', 'Yaa', 'Fiifi', 'Ekow', 'Araba', 'Baaba', 'Komla', 'Sena'];
const LAST = ['Mensah', 'Asante', 'Owusu', 'Boateng', 'Appiah', 'Osei', 'Agyeman', 'Darko', 'Addo', 'Quaye', 'Tetteh', 'Ansah', 'Amoah', 'Badu', 'Frimpong', 'Acheampong', 'Sarpong', 'Danso', 'Asamoah', 'Ofori', 'Adjei', 'Nkrumah', 'Lamptey', 'Kumi', 'Yeboah', 'Gyamfi', 'Amponsah', 'Arthur', 'Annan', 'Kuffour', 'Mahama', 'Issah', 'Abubakar', 'Agbeko', 'Dogbe'];
const JOBS = ['Teacher', 'Nurse', 'Banker', 'Software developer', 'Trader', 'Civil servant', 'Accountant', 'Pharmacist', 'Engineer', 'Student', 'Fashion designer', 'Driver', 'Doctor', 'Marketer', 'Lecturer', 'Lawyer', 'Caterer', 'Mechanic'];

export function buildSeed() {
  const r = rng(20261110);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const now = new Date();
  const day = (n) => format(addDays(now, n), 'yyyy-MM-dd');
  const phone = () => `0${pick(['24', '54', '55', '59', '20', '50', '27', '57', '26'])}${String(Math.floor(r() * 9000000) + 1000000)}`;
  const ghanaCard = () => `GHA-${String(Math.floor(r() * 900000000) + 100000000)}-${Math.floor(r() * 9)}`;

  const owners = [
    {
      id: 'o1', company: 'Adom Properties Ltd', tagline: 'Homes you are proud of', contactName: 'Ama Owusu-Ansah', phone: '0244123456', email: 'ama@adomproperties.com.gh', address: 'No. 12 Lagos Avenue, East Legon, Accra',
      status: 'approved', plan: 'growth', planRenews: day(18), setupDone: true, code: 'ADOM24', provider: 'paystack', createdAt: day(-720),
      logo: monogramLogo('AP', '#1e40af', '#e2b232'), theme: { ...DEFAULT_THEME, brand: '#1e40af', accent: '#e2b232', font: 'Fraunces', sidebar: 'dark' },
      kyc: { ghanaCard: 'GHA-712345678-3', businessReg: 'CS112233445', tin: 'C0012345678' },
      payoutAccounts: [
        { id: 'pa1', kind: 'momo', network: 'mtn', number: '0244123456', name: 'Ama Owusu-Ansah', default: true },
        { id: 'pa2', kind: 'bank', bank: 'GCB Bank', branch: 'East Legon', number: '1021130045678', name: 'Adom Properties Ltd' },
      ],
      settings: { graceDays: 5, lateFeePct: 5, autoReminders: true, reminderDays: 3, smsSender: 'ADOM PROP', templates: SMS_TEMPLATES, currencyNote: '' },
    },
    {
      id: 'o2', company: '', contactName: 'Kwesi Mensah', phone: '0201234567', email: 'kwesi.mensah@gmail.com', address: 'Dansoman, Accra',
      status: 'pending', plan: 'starter', setupDone: false, code: 'KWME51', provider: 'paystack', createdAt: day(-1), logo: '', theme: { ...DEFAULT_THEME },
      kyc: { ghanaCard: 'GHA-723456789-1', businessReg: '', tin: '' }, payoutAccounts: [],
      settings: { graceDays: 5, lateFeePct: 0, autoReminders: true, reminderDays: 3, smsSender: '', templates: SMS_TEMPLATES },
    },
    {
      id: 'o3', company: 'Serwaa Estates', tagline: 'Kumasi living, done right', contactName: 'Serwaa Akoto', phone: '0277654321', email: 'info@serwaaestates.com', address: 'Ahodwo Roundabout, Kumasi',
      status: 'approved', plan: 'starter', setupDone: true, code: 'SERW77', provider: 'hubtel', createdAt: day(-300),
      logo: monogramLogo('SE', '#881337', '#d4a017'), theme: { ...DEFAULT_THEME, brand: '#881337', accent: '#d4a017', font: 'Sora', sidebar: 'brand' },
      kyc: { ghanaCard: 'GHA-734567890-5', businessReg: 'BN998877', tin: '' },
      payoutAccounts: [{ id: 'pa3', kind: 'momo', network: 'telecel', number: '0207654321', name: 'Serwaa Akoto', default: true }],
      settings: { graceDays: 7, lateFeePct: 0, autoReminders: true, reminderDays: 5, smsSender: 'SERWAA', templates: SMS_TEMPLATES },
    },
  ];

  const properties = [
    { id: 'p1', ownerId: 'o1', name: 'Adom Court', type: 'Apartments', city: 'Accra', area: 'East Legon', address: 'Lagos Avenue, East Legon', gps: 'GA-492-7712', amenities: ['24h security', 'Borehole', 'Backup generator', 'Parking', 'CCTV'], hue: 0, createdAt: day(-700) },
    { id: 'p2', ownerId: 'o1', name: 'Adom Heights', type: 'Compound house', city: 'Tema', area: 'Community 25', address: 'Block C, Comm. 25, Tema', gps: 'GT-311-4410', amenities: ['Water storage', 'Prepaid meters', 'Walled & gated'], hue: 1, createdAt: day(-650) },
    { id: 'p3', ownerId: 'o1', name: 'Ahodwo Gardens', type: 'Townhouses', city: 'Kumasi', area: 'Ahodwo', address: 'Off Ahodwo Main Rd, Kumasi', gps: 'AK-039-2281', amenities: ['Garden', 'Parking', 'Security'], hue: 2, createdAt: day(-500) },
    { id: 'p4', ownerId: 'o1', name: 'Osu Shops Plaza', type: 'Commercial', city: 'Accra', area: 'Osu', address: 'Oxford Street, Osu', gps: 'GA-019-5532', amenities: ['Street frontage', 'Washrooms', 'Security'], hue: 3, createdAt: day(-420) },
    { id: 'p5', ownerId: 'o1', name: 'Ayeduase Hostel', type: 'Hostel', city: 'Kumasi', area: 'Ayeduase (KNUST)', address: 'Ayeduase New Site, Kumasi', gps: 'AK-485-9907', amenities: ['Wi-Fi', 'Study room', 'Water', 'Security'], hue: 4, createdAt: day(-380) },
    { id: 'p6', ownerId: 'o3', name: 'Serwaa Villas', type: 'Houses', city: 'Kumasi', area: 'Danyame', address: 'Danyame, Kumasi', gps: 'AK-112-3301', amenities: ['Parking', 'Garden'], hue: 5, createdAt: day(-290) },
  ];

  const units = [];
  const addUnits = (propertyId, ownerId, list) => list.forEach(([label, kind, rent, beds]) => units.push({ id: `u${units.length + 1}`, propertyId, ownerId, label, kind, rent, beds, status: 'vacant' }));
  addUnits('p1', 'o1', [['A1', '2-bedroom apartment', 4500, 2], ['A2', '2-bedroom apartment', 4500, 2], ['A3', '3-bedroom apartment', 6500, 3], ['A4', '3-bedroom apartment', 6500, 3], ['B1', '1-bedroom apartment', 3200, 1], ['B2', '1-bedroom apartment', 3200, 1], ['B3', '2-bedroom apartment', 4800, 2], ['PH', 'Penthouse', 9500, 4]]);
  addUnits('p2', 'o1', [['Rm 1', 'Single room', 450, 1], ['Rm 2', 'Single room', 450, 1], ['Rm 3', 'Chamber & hall', 800, 1], ['Rm 4', 'Chamber & hall', 800, 1], ['Rm 5', 'Chamber & hall S/C', 1100, 1], ['Rm 6', 'Chamber & hall S/C', 1100, 1], ['Rm 7', 'Self-contained', 950, 1], ['Rm 8', 'Self-contained', 950, 1], ['Rm 9', '2-bedroom S/C', 1500, 2], ['Rm 10', '2-bedroom S/C', 1500, 2]]);
  addUnits('p3', 'o1', [['House 1', '3-bedroom townhouse', 2500, 3], ['House 2', '3-bedroom townhouse', 2500, 3], ['House 3', '2-bedroom townhouse', 1800, 2], ['House 4', '2-bedroom townhouse', 1800, 2], ['House 5', '4-bedroom townhouse', 3200, 4], ['House 6', '2-bedroom townhouse', 1800, 2]]);
  addUnits('p4', 'o1', [['Shop 1', 'Shop', 2200, 0], ['Shop 2', 'Shop', 2200, 0], ['Shop 3', 'Shop', 2600, 0], ['Office 1F', 'Office', 3800, 0], ['Office 2F', 'Office', 4200, 0], ['Kiosk', 'Kiosk', 900, 0]]);
  addUnits('p5', 'o1', [['H-101', 'Hostel room (2 in 1)', 700, 2], ['H-102', 'Hostel room (2 in 1)', 700, 2], ['H-103', 'Hostel room (4 in 1)', 950, 4], ['H-104', 'Hostel room (4 in 1)', 950, 4], ['H-201', 'Hostel room (1 in 1)', 900, 1], ['H-202', 'Hostel room (1 in 1)', 900, 1], ['H-203', 'Hostel room (2 in 1)', 700, 2], ['H-204', 'Hostel room (2 in 1)', 700, 2]]);
  addUnits('p6', 'o3', [['Villa 1', '3-bedroom house', 3000, 3], ['Villa 2', '3-bedroom house', 3000, 3], ['Villa 3', '2-bedroom house', 2200, 2], ['Villa 4', '2-bedroom house', 2200, 2], ['Villa 5', '4-bedroom house', 4200, 4]]);

  // Vacant on purpose (so vacancies show): A4, Rm 2, Rm 8, House 6, Kiosk, H-204, Villa 5. One under repair.
  const vacant = new Set(['A4', 'Rm 2', 'Rm 8', 'House 6', 'Kiosk', 'H-204', 'Villa 5']);
  units.find((u) => u.label === 'Rm 8').status = 'repair';

  const tenants = [];
  const leases = [];
  const usedNames = new Set();
  const person = () => {
    let n;
    do n = `${pick(FIRST)} ${pick(LAST)}`; while (usedNames.has(n));
    usedNames.add(n);
    return n;
  };
  const cycleFor = (p) => (p.type === 'Commercial' ? pick(['quarterly', 'yearly', 'biannual']) : p.type === 'Hostel' ? 'yearly' : p.type === 'Apartments' ? pick(['monthly', 'monthly', 'quarterly', 'yearly']) : pick(['yearly', 'yearly', 'term', 'biannual', 'monthly']));

  units.forEach((u) => {
    if (vacant.has(u.label)) return;
    const p = properties.find((x) => x.id === u.propertyId);
    const isDemoTenant = u.label === 'A2';
    const name = isDemoTenant ? 'Efua Asante' : person();
    const t = {
      id: `t${tenants.length + 1}`, ownerId: u.ownerId, name, phone: isDemoTenant ? '0245556677' : phone(), email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@gmail.com`,
      ghanaCard: ghanaCard(), occupation: p.type === 'Hostel' ? 'Student (KNUST)' : p.type === 'Commercial' ? pick(['Trader', 'Fashion designer', 'Pharmacist', 'Accountant']) : pick(JOBS),
      emergency: `${pick(FIRST)} ${pick(LAST)} · ${phone()}`, household: p.type === 'Commercial' ? 0 : 1 + Math.floor(r() * 4), createdAt: '',
    };
    const months = p.type === 'Hostel' ? 12 : pick([12, 12, 24, 24, 12, 36]);
    const cycle = isDemoTenant ? 'monthly' : cycleFor(p);
    // Start somewhere in the past so the lease is still running (a few end soon).
    const back = isDemoTenant ? 7 : Math.floor(r() * (months - 1)) + 1;
    const start = format(addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -back), 'yyyy-MM-dd');
    t.createdAt = start;
    tenants.push(t);
    leases.push({
      id: `l${leases.length + 1}`, ownerId: u.ownerId, unitId: u.id, tenantId: t.id, start, months, cycle: cycle === 'term' && months > 24 ? 'yearly' : cycle, rent: u.rent,
      deposit: p.type === 'Hostel' ? 0 : u.rent * (p.type === 'Commercial' ? 2 : 1), status: 'active', no: `TA-${format(parseISO(start), 'yy')}-${String(leases.length + 1).padStart(4, '0')}`,
      signedOwner: { name: 'Ama Owusu-Ansah', at: start }, signedTenant: { name, at: start }, createdAt: start,
    });
    u.status = 'occupied';
  });

  // A couple of past (ended) tenancies for history.
  ['Rm 2', 'House 6'].forEach((label) => {
    const u = units.find((x) => x.label === label);
    const name = person();
    const t = { id: `t${tenants.length + 1}`, ownerId: u.ownerId, name, phone: phone(), email: '', ghanaCard: ghanaCard(), occupation: pick(JOBS), emergency: '', household: 2, createdAt: day(-500), former: true };
    tenants.push(t);
    const start = format(addMonths(now, -18), 'yyyy-MM-01');
    leases.push({ id: `l${leases.length + 1}`, ownerId: u.ownerId, unitId: u.id, tenantId: t.id, start, months: 12, cycle: 'yearly', rent: u.rent, deposit: u.rent, status: 'ended', endedOn: format(addMonths(parseISO(start), 12), 'yyyy-MM-dd'), no: `TA-${String(leases.length + 1).padStart(4, '0')}`, signedOwner: { name: 'Ama Owusu-Ansah', at: start }, signedTenant: { name, at: start }, createdAt: start, refund: 'Deposit refunded' });
  });

  // Invoices from every lease, then pay most of them.
  const invoices = [];
  leases.forEach((l) => invoices.push(...leaseInvoices(l, units.find((u) => u.id === l.unitId), l.status === 'ended' ? parseISO(l.endedOn) : now)));

  // A few utility bills (prepaid water/sanitation/service charge).
  leases.filter((l) => l.status === 'active' && ['p1', 'p2'].includes(units.find((u) => u.id === l.unitId).propertyId)).slice(0, 8).forEach((l, i) => {
    const u = units.find((x) => x.id === l.unitId);
    invoices.push({ id: `inv_util_${i}`, ownerId: l.ownerId, leaseId: l.id, tenantId: l.tenantId, unitId: l.unitId, propertyId: u.propertyId, kind: 'utility', title: u.propertyId === 'p1' ? `Service charge ${format(addMonths(now, -1), 'MMM yyyy')}` : `Water bill ${format(addMonths(now, -1), 'MMM yyyy')}`, amount: u.propertyId === 'p1' ? 350 : 60 + Math.round(r() * 60), due: day(-8 + i), issued: day(-20), paid: 0 });
  });

  const payments = [];
  const fee = (amt, online) => (online ? round2((amt * PLATFORM.feePct) / 100) : 0);
  const refNo = () => `EW${String(Math.floor(r() * 1e9)).padStart(9, '0')}`;
  const sorted = [...invoices].sort((a, b) => a.due.localeCompare(b.due));
  sorted.forEach((inv) => {
    const dueDays = (parseISO(inv.due) - now) / 86400000;
    const tenant = tenants.find((t) => t.id === inv.tenantId);
    if (tenant.name === 'Efua Asante' && dueDays > -20) return; // demo tenant has rent to pay
    if (dueDays > 10) return; // too far ahead
    const roll = r();
    let amount = inv.amount;
    if (dueDays > -45 && roll < 0.12 && inv.amount <= 6000) return; // recent and unpaid → arrears
    if (dueDays > -45 && roll < 0.12) amount = round2(Math.round((inv.amount * 0.75) / 100) * 100); // big bills: mostly paid
    if (dueDays > -60 && roll < 0.3) amount = round2(Math.round((inv.amount * (0.3 + r() * 0.4)) / 10) * 10); // part payment
    const method = pick(['mtn', 'mtn', 'mtn', 'mtn', 'telecel', 'telecel', 'at', 'card', 'cash', 'bank']);
    const online = ONLINE.includes(method);
    const paidOn = format(addDays(parseISO(inv.due), Math.floor(r() * 9) - 6), 'yyyy-MM-dd');
    const at = `${paidOn > day(0) ? day(0) : paidOn}T${String(7 + Math.floor(r() * 13)).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}:00`;
    const { allocations } = allocate(amount, [inv]);
    allocations.forEach((a) => (invoices.find((x) => x.id === a.invoiceId).paid += a.amount));
    const f = fee(amount, online);
    payments.push({ id: `pay${payments.length + 1}`, ownerId: inv.ownerId, tenantId: inv.tenantId, unitId: inv.unitId, propertyId: inv.propertyId, amount, fee: f, net: round2(amount - f), method, online, ref: refNo(), at, allocations, by: online ? 'tenant' : 'Ama Owusu-Ansah', payer: method === 'card' ? '•••• 4421' : online ? tenant.phone : '' });
  });

  // Owner payouts so the wallet has a realistic balance.
  const withdrawals = [];
  const o1Online = payments.filter((p) => p.ownerId === 'o1' && p.online).sort((a, b) => a.at.localeCompare(b.at));
  let acc = 0;
  o1Online.forEach((p) => {
    acc += p.net;
    if (acc > 14000 && p.at < day(-25)) {
      const amount = Math.floor((acc * 0.85) / 100) * 100;
      const toBank = amount > 15000;
      withdrawals.push({ id: `w${withdrawals.length + 1}`, ownerId: 'o1', amount, fee: toBank ? PLATFORM.payoutFees.bank : PLATFORM.payoutFees.momo, accountId: toBank ? 'pa2' : 'pa1', dest: toBank ? 'GCB Bank •••5678' : 'MTN MoMo 024•••3456', status: 'paid', at: p.at, paidAt: p.at, ref: `PO${String(Math.floor(r() * 1e8))}`, by: 'Ama Owusu-Ansah' });
      acc -= amount;
    }
  });
  withdrawals.push({ id: `w${withdrawals.length + 1}`, ownerId: 'o3', amount: 6200, fee: 1, accountId: 'pa3', dest: 'Telecel Cash 020•••4321', status: 'pending', at: `${day(-1)}T10:12:00`, ref: 'PO55102938', by: 'Serwaa Akoto', needsApproval: true });

  const subscriptions = [];
  for (let m = 6; m >= 1; m--) subscriptions.push({ id: `s${m}`, ownerId: 'o1', plan: 'growth', amount: 150, at: format(addMonths(now, -m), 'yyyy-MM-dd') + 'T09:00:00', method: 'mtn', fromWallet: false });

  const users = [
    { id: 'u_owner', role: 'owner', ownerId: 'o1', name: 'Ama Owusu-Ansah', phone: '0244123456', email: 'ama@adomproperties.com.gh', title: 'Managing Director' },
    { id: 'u_new', role: 'owner', ownerId: 'o2', name: 'Kwesi Mensah', phone: '0201234567', email: 'kwesi.mensah@gmail.com', title: 'Owner' },
    { id: 'u_serwaa', role: 'owner', ownerId: 'o3', name: 'Serwaa Akoto', phone: '0277654321', email: 'info@serwaaestates.com', title: 'Owner' },
    { id: 'u_mgr', role: 'manager', ownerId: 'o1', name: 'Kofi Boateng', phone: '0551239876', email: 'kofi@adomproperties.com.gh', title: 'Property Manager', propertyIds: ['p1', 'p2', 'p4'], perms: { payments: true, tenants: true, maintenance: true, expenses: true, reports: false } },
    { id: 'u_care', role: 'manager', ownerId: 'o1', name: 'Yaw Darko', phone: '0247778899', email: '', title: 'Caretaker', propertyIds: ['p3', 'p5'], perms: { payments: true, tenants: false, maintenance: true, expenses: false, reports: false } },
    { id: 'u_tenant', role: 'tenant', ownerId: 'o1', tenantId: tenants.find((t) => t.name === 'Efua Asante').id, name: 'Efua Asante', phone: '0245556677', email: 'efua.asante@gmail.com' },
    { id: 'u_admin', role: 'admin', name: 'Efie Wura HQ', phone: '0300000000', email: 'admin@efiewura.com', title: 'Super Admin' },
  ];

  const MT = [
    ['Leaking kitchen tap', 'Plumbing', 'medium'], ['No light in bedroom', 'Electrical', 'high'], ['Broken louvre blades', 'Carpentry', 'low'], ['AC not cooling', 'Electrical', 'medium'],
    ['Toilet cistern not filling', 'Plumbing', 'high'], ['Door lock jammed', 'Security', 'high'], ['Ceiling stain after rain', 'Roofing', 'medium'], ['Gate remote not working', 'Security', 'low'],
    ['Water pump making noise', 'Plumbing', 'medium'], ['Repaint shop front', 'Painting', 'low'], ['Prepaid meter showing error', 'Electrical', 'high'],
  ];
  const active = leases.filter((l) => l.status === 'active');
  const maintenance = MT.map(([title, category, priority], i) => {
    const l = i === 0 ? active.find((x) => tenants.find((t) => t.id === x.tenantId).name === 'Efua Asante') : active[(i * 7) % active.length];
    const u = units.find((x) => x.id === l.unitId);
    const status = i === 0 ? 'in progress' : ['open', 'assigned', 'in progress', 'done', 'done', 'done'][i % 6];
    return { id: `m${i + 1}`, ownerId: l.ownerId, unitId: u.id, propertyId: u.propertyId, tenantId: l.tenantId, title, category, priority, status, desc: `${title}. Please send someone to check.`, assignee: status === 'open' ? '' : pick(['Kofi Boateng', 'Yaw Darko', 'Mensah Plumbing Works', 'Sparkle Electricals']), cost: status === 'done' ? 80 + Math.round(r() * 600) : 0, at: `${day(-Math.floor(r() * 40) - (status === 'done' ? 10 : 0))}T09:30:00`, updates: [] };
  });

  const EXP = [['Repairs & maintenance', 300, 2500], ['Security services', 1200, 1800], ['Cleaning & waste', 200, 600], ['ECG / utilities', 400, 1500], ['Property rates (Assembly)', 800, 3000], ['Insurance', 1500, 2500], ['Agent commission', 500, 2000]];
  const expenses = [];
  for (let m = 0; m < 6; m++)
    ['p1', 'p2', 'p3', 'p4', 'p5'].forEach((pid) => {
      if (r() < 0.45) return;
      const [category, lo, hi] = pick(EXP);
      expenses.push({ id: `e${expenses.length + 1}`, ownerId: 'o1', propertyId: pid, category, amount: Math.round(lo + r() * (hi - lo)), date: format(addDays(addMonths(now, -m), -Math.floor(r() * 25)), 'yyyy-MM-dd'), note: '', by: 'Ama Owusu-Ansah' });
    });

  const notices = [
    { id: 'n1', ownerId: 'o1', propertyId: 'p1', title: 'Water tank cleaning on Saturday', body: 'There will be no running water from 8am to 1pm this Saturday while the overhead tanks are cleaned. Please store some water. Thank you.', at: `${day(-2)}T08:00:00` },
    { id: 'n2', ownerId: 'o1', propertyId: '', title: 'Pay rent with MoMo in the app', body: 'You can now pay rent, service charge and bills directly in the app with MTN MoMo, Telecel Cash, AT Money or card. Your receipt arrives instantly.', at: `${day(-20)}T10:00:00` },
    { id: 'n3', ownerId: 'o1', propertyId: 'p2', title: 'New security guard', body: 'Please welcome Mr. Issah, our new night guard at Adom Heights.', at: `${day(-35)}T17:00:00` },
  ];

  const sms = [];
  invoices.filter((i) => i.ownerId === 'o1' && balance(i) > 0 && i.due < day(0)).slice(0, 6).forEach((inv, i) => {
    const t = tenants.find((x) => x.id === inv.tenantId);
    sms.push({ id: `sms${i + 1}`, ownerId: 'o1', to: t.phone, name: t.name, kind: 'overdue', text: `Dear ${t.name}, your rent balance for ${units.find((u) => u.id === inv.unitId).label} is overdue. Kindly pay today to avoid a late fee. – Adom Properties Ltd`, at: `${day(-1)}T09:00:00`, status: 'delivered' });
  });

  const alerts = [];
  return { platform: PLATFORM, owners, users, properties, units, tenants, leases, invoices, payments, withdrawals, subscriptions, maintenance, expenses, notices, sms, alerts };
}
