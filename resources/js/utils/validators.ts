// Fonctions de validation pour l'application

/**
 * Vérifie si une chaîne est une adresse email valide
 */
export function isValidEmailFormat(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Vérifie si une chaîne est un numéro de téléphone valide (format français)
 */
export function isValidPhone(phone: string): boolean {
  const re = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return re.test(phone);
}

/**
 * Vérifie si une chaîne est un mot de passe valide
 * - Au moins 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export function isValidPassword(password: string): boolean {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
}

/**
 * Vérifie si une valeur est définie et non vide
 */
export function isRequired(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && Object.keys(value).length === 0) return false;
  return true;
}
