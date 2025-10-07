import React from 'react';
import { createRoot } from 'react-dom/client';
import Login from './Pages/auth/Login';
import ForgotPassword from './Pages/auth/ForgotPassword';
import CSC from './Pages/Dashboard/CSC/Index';
import CDS from './Pages/Dashboard/CDS/Index';
import CDV from './Pages/Dashboard/CDV/Index';
import { FC } from 'react';

// Déclaration des types pour TypeScript
interface LoginProps {
  errors: {
    identifier?: string;
    password?: string;
  };
  status?: string | null;
}

interface DashboardProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
  [key: string]: any;
}

// Styles
import '../css/app.css';

// Mock auth data
const mockUser = {
  id: 1,
  name: 'Utilisateur Test',
  email: 'test@sabc.com',
  role: 'DR',
};

// Mock pages data
interface PageConfig {
  [key: string]: {
    component: FC<any>;
    props: any;
  };
}

const pages: PageConfig = {
  'login': {
    component: Login as FC<LoginProps>,
    props: {
      errors: {},
      status: null,
    }
  },
  'forgot-password': {
    component: ForgotPassword,
    props: {}
  },
  'dashboard/csc': {
    component: CSC as FC<DashboardProps>,
    props: {
      auth: { user: { ...mockUser, role: 'CSC' } },
      evaluations: [
        { id: 1, title: 'Évaluation 1', status: 'draft', date: '2025-05-15', score: 3.7 },
        { id: 2, title: 'Évaluation 2', status: 'submitted', date: '2025-05-20', score: 4.2 },
      ],
      team: [
        { id: 1, name: 'Jean Dupont', role: 'CDS', performance: 4.2, evaluations: 5 },
        { id: 2, name: 'Marie Claire', role: 'CDS', performance: 3.8, evaluations: 3 },
      ]
    }
  },
  'dashboard/cds': {
    component: CDS as FC<DashboardProps>,
    props: {
      auth: { user: { ...mockUser, role: 'CDS' } },
      skills: [
        { name: 'Leadership', score: 4.2, average: 3.8 },
        { name: 'Communication', score: 3.9, average: 3.5 },
        { name: 'Technique', score: 4.5, average: 4.0 },
      ],
      development: [
        { id: 1, title: 'Formation Leadership', status: 'completed', date: '2025-04-10' },
        { id: 2, title: 'Atelier Communication', status: 'pending', date: '2025-06-15' },
      ]
    }
  },
  'dashboard/cdv': {
    component: CDV as FC<DashboardProps>,
    props: {
      auth: { user: { ...mockUser, role: 'CDV' } },
      metrics: {
        evaluations: 12,
        completion: 85,
        performance: 4.1,
        improvement: 0.3
      },
      team: [
        { id: 1, name: 'Pierre Martin', role: 'CDS', performance: 4.0, region: 'Littoral' },
        { id: 2, name: 'Sophie Leblanc', role: 'CDS', performance: 3.7, region: 'Centre' },
      ]
    }
  }
};

// Get the current page from URL
const getCurrentPage = () => {
  const path = window.location.pathname.substring(1) || 'login';
  return pages[path as keyof typeof pages] || pages['login'];
};

// Render the current page
const renderPage = () => {
  const path = window.location.pathname.substring(1) || 'login';
  const pageName = path.replace('/', '');
  const page = pages[path as keyof typeof pages] || pages['login'];
  const container = document.getElementById('app');
  
  if (container) {
    // Détacher tout root existant pour éviter les erreurs
    try {
      // @ts-ignore
      if (container._reactRootContainer) {
        // @ts-ignore
        container._reactRootContainer.unmount();
      }
    } catch (e) {
      console.error('Erreur lors du détachement du root:', e);
    }
    
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <div className="demo-page">
          <h2 className="demo-page-title">{pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h2>
          <page.component {...page.props} />
        </div>
      </React.StrictMode>
    );
    
    // Mettre à jour la classe active dans la navigation
    document.querySelectorAll('.demo-nav-button').forEach(button => {
      button.classList.remove('active');
      // @ts-ignore
      if (button.dataset.path === path) {
        button.classList.add('active');
      }
    });
  }
};

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderPage();
});

// Handle navigation
window.addEventListener('popstate', () => {
  renderPage();
});

// Déclaration de type pour window
declare global {
  interface Window {
    navigateTo: (path: string) => void;
  }
}

// Export a navigation function
window.navigateTo = (path: string) => {
  window.history.pushState({}, '', path);
  renderPage();
};
