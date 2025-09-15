import '../css/app.css';
import '../css/scrollbar.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';
import { initializeTheme, ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './Contexts/AuthContext';

const appName = import.meta.env.VITE_APP_NAME || 'Evaluation Force Vente - SABC';

// Inertia gère automatiquement le CSRF

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Ajout de logs pour déboguer la résolution des composants
        console.log('Résolution du composant:', name);
        
        // Correction de la casse pour les routes admin selon règles SABC
        let correctedName = name.replace(/^admin\//, 'Admin/');
        
        // Correction des sous-dossiers selon règles SABC (majuscules)
        correctedName = correctedName.replace(/\/roles\//, '/Roles/');
        correctedName = correctedName.replace(/\/structure\//, '/Structure/');
        
        return resolvePageComponent(`./Pages/${correctedName}.tsx`, import.meta.glob('./Pages/**/*.tsx'));
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Récupérer l'utilisateur des props Inertia
        const user = props.initialPage?.props?.auth ? (props.initialPage.props.auth as any).user : null;
        console.log('Utilisateur Inertia:', user);

        root.render(
            <ThemeProvider>
                <AuthProvider initialUser={user}>
                    <App {...props} />
                </AuthProvider>
            </ThemeProvider>
        );
    },
    progress: {
        color: '#E53E3E', // Rouge SABC pour la barre de progression
        showSpinner: true as const,
    },
});

// This will set light / dark mode on load...
initializeTheme();
