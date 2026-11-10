import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useStore } from './data/store';
import { useMe } from './lib/session';
import { applyTheme, DEFAULT_THEME } from './lib/theme';
import { Toaster, Button } from './components/ui';
import AppShell from './components/layout/AppShell';
import Landing from './modules/public/Landing';
import SetupWizard from './modules/shared/SetupWizard';

const Dashboard = lazy(() => import('./modules/owner/Dashboard'));
const Properties = lazy(() => import('./modules/owner/Properties'));
const PropertyDetail = lazy(() => import('./modules/owner/PropertyDetail'));
const Tenants = lazy(() => import('./modules/owner/Tenants'));
const TenantDetail = lazy(() => import('./modules/owner/TenantDetail'));
const Leases = lazy(() => import('./modules/owner/Leases'));
const Rent = lazy(() => import('./modules/owner/Rent'));
const WalletPage = lazy(() => import('./modules/owner/Wallet'));
const Maintenance = lazy(() => import('./modules/owner/Maintenance'));
const Expenses = lazy(() => import('./modules/owner/Expenses'));
const Messages = lazy(() => import('./modules/owner/Messages'));
const Reports = lazy(() => import('./modules/owner/Reports'));
const Staff = lazy(() => import('./modules/owner/Staff'));
const Settings = lazy(() => import('./modules/owner/Settings'));
const TenantHome = lazy(() => import('./modules/tenant/TenantHome'));
const TenantPay = lazy(() => import('./modules/tenant/TenantPay'));
const TenantHistory = lazy(() => import('./modules/tenant/TenantHistory'));
const TenantRequests = lazy(() => import('./modules/tenant/TenantRequests'));
const TenantLease = lazy(() => import('./modules/tenant/TenantLease'));
const TenantNotices = lazy(() => import('./modules/tenant/TenantNotices'));
const AdminOverview = lazy(() => import('./modules/admin/AdminOverview'));
const AdminOwners = lazy(() => import('./modules/admin/AdminOwners'));
const AdminPayouts = lazy(() => import('./modules/admin/AdminPayouts'));
const AdminTransactions = lazy(() => import('./modules/admin/AdminTransactions'));
const AdminPlatform = lazy(() => import('./modules/admin/AdminPlatform'));

const Spinner = () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;

function Suspended({ owner }) {
  const logout = useStore((s) => s.logout);
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Account on hold</h1>
        <p className="mt-2 text-sm text-slate-500">{owner.company || 'This account'} has been suspended by Efie Wura. Please contact support on 030 000 0000.</p>
        <Button className="mt-6" onClick={logout}>Sign out</Button>
      </div>
    </div>
  );
}

function RoleRoutes({ role }) {
  if (role === 'tenant')
    return (
      <Routes>
        <Route path="/" element={<TenantHome />} />
        <Route path="/pay" element={<TenantPay />} />
        <Route path="/history" element={<TenantHistory />} />
        <Route path="/requests" element={<TenantRequests />} />
        <Route path="/lease" element={<TenantLease />} />
        <Route path="/notices" element={<TenantNotices />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  if (role === 'admin')
    return (
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/owners" element={<AdminOwners />} />
        <Route path="/payouts" element={<AdminPayouts />} />
        <Route path="/transactions" element={<AdminTransactions />} />
        <Route path="/platform" element={<AdminPlatform />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/properties" element={<Properties />} />
      <Route path="/properties/:id" element={<PropertyDetail />} />
      <Route path="/tenants" element={<Tenants />} />
      <Route path="/tenants/:id" element={<TenantDetail />} />
      <Route path="/leases" element={<Leases />} />
      <Route path="/rent" element={<Rent />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/reports" element={<Reports />} />
      {role === 'owner' && <Route path="/wallet" element={<WalletPage />} />}
      {role === 'owner' && <Route path="/staff" element={<Staff />} />}
      {role === 'owner' && <Route path="/settings" element={<Settings />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user, owner } = useMe();
  const runBilling = useStore((s) => s.runBilling);
  const theme = user && user.role !== 'admin' && owner ? owner.theme : DEFAULT_THEME;
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => { if (user) runBilling(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  let body;
  if (!user) body = <Landing />;
  else if (user.role === 'owner' && !owner.setupDone) body = <SetupWizard />;
  else if (owner?.status === 'suspended') body = <Suspended owner={owner} />;
  else
    body = (
      <HashRouter>
        <AppShell>
          <Suspense fallback={<Spinner />}><RoleRoutes role={user.role} /></Suspense>
        </AppShell>
      </HashRouter>
    );
  return (
    <>
      {body}
      <Toaster />
    </>
  );
}
