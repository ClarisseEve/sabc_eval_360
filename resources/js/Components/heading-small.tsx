import React from 'react';

interface HeadingSmallProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * Composant pour les petits titres avec description optionnelle
 * Respecte les règles graphiques SABC avec Poppins pour les titres
 */
export default function HeadingSmall({ title, description, className = '' }: HeadingSmallProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <h3 className="text-xl font-semibold text-[#1A202C] font-poppins">{title}</h3>
      {description && <p className="text-sm text-[#9E9E9E] font-inter">{description}</p>}
    </div>
  );
}
