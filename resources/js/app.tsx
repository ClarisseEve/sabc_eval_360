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
        console.log('Résolution du composant:', name);

        // Normalisations simples (règles SABC)
        let correctedName = name.replace(/^admin\//, 'Admin/');
        correctedName = correctedName.replace(/\/roles\//, '/Roles/');
        correctedName = correctedName.replace(/\/structure\//, '/Structure/');

        const pages = import.meta.glob('./Pages/**/*.tsx');
        const primaryPath = `./Pages/${correctedName}.tsx`;
        if (pages[primaryPath]) {
            return resolvePageComponent(primaryPath, pages);
        }

        // Fallback: dernière portion en minuscules (Index -> index)
        const altName = correctedName.replace(/\/(\w+)$/, (_m, last) => `/${last.charAt(0).toLowerCase()}${last.slice(1)}`);
        const altPath = `./Pages/${altName}.tsx`;
        if (pages[altPath]) {
            console.warn('Fallback composant:', altPath);
            return resolvePageComponent(altPath, pages);
        }

        // Laisser l'erreur standard si rien trouvé
        return resolvePageComponent(primaryPath, pages);
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
