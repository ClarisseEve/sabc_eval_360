import React from 'react';
import { Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { BrandMark } from '@/Components/Brand/BrandMark';
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
        <div className="mb-8 flex flex-col items-center gap-6">
          <BrandMark className="h-28 w-28" />
          <span className="sabc-display text-7xl leading-none text-sabc-red-primary">403</span>
        </div>

        <h2 className="text-3xl sm:text-3xl text-sabc-gray-900 mb-4">{title}</h2>
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
