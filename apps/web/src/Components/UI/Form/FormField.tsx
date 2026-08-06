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
  const generatedId = React.useId();
  const fieldId = htmlFor ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const control = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const childProps = child.props as Record<string, unknown>;
    const existingDescription = childProps['aria-describedby'];
    const mergedDescription = [existingDescription, describedBy].filter(Boolean).join(' ') || undefined;
    return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
      id: childProps.id ?? fieldId,
      'aria-describedby': mergedDescription,
      'aria-invalid': error ? true : childProps['aria-invalid'],
      'aria-errormessage': error ? errorId : childProps['aria-errormessage'],
    });
  });

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={fieldId} className="text-sabc-gray-800 font-medium">
        {label}
        {required ? <span className="ml-0.5 text-sabc-error" aria-hidden="true">*</span> : null}
        {required ? <span className="sr-only"> (obligatoire)</span> : null}
      </Label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-sabc-error">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-sabc-gray-500">{hint}</p>
      ) : null}
    </div>
  );
};

export default FormField;
