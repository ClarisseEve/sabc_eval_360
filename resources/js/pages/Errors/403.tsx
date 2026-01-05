import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button/Button';
import { Home, Shield, ArrowLeft } from 'lucide-react';

/**
 * Page d'erreur 403 - Accès interdit
 * Design sobre avec illustration vectorielle aux couleurs SABC
 */
const Error403: React.FC = () => {
  return (
    <>
      <Head title="Accès interdit - 403" />
      
      <div className="min-h-screen bg-sabc-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Illustration vectorielle 403 */}
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fond avec dégradé SABC */}
              <defs>
                <linearGradient id="sabcGradient403" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E53E3E" />
                  <stop offset="100%" stopColor="#C53030" />
                </linearGradient>
              </defs>
              
              {/* Cercle de fond */}
              <circle cx="200" cy="150" r="120" fill="url(#sabcGradient403)" />
              
              {/* Bouclier principal */}
              <path
                d="M200 60 C220 60 240 70 240 90 L240 140 C240 180 220 200 200 220 C180 200 160 180 160 140 L160 90 C160 70 180 60 200 60 Z"
                fill="url(#shieldGradient)"
                stroke="#C53030"
                strokeWidth="2"
              />
              
              {/* Symbole d'interdiction */}
              <circle
                cx="200"
                cy="130"
                r="25"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
              />
              <line
                x1="185"
                y1="115"
                x2="215"
                y2="145"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              
              {/* Éléments décoratifs autour du bouclier */}
              <circle cx="120" cy="80" r="3" fill="#FF9800" />
              <circle cx="280" cy="80" r="3" fill="#FF9800" />
              <circle cx="100" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
              <circle cx="300" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
              
              {/* Lignes de sécurité */}
              <path
                d="M80 120 L140 120 M260 120 L320 120"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M80 160 L140 160 M260 160 L320 160"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              
              {/* Points de sécurité */}
              <circle cx="60" cy="100" r="2" fill="#E53E3E" opacity="0.5" />
              <circle cx="340" cy="100" r="2" fill="#E53E3E" opacity="0.5" />
              <circle cx="60" cy="180" r="2" fill="#FF9800" opacity="0.5" />
              <circle cx="340" cy="180" r="2" fill="#FF9800" opacity="0.5" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-sabc-gray-900 mb-4">
            Accès interdit
          </h1>
          
          {/* Message */}
          <p className="text-lg text-sabc-gray-600 mb-8 leading-relaxed">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button 
                variant="default" 
                size="lg"
                className="w-full sm:w-auto"
              >
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Page précédente
            </Button>
          </div>

          {/* Information supplémentaire */}
          <div className="mt-8 p-4 bg-sabc-red-light rounded-lg border border-sabc-red-primary border-opacity-20">
            <div className="flex items-center justify-center text-sabc-red-dark">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                Zone protégée - Authentification requise
              </span>
            </div>
          </div>

          {/* Footer discret */}
          <div className="mt-12 text-sm text-sabc-gray-400">
            SABC Évaluation 360° - Erreur 403
          </div>
        </div>
      </div>
    </>
  );
};

export default Error403;
