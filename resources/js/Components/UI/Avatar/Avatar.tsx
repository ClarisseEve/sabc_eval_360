import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold text-white',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-xl',
      },
      variant: {
        default: 'bg-sabc-red-primary',
        success: 'bg-sabc-success',
        warning: 'bg-sabc-warning',
        error: 'bg-sabc-error',
        info: 'bg-sabc-info',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface AvatarProps
  extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof avatarVariants> {
  name?: string;
  src?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, name, src, fallback, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const showFallback = !src || imgError;
    
    const getInitials = (nameStr: string) => {
      const names = nameStr.split(' ');
      return names
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          avatarVariants({ size, className })
        )}
      >
        {showFallback ? (
          <span className={cn(avatarVariants({ variant, size, className }))}>
            {fallback || (name ? getInitials(name) : '?')}
          </span>
        ) : (
          <img
            src={src}
            alt={name || ''}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
            {...props}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
export default Avatar;
