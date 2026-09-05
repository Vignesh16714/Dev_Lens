import { cn } from '@/lib/ui-utils';

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-default border border-borderline bg-elevated px-3 text-sm text-[#e6edf3] placeholder:text-muted/70 transition-colors focus-ring focus:border-accent/60',
        className
      )}
      {...props}
    />
  );
}