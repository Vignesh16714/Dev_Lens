import { cn } from '@/lib/ui-utils';

export function Avatar({
  url,
  alt,
  size = 'md',
  className,
}: {
  url?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const px = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : size === 'xl' ? 'h-20 w-20' : 'h-10 w-10';
  const fs = size === 'sm' ? 'text-xs' : size === 'xl' ? 'text-2xl' : 'text-base';
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-borderline bg-elevated text-accent', px, fs, className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt ?? ''} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="font-semibold">{alt?.charAt(0).toUpperCase() ?? '?'}</span>
      )}
    </span>
  );
}

export default Avatar;