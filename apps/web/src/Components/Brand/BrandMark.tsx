import { cn } from '@/utils/helpers';

interface BrandMarkProps {
    className?: string;
    title?: string;
}

/** Logo officiel Boissons du Cameroun. */
export function BrandMark({ className, title = 'Boissons du Cameroun' }: BrandMarkProps) {
    return (
        <img
            src="/images/logos/boissons-du-cameroun.png"
            alt={title}
            className={cn('block object-contain', className)}
        />
    );
}

interface BrandLockupProps {
    className?: string;
    markClassName?: string;
    caption?: string;
    compact?: boolean;
}

/** Emblème de l'application. */
export function BrandLockup({ className, markClassName, caption = '', compact = false }: BrandLockupProps) {
    return (
        <span className={cn('inline-flex min-w-0 items-center', compact ? 'gap-2.5' : 'gap-3', className)}>
            <BrandMark className={cn('h-auto shrink-0', compact ? 'w-32' : 'w-28', markClassName)} />
            {caption ? (
                <span className="flex flex-col leading-none">
                    <span className={cn('sabc-display text-sabc-red-primary whitespace-nowrap', compact ? 'text-[13px]' : 'text-lg')}>{caption}</span>
                </span>
            ) : null}
        </span>
    );
}

export default BrandMark;
