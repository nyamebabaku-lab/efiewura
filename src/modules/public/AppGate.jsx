// Android apps: a compact start screen, and a polite redirect when an account belongs in another app.
import { useState } from 'react';
import { Download, LogOut, KeyRound, Building2, Crown } from 'lucide-react';
import { Button } from '../../components/ui';
import { EfieMark } from '../../components/layout/Logo';
import { heroPhoto } from '../../components/PropertyArt';
import { AuthModal } from './LiveAuth';
import { APP_ROLE, APKS, APP_NAME, SITE, appForRole } from '../../config';
import { signOut } from '../../data/live';

const ICON = { tenant: KeyRound, owner: Building2, admin: Crown };
const TAG = { tenant: 'Pay rent, get receipts, report repairs', owner: 'Manage properties, tenants and rent', admin: 'Run the Efie Wura platform' };

export function AppStart() {
  const [auth, setAuth] = useState(null);
  const Icon = ICON[APP_ROLE];
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#072e25] px-6 pb-10 pt-safe text-white">
      <img src={heroPhoto()} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#072e25]/70 via-[#072e25]/55 to-[#072e25]" />
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <EfieMark className="h-24 w-24 drop-shadow-2xl" />
        <h1 className="mt-6 text-4xl font-semibold" style={{ fontFamily: 'Fraunces, serif' }}>{APP_NAME}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/70"><Icon className="h-4 w-4 text-[#ecc552]" /> {TAG[APP_ROLE]}</p>
      </div>
      <div className="relative space-y-3">
        <Button size="lg" className="w-full !bg-[#e2b232] !text-[#072e25]" onClick={() => setAuth('signin')}>Sign in</Button>
        {<Button size="lg" variant="ghost" className="w-full !text-white ring-1 ring-white/25" onClick={() => setAuth('signup')}>{APP_ROLE === 'admin' ? 'First-time set-up' : 'Create account'}</Button>}
        <p className="text-center text-[11px] text-white/50">{APP_ROLE === 'tenant' ? 'You need the company code from your landlord to sign up.' : APP_ROLE === 'owner' ? 'Staff: use the company code from your SMS invite.' : 'For Efie Wura staff only.'}</p>
      </div>
      <div className="kente absolute inset-x-0 bottom-0 h-1.5" style={{ '--accent-400': '226 178 50', '--brand-700': '11 74 58' }} />
      <AuthModal open={!!auth} start={auth || 'signin'} onClose={() => setAuth(null)} />
    </div>
  );
}

export function WrongApp({ role }) {
  const app = APKS[appForRole(role)];
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-100 p-6 dark:bg-navy-950">
      <div className="card max-w-sm p-8 text-center">
        <EfieMark className="mx-auto h-14 w-14" />
        <h1 className="mt-4 font-display text-2xl font-semibold">Use the {app.name} app</h1>
        <p className="mt-2 text-sm text-slate-500">Your account is for <b>{app.who.toLowerCase()}</b>. This is the {APP_NAME} app — please install {app.name} or use the website.</p>
        <a href={app.url}><Button className="mt-6 w-full" icon={Download}>Download {app.name}</Button></a>
        <a href={SITE} className="mt-3 block text-sm font-semibold text-brand-600">Open the website instead</a>
        <Button variant="ghost" className="mt-4 w-full" icon={LogOut} onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
