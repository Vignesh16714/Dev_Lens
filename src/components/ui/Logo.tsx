import { cn } from '@/lib/ui-utils';

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-borderline bg-elevated">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none">
          <path
            d="M4 6h16M4 12h10m6 0l-3-3m3 3l-3 3M4 18h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#3fb950]" />
      </span>
      {!markOnly ? (
        <span className="text-[15px] font-semibold tracking-tight text-[#e6edf3]">
          DevLens
        </span>
      ) : null}
    </span>
  );
}

export default Logo;