import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/ui-utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-borderline bg-elevated text-muted">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-[#e6edf3]">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {children}
    </div>
  );
}