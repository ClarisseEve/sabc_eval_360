/**
 * Ce fichier est un point d'entrée pour les layouts de l'application.
 * Il réexporte les composants de layout depuis leur emplacement réel dans Components/Layout/app
 * pour maintenir la compatibilité avec le code existant.
 */

// Réexporter les composants de layout depuis leur emplacement réel
export { AppLayout, Header, Sidebar } from '@/Components/Layout';

// Exporter AppLayout comme composant par défaut
export { AppLayout as default } from '@/Components/Layout';
