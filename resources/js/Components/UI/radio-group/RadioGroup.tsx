import React, { createContext, useContext, useId } from 'react';

// Contexte pour le groupe radio
const RadioGroupContext = createContext<{
  name: string;
  value?: string;
  onValueChange: (value: string) => void;
} | null>(null);

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  children: React.ReactNode;
  className?: string;
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Composant RadioGroup pour gérer un groupe de boutons radio
 * Respecte les règles graphiques SABC
 */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange = () => {},
  name: nameProps,
  children,
  className = '',
  ...props
}: RadioGroupProps) {
  const generatedName = useId();
  const name = nameProps || generatedName;

  return (
    <RadioGroupContext.Provider value={{ name, value, onValueChange }}>
      <div className={`space-y-2 ${className}`} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

/**
 * Composant RadioGroupItem pour un bouton radio individuel
 * Respecte les règles graphiques SABC
 */
export function RadioGroupItem({
  value,
  id,
  className = '',
  disabled = false,
  ...props
}: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);
  const generatedId = useId();
  const radioId = id || generatedId;

  if (!context) {
    throw new Error('RadioGroupItem doit être utilisé à l\'intérieur d\'un RadioGroup');
  }

  const { name, value: groupValue, onValueChange } = context;
  const checked = groupValue === value;

  return (
    <input
      type="radio"
      id={radioId}
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
      onChange={() => onValueChange(value)}
      className={`h-4 w-4 cursor-pointer rounded-full border-gray-300 text-[#E53E3E] focus:ring-[#E53E3E] ${className}`}
      {...props}
    />
  );
}
