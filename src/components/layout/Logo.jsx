import { cx } from '../ui';

/** The Efie Wura Pro mark (house + key-hole) and wordmark. */
export function EfieMark({ className }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id="efg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f5c47" /><stop offset="1" stopColor="#072e25" /></linearGradient>
        <linearGradient id="efk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ecc552" /><stop offset="1" stopColor="#c99a1e" /></linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#efg)" />
      <path d="M256 104 88 236h44v156h248V236h44z" fill="none" stroke="url(#efk)" strokeWidth="30" strokeLinejoin="round" />
      <rect x="214" y="290" width="84" height="102" rx="10" fill="url(#efk)" />
      <circle cx="256" cy="218" r="26" fill="url(#efk)" />
    </svg>
  );
}

export function EfieLogo({ className, light }) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <EfieMark className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <p className={cx('font-display text-lg font-semibold tracking-tight', light ? 'text-white' : 'text-[#0b4a3a] dark:text-white')} style={{ fontFamily: 'Fraunces, serif' }}>
          Efie Wura <span className="text-[#c99a1e]">Pro</span>
        </p>
        <p className={cx('mt-0.5 text-[10px] font-semibold uppercase tracking-[.2em]', light ? 'text-white/60' : 'text-slate-400')}>Rental management</p>
      </div>
    </div>
  );
}

/** An owner's company logo (or initials fallback) and name. */
export function CompanyLogo({ owner, className, size = 'md' }) {
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' }[size];
  if (owner?.logo) return <img src={owner.logo} alt={owner.company} className={cx('shrink-0 object-contain', sz, className)} />;
  const ini = (owner?.company || owner?.contactName || 'EW').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <div className={cx('flex shrink-0 items-center justify-center rounded-xl bg-brand-600 font-bold text-white', sz, className)}>{ini}</div>;
}
