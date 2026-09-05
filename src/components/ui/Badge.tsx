import { cn } from '@/lib/ui-utils';

type Tone = 'default' | 'green' | 'accent' | 'warning' | 'danger' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-elevated text-[#c9d1d9] border border-borderline',
  green: 'bg-green/10 text-[#3fb950] border border-green/30',
  accent: 'bg-accent/10 text-accent border border-accent/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
  muted: 'bg-transparent text-muted border border-borderline',
};

export function Badge({
  tone = 'default',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'muted', className }: { tone?: Tone; className?: string }) {
  const dot: Record<Tone, string> = {
    default: 'bg-[#c9d1d9]',
    green: 'bg-[#3fb950]',
    accent: 'bg-accent',
    warning: 'bg-yellow-400',
    danger: 'bg-red-400',
    muted: 'bg-muted',
  };
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot[tone], className)} />;
}