import React from 'react';

interface InputErrorProps {
  message?: string;
  className?: string;
}

/**
 * Composant pour afficher les erreurs de validation des champs
 * Respecte les règles graphiques SABC
 */
export default function InputError({ message, className = '' }: InputErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`text-sm text-[#E53E3E] mt-1 ${className}`}>
      {message}
    </div>
  );
}
