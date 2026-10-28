import { cn } from '@/utils/helpers';
import { CAP_RING_PATH, LION_PATH, LION_VIEWBOX } from './brand-paths';

interface BrandMarkProps {
    className?: string;
    /** Fait tourner lentement la capsule autour du lion (désactivé si moins d'animations). */
    spin?: boolean;
    title?: string;
}

/** Emblème SABC: lion rouge dans la capsule crantée grise du logo. */
export function BrandMark({ className, spin = false, title = 'SABC' }: BrandMarkProps) {
    return (
        <span className={cn('relative inline-block aspect-square', className)} role="img" aria-label={title}>
            <svg
                viewBox="0 0 200 200"
                className={cn('dark:text-sabc-gray-400 absolute inset-0 h-full w-full text-[#747474]', spin && 'sabc-cap-spin')}
                aria-hidden
            >
                <path fill="currentColor" fillRule="evenodd" d={CAP_RING_PATH} />
            </svg>
            <svg viewBox={LION_VIEWBOX} className="text-sabc-red-primary absolute top-[15%] left-[28.7%] h-[70%] w-[42.6%]" aria-hidden>
                <path fill="currentColor" fillRule="evenodd" d={LION_PATH} />
            </svg>
        </span>
    );
}

interface BrandLockupProps {
    className?: string;
    markClassName?: string;
    /** Deuxième ligne, sous « Évaluation 360° ». */
    caption?: string;
    compact?: boolean;
}

/** Emblème et nom de l'application, composés comme le logo: ligne rouge, ligne grise. */
export function BrandLockup({ className, markClassName, caption = 'Boissons du Cameroun', compact = false }: BrandLockupProps) {
    return (
        <span className={cn('inline-flex min-w-0 items-center', compact ? 'gap-2.5' : 'gap-3', className)}>
            <BrandMark className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-11 w-11', markClassName)} />
            <span className="flex flex-col leading-none">
                <span className={cn('sabc-display text-sabc-red-primary whitespace-nowrap', compact ? 'text-[13px]' : 'text-lg')}>Évaluation 360°</span>
                <span className={cn('sabc-display text-sabc-gray-500 dark:text-sabc-gray-400 mt-1 whitespace-nowrap font-normal', compact ? 'text-[10px]' : 'text-[0.7rem]')}>{caption}</span>
            </span>
        </span>
    );
}

export default BrandMark;
