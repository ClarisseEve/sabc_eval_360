import React from 'react';
import { cn } from '@/utils/helpers';

interface AppLogoIconProps {
  className?: string;
}

/**
 * Composant logo SABC pour l'application
 * Conforme aux règles graphiques SABC
 */
export function AppLogoIcon({ className }: AppLogoIconProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img 
        src="/images/logos/sabc-logo.png" 
        alt="SABC Logo" 
        className="h-full w-full object-contain"
      />
    </div>
  );
}

export default AppLogoIcon;
