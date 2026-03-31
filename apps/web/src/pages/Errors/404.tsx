import React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * Page d'erreur 404 - Page non trouvée
 * Design sobre avec illustration vectorielle aux couleurs SABC
 */
const Error404: React.FC = () => {
  return (
    <>
      <Head title="Page non trouvée - 404" />
      
      <div className="min-h-screen bg-sabc-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Illustration vectorielle 404 */}
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fond avec dégradé SABC */}
              <defs>
                <linearGradient id="sabcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              
              {/* Cercle de fond */}
              <circle cx="200" cy="150" r="120" fill="url(#sabcGradient)" />
              
              {/* Chiffre 4 */}
              <path
                d="M120 80 L120 140 L160 140 L160 80 L160 200 M120 140 L80 140"
                stroke="#E53E3E"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              
              {/* Chiffre 0 */}
              <ellipse
                cx="200"
                cy="140"
                rx="30"
                ry="60"
                stroke="#E53E3E"
                strokeWidth="8"
                fill="none"
              />
              
              {/* Chiffre 4 */}
              <path
                d="M280 80 L280 140 L320 140 L320 80 L320 200 M280 140 L240 140"
                stroke="#E53E3E"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              
              {/* Éléments décoratifs */}
              <circle cx="100" cy="60" r="4" fill="#FF9800" />
              <circle cx="300" cy="60" r="4" fill="#FF9800" />
              <circle cx="80" cy="220" r="3" fill="#E53E3E" />
              <circle cx="320" cy="220" r="3" fill="#E53E3E" />
              
              {/* Points décoratifs */}
              <circle cx="60" cy="100" r="2" fill="#FF9800" opacity="0.6" />
              <circle cx="340" cy="100" r="2" fill="#FF9800" opacity="0.6" />
              <circle cx="50" cy="180" r="2" fill="#E53E3E" opacity="0.6" />
              <circle cx="350" cy="180" r="2" fill="#E53E3E" opacity="0.6" />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-sabc-gray-900 mb-4">
            Page non trouvée
          </h1>
          
          {/* Message */}
          <p className="text-lg text-sabc-gray-600 mb-8 leading-relaxed">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            Vérifiez l'URL ou retournez à l'accueil.
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

          {/* Footer discret */}
          <div className="mt-12 text-sm text-sabc-gray-400">
            SABC Évaluation 360° - Erreur 404
          </div>
        </div>
      </div>
    </>
  );
};

export default Error404;
