import React, { useEffect } from 'react';
import { useAuthContext } from '@/Contexts/AuthContext';
import { router } from '@inertiajs/react';

/**
 * Composant de redirection basé sur le rôle de l'utilisateur
 * 
 * Ce composant redirige automatiquement l'utilisateur vers le tableau de bord
 * correspondant à son rôle dans l'organisation SABC
 */
const RoleRedirector: React.FC = () => {
  const { user } = useAuthContext();
  
  useEffect(() => {
    if (user) {
      // Redirection basée sur le rôle de l'utilisateur
      // @ts-ignore - Nous savons que role_nom existe sur l'objet user
      const roleNom = user.role_nom || user.role;
      
      // Redirection vers le tableau de bord approprié
      switch (roleNom.toUpperCase()) {
        case 'ADMIN':
          router.visit('/admin/dashboard');
          break;
        case 'DR':
          router.visit('/dr/dashboard');
          break;
        case 'CDTT':
          router.visit('/cdtt/dashboard');
          break;
        case 'CSC':
          router.visit('/csc/dashboard');
          break;
        case 'CDV':
          router.visit('/cdv/dashboard');
          break;
        case 'CDS':
          router.visit('/cds/dashboard');
          break;
        case 'RTM':
          router.visit('/rtm/dashboard');
          break;
        case 'SRMO':
          router.visit('/srmo/dashboard');
          break;
        case 'TMO':
          router.visit('/tmo/dashboard');
          break;
        case 'SS':
          router.visit('/ss/dashboard');
          break;
        case 'AS':
          router.visit('/as/dashboard');
          break;
        default:
          // Redirection par défaut si le rôle n'est pas reconnu
          router.visit('/profile');
          break;
      }
    } else {
      // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
      router.visit('/login');
    }
  }, [user]);
  
  // Affichage d'un message de chargement pendant la redirection
  return (
    <div className="flex h-screen w-full items-center justify-center bg-sabc-gray-50">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sabc-gray-200 border-t-sabc-red-primary mx-auto"></div>
        <h2 className="text-xl font-semibold text-sabc-gray-800">Redirection en cours...</h2>
        <p className="mt-2 text-sabc-gray-600">Vous allez être redirigé vers votre tableau de bord.</p>
      </div>
    </div>
  );
};

export default RoleRedirector;
