import React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
}

/**
 * Page d'erreur générique personnalisable
 * Design sobre avec illustration vectorielle aux couleurs SABC
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  status = 500,
  title = 'Une erreur est survenue',
  message = 'Nous nous excusons pour la gêne occasionnée. Veuillez réessayer plus tard.'
}) => {
  return (
    <>
      <Head title={`${title} - ${status}`} />
      
      <div className="min-h-screen bg-sabc-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Illustration vectorielle générique */}
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Fond avec dégradé SABC */}
              <defs>
                <linearGradient id="sabcGradientError" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF9800" />
                  <stop offset="100%" stopColor="#E53E3E" />
                </linearGradient>
              </defs>
              
              {/* Cercle de fond */}
              <circle cx="200" cy="150" r="120" fill="url(#sabcGradientError)" />
              
              {/* Triangle d'alerte principal */}
              <path
                d="M200 70 L260 170 L140 170 Z"
                fill="url(#alertGradient)"
                stroke="#C53030"
                strokeWidth="3"
              />
              
              {/* Point d'exclamation */}
              <line
                x1="200"
                y1="110"
                x2="200"
                y2="140"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="200" cy="155" r="4" fill="#FFFFFF" />
              
              {/* Éléments décoratifs */}
              <circle cx="120" cy="80" r="3" fill="#FF9800" opacity="0.7" />
              <circle cx="280" cy="80" r="3" fill="#E53E3E" opacity="0.7" />
              <circle cx="100" cy="200" r="4" fill="#FF9800" opacity="0.5" />
              <circle cx="300" cy="200" r="4" fill="#E53E3E" opacity="0.5" />
              
              {/* Lignes d'alerte */}
              <path
                d="M80 120 L120 120 M280 120 L320 120"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
              <path
                d="M70 180 L110 180 M290 180 L330 180"
                stroke="#E53E3E"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
              
              {/* Points d'attention */}
              <circle cx="60" cy="100" r="2" fill="#FF9800" opacity="0.6" />
              <circle cx="340" cy="100" r="2" fill="#FF9800" opacity="0.6" />
              <circle cx="50" cy="200" r="2" fill="#E53E3E" opacity="0.6" />
              <circle cx="350" cy="200" r="2" fill="#E53E3E" opacity="0.6" />
            </svg>
          </div>

          {/* Code d'erreur */}
          <div className="text-6xl font-bold text-sabc-red-primary mb-4">
            {status}
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-sabc-gray-900 mb-4">
            {title}
          </h1>
          
          {/* Message */}
          <p className="text-lg text-sabc-gray-600 mb-8 leading-relaxed">
            {message}
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
          <div className="mt-8 p-4 bg-sabc-accent-light rounded-lg border border-sabc-accent border-opacity-20">
            <div className="flex items-center justify-center text-sabc-gray-700">
              <AlertCircle className="w-5 h-5 mr-2 text-sabc-accent" />
              <span className="text-sm">
                Si le problème persiste, contactez le support technique
              </span>
            </div>
          </div>

          {/* Footer discret */}
          <div className="mt-12 text-sm text-sabc-gray-400">
            SABC Évaluation 360° - Erreur {status}
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
