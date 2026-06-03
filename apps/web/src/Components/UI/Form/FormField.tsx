import React from 'react';
import { Label } from '@/Components/UI/Label/Label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  /** Libellé lisible (en français), jamais une clé technique. */
  label: string;
  htmlFor?: string;
  required?: boolean;
  /** Texte d'aide affiché sous le champ. */
  hint?: string;
  /** Message d'erreur (rouge) affiché sous le champ. */
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Champ de formulaire normalisé : libellé FR + marqueur requis + contrôle
 * (slot enfant) + aide + message d'erreur. Remplace les boucles sur des clés
 * techniques (id_region, role_nom…) par des libellés explicites.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-sabc-gray-800 font-medium">
        {label}
        {required ? <span className="ml-0.5 text-sabc-error">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-sabc-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-sabc-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormField;
