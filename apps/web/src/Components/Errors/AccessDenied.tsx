import React from 'react';
import { Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { ArrowLeft, Home, Shield } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  showActions?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Accès non autorisé',
  description = "Vous n'avez pas les permissions nécessaires pour accéder à cette page. Contactez votre administrateur si vous pensez qu'il s'agit d'une erreur.",
  showActions = true,
}) => {
  return (
    <div className="min-h-[60vh] bg-sabc-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <svg
            className="w-64 h-64 mx-auto"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="sabcGradient403Inline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="shieldGradientInline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E53E3E" />
                <stop offset="100%" stopColor="#C53030" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="150" r="120" fill="url(#sabcGradient403Inline)" />
            <path
              d="M200 60 C220 60 240 70 240 90 L240 140 C240 180 220 200 200 220 C180 200 160 180 160 140 L160 90 C160 70 180 60 200 60 Z"
              fill="url(#shieldGradientInline)"
              stroke="#C53030"
              strokeWidth="2"
            />
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
            <circle cx="120" cy="80" r="3" fill="#FF9800" />
            <circle cx="280" cy="80" r="3" fill="#FF9800" />
            <circle cx="100" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
            <circle cx="300" cy="200" r="4" fill="#E53E3E" opacity="0.7" />
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
            <circle cx="60" cy="100" r="2" fill="#E53E3E" opacity="0.5" />
            <circle cx="340" cy="100" r="2" fill="#E53E3E" opacity="0.5" />
            <circle cx="60" cy="180" r="2" fill="#FF9800" opacity="0.5" />
            <circle cx="340" cy="180" r="2" fill="#FF9800" opacity="0.5" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-sabc-gray-900 mb-4">{title}</h2>
        <p className="text-base sm:text-lg text-sabc-gray-600 mb-8 leading-relaxed">
          {description}
        </p>

        {showActions && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => globalThis.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Page précédente
            </Button>
          </div>
        )}

        <div className="mt-8 p-4 bg-sabc-red-light rounded-lg border border-sabc-red-primary border-opacity-20">
          <div className="flex items-center justify-center text-sabc-red-dark">
            <Shield className="w-5 h-5 mr-2" />
            <span className="text-xs sm:text-sm font-medium">
              Zone protégée - Authentification requise
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
