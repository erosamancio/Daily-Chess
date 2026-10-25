export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--brand)" />
      <rect x="6" y="6" width="10" height="10" rx="2" fill="var(--brand-ink)" opacity="0.95" />
      <rect x="16" y="16" width="10" height="10" rx="2" fill="var(--brand-ink)" opacity="0.95" />
      <rect x="16" y="6" width="10" height="10" rx="2" fill="var(--accent)" />
      <circle cx="21" cy="11" r="2.2" fill="var(--brand)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-ink">
        Daily<span className="text-brand"> Chess</span>
      </span>
    </span>
  );
}
