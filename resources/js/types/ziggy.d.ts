/**
 * Déclaration de type pour la fonction route de Ziggy
 * Cette fonction est injectée par Laravel via le package ziggy
 */

interface Window {
  route: (name: string, params?: Record<string, any>, absolute?: boolean) => string;
}
