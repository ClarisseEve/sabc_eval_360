import '../css/app.css';
import '../css/scrollbar.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';
import { initializeTheme, ThemeProvider } from './Hooks/useTheme';
import { DisplayScaleProvider } from './Hooks/useDisplayScale';
import { AuthProvider } from './Contexts/AuthContext';

const appName = import.meta.env.VITE_APP_NAME || 'Evaluation Force Vente - SABC';

// Inertia gère automatiquement le CSRF

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        console.log('Résolution du composant:', name);

        // Normalisations simples (règles SABC)
        let correctedName = name.replace(/^admin\//, 'Admin/');
        correctedName = correctedName.replace(/^common\//, 'Common/');
        correctedName = correctedName.replace(/\/roles\//, '/Roles/');
        correctedName = correctedName.replace(/\/structure\//, '/Structure/');

        const pages = import.meta.glob('./pages/**/*.tsx');
        const candidates = [
            `./pages/${correctedName}.tsx`,
            `./pages/${correctedName.replace(/\/(\w+)$/, (_m, last) => `/${last.charAt(0).toLowerCase()}${last.slice(1)}`)}.tsx`,
            `./pages/${correctedName.replace(/\/(\w+)$/, (_m, last) => `/${last.charAt(0).toUpperCase()}${last.slice(1)}`)}.tsx`,
        ];

        for (const path of candidates) {
            if (pages[path]) {
                if (path !== candidates[0]) {
                    console.warn('Fallback composant:', path);
                }
                return resolvePageComponent(path, pages);
            }
        }

        // Laisser l'erreur standard si rien trouvé
        return resolvePageComponent(candidates[0], pages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Récupérer l'utilisateur des props Inertia
        const user = props.initialPage?.props?.auth ? (props.initialPage.props.auth as any).user : null;
        console.log('Utilisateur Inertia:', user);

        root.render(
            <ThemeProvider>
                <DisplayScaleProvider>
                    <AuthProvider initialUser={user}>
                        <App {...props} />
                    </AuthProvider>
                </DisplayScaleProvider>
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
