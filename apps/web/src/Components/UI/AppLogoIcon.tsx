import React from 'react';
import { BrandMark } from '@/Components/Brand/BrandMark';

interface AppLogoIconProps {
  className?: string;
}

/**
 * Composant logo SABC pour l'application
 * Conforme aux règles graphiques SABC
 */
export function AppLogoIcon({ className }: AppLogoIconProps) {
  return (
    <BrandMark className={className} />
  );
}

export default AppLogoIcon;
