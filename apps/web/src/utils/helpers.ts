import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | number) {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/** Retire les séparateurs techniques qui ne doivent pas apparaître dans l'interface. */
export function humanizeDisplayText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatPersonName(person: any, fallback = 'Utilisateur'): string {
  if (!person) return fallback;
  const fullName = [person.prenom, person.nom]
    .map(humanizeDisplayText)
    .filter(Boolean)
    .join(' ');

  return fullName
    || humanizeDisplayText(person.nom_complet)
    || humanizeDisplayText(person.name)
    || humanizeDisplayText(person.matricule)
    || fallback;
}

export function isActiveRoute(currentPath: string, path: string) {
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

export function formatCurrency(amount: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Fonction pour formater un pourcentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Type guard pour vérifier si une erreur est une instance de Error
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Fonction pour gérer les erreurs de manière sécurisée
export function handleError(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return 'Une erreur inconnue est survenue';
}

// Fonction pour générer un ID unique
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Fonction pour valider une adresse email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Fonction pour formater un numéro de téléphone
export function formatPhoneNumber(phoneNumber: string): string {
  // Supprime tous les caractères non numériques
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format pour les numéros français
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  // Format international
  if (cleaned.length > 4) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  
  return cleaned;
}

export const isBrowser = typeof window !== 'undefined';

export function getFromLocalStorage(key: string, defaultValue: any = null) {
  if (!isBrowser) return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return defaultValue;
  }
}

export function setToLocalStorage(key: string, value: any) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
}

export function removeFromLocalStorage(key: string) {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}
