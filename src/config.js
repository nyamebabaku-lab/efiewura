// Which app this build is: 'live' (real accounts, Supabase) or 'demo' (sample data in the browser).
export const MODE = import.meta.env.VITE_APP || 'demo';
export const LIVE = MODE === 'live';
export const SITE = 'https://nyamebabaku-lab.github.io/efiewura/';
export const DEMO_SITE = `${SITE}demo/`;
/** Phone-only accounts sign in with this stand-in email behind the scenes. */
export const PHONE_DOMAIN = 'phone.efiewura.app';

/** Android apps: 'tenant' | 'owner' (owners + staff) | 'admin'. Empty on the website (everyone). */
export const APP_ROLE = import.meta.env.VITE_ROLE || '';
export const IS_NATIVE = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
const RELEASES = 'https://github.com/nyamebabaku-lab/efiewura/releases/latest/download/';
export const APKS = {
  tenant: { name: 'Efie Wura', who: 'Tenants', url: `${RELEASES}EfieWura.apk` },
  owner: { name: 'Efie Wura Owner', who: 'Owners, managers & caretakers', url: `${RELEASES}EfieWura-Owner.apk` },
  admin: { name: 'Efie Wura Admin', who: 'Efie Wura staff', url: `${RELEASES}EfieWura-Admin.apk` },
};
/** Which app a signed-in role belongs to. */
export const appForRole = (role) => (role === 'tenant' ? 'tenant' : role === 'admin' ? 'admin' : 'owner');
export const APP_NAME = APP_ROLE ? APKS[APP_ROLE].name : 'Efie Wura Pro';
