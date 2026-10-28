import React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { BrandMark } from '@/Components/Brand/BrandMark';
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
          <div className="mb-8 flex flex-col items-center gap-6">
            <BrandMark className="h-28 w-28" />
            <span className="sabc-display text-7xl leading-none text-sabc-red-primary">404</span>
          </div>

          {/* Titre */}
          <h1 className="text-3xl text-sabc-gray-900 mb-4">
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
