// Which app this build is: 'live' (real accounts, Supabase) or 'demo' (sample data in the browser).
export const MODE = import.meta.env.VITE_APP || 'demo';
export const LIVE = MODE === 'live';
export const SITE = 'https://nyamebabaku-lab.github.io/efiewura/';
export const DEMO_SITE = `${SITE}demo/`;
/** Phone-only accounts sign in with this stand-in email behind the scenes. */
export const PHONE_DOMAIN = 'phone.efiewura.app';
