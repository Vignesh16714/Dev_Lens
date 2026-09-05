import { cn } from '@/lib/ui-utils';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary: 'bg-accent text-[#010409] hover:bg-accent/90',
    secondary: 'bg-elevated text-[#e6edf3] border border-borderline hover:bg-[#1c2129]',
    ghost: 'text-muted hover:text-[#e6edf3] hover:bg-elevated',
    danger: 'bg-red-900/30 text-red-300 border border-red-800/60 hover:bg-red-900/40',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-default',
    md: 'h-9 px-4 text-sm rounded-default',
    lg: 'h-11 px-5 text-sm rounded-default',
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}