import React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Page d'erreur 500 - Erreur serveur
 * Design sobre avec illustration vectorielle aux couleurs SABC
 */
const Error500: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Head title="Erreur serveur - 500" />
      
      <div className="min-h-screen bg-sabc-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Illustration vectorielle 500 */}
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fond avec dégradé SABC */}
              <defs>
                <linearGradient id="sabcGradient500" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="serverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF9800" />
                  <stop offset="100%" stopColor="#E53E3E" />
                </linearGradient>
              </defs>
              
              {/* Cercle de fond */}
              <circle cx="200" cy="150" r="120" fill="url(#sabcGradient500)" />
              
              {/* Serveur principal */}
              <rect
                x="160"
                y="80"
                width="80"
                height="120"
                rx="8"
                fill="url(#serverGradient)"
                stroke="#C53030"
                strokeWidth="2"
              />
              
              {/* Écran du serveur */}
              <rect
                x="170"
                y="90"
                width="60"
                height="40"
                rx="4"
                fill="#1A202C"
              />
              
              {/* Lignes d'erreur sur l'écran */}
              <line x1="175" y1="100" x2="220" y2="100" stroke="#E53E3E" strokeWidth="2" />
              <line x1="175" y1="110" x2="210" y2="110" stroke="#E53E3E" strokeWidth="2" />
              <line x1="175" y1="120" x2="225" y2="120" stroke="#E53E3E" strokeWidth="2" />
              
              {/* Voyants du serveur */}
              <circle cx="180" cy="150" r="4" fill="#E53E3E" />
              <circle cx="200" cy="150" r="4" fill="#FF9800" />
              <circle cx="220" cy="150" r="4" fill="#E53E3E" />
              
              {/* Grilles de ventilation */}
              <rect x="170" y="160" width="60" height="2" fill="#C53030" />
              <rect x="170" y="165" width="60" height="2" fill="#C53030" />
              <rect x="170" y="170" width="60" height="2" fill="#C53030" />
              
              {/* Câbles */}
              <path
                d="M160 180 Q140 190 120 180 Q100 170 80 180"
                stroke="#9E9E9E"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M240 180 Q260 190 280 180 Q300 170 320 180"
                stroke="#9E9E9E"
                strokeWidth="3"
                fill="none"
              />
              
              {/* Étincelles d'erreur */}
              <circle cx="140" cy="100" r="2" fill="#FF9800" />
              <circle cx="260" cy="110" r="2" fill="#E53E3E" />
              <circle cx="130" cy="160" r="1.5" fill="#FF9800" />
              <circle cx="270" cy="150" r="1.5" fill="#E53E3E" />
              
              {/* Symboles d'alerte */}
              <path
                d="M100 60 L110 60 L105 50 Z"
                fill="#FF9800"
              />
              <circle cx="105" cy="65" r="1" fill="#FF9800" />
              
              <path
                d="M300 60 L310 60 L305 50 Z"
                fill="#E53E3E"
              />
              <circle cx="305" cy="65" r="1" fill="#E53E3E" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-sabc-gray-900 mb-4">
            Erreur serveur
          </h1>
          
          {/* Message */}
          <p className="text-lg text-sabc-gray-600 mb-8 leading-relaxed">
            Une erreur inattendue s'est produite sur nos serveurs. 
            Notre équipe technique a été automatiquement notifiée.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="default" 
              size="lg"
              onClick={handleRefresh}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualiser la page
            </Button>
            
            <Link href="/">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>

          {/* Information technique */}
          <div className="mt-8 p-4 bg-sabc-accent-light rounded-lg border border-sabc-accent border-opacity-20">
            <div className="flex items-center justify-center text-sabc-gray-700">
              <AlertTriangle className="w-5 h-5 mr-2 text-sabc-accent" />
              <span className="text-sm">
                Code d'erreur: 500 - Erreur interne du serveur
              </span>
            </div>
          </div>

          {/* Footer discret */}
          <div className="mt-12 text-sm text-sabc-gray-400">
            SABC Évaluation 360° - Erreur 500
          </div>
        </div>
      </div>
    </>
  );
};

export default Error500;
