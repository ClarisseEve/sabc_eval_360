import React from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthBridge } from '@/hooks/useAuthBridge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Slider } from '@/Components/UI/Slider/Slider';
import { DISPLAY_SCALE_DEFAULT, useDisplayScale } from '@/hooks/useDisplayScale';

/**
 * Page des paramètres commune à tous les rôles
 */
const Settings: React.FC = () => {
  const { user } = useAuth();
  const authContext = useAuthBridge();
  const { scale, setScale, resetScale, options } = useDisplayScale();
  const scaleIndex = React.useMemo(() => {
    const idx = options.findIndex((value) => value === scale);
    if (idx !== -1) {
      return idx;
    }
    const defaultIdx = options.findIndex((value) => value === DISPLAY_SCALE_DEFAULT);
    return defaultIdx !== -1 ? defaultIdx : 0;
  }, [options, scale]);

  const marks = React.useMemo(
    () => options.map((value, index) => ({ value: index, label: `${Math.round(value * 100)}%` })),
    [options],
  );

  return (
    <AppLayout user={adaptUserForLayout(authContext.user || user)}>
      <Head title="Paramètres - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-sabc-gray-900">Paramètres</h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Mot de passe</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Modifiez votre mot de passe régulièrement pour garantir la sécurité de votre compte.
                  </p>
                  <Button>Modifier le mot de passe</Button>
                </div>
                
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Authentification à deux facteurs</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Activez l'authentification à deux facteurs pour renforcer la sécurité de votre compte.
                  </p>
                  <Button variant="outline">Configurer l'authentification à deux facteurs</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Langue</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Sélectionnez la langue d'affichage de l'application.
                  </p>
                  <select className="w-full rounded-md border border-sabc-gray-200 p-2">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Notifications</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Configurez vos préférences de notification.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="email-notif" className="mr-2" />
                      <label htmlFor="email-notif">Notifications par email</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="app-notif" className="mr-2" />
                      <label htmlFor="app-notif">Notifications dans l'application</label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium text-sabc-gray-800">Échelle de l'interface</h3>
                  <p className="mb-4 text-sm text-sabc-gray-600">
                    Ajustez la taille globale des textes et composants selon vos préférences. 90&nbsp;% est utilisé par défaut.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-sabc-gray-700">
                      <span>Affichage actuel</span>
                      <span>{Math.round(scale * 100)}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={options.length - 1}
                      step={1}
                      value={scaleIndex}
                      marks={marks}
                      tooltip
                      onChange={(index) => {
                        const option = options[Number(index)];
                        if (option) {
                          setScale(option);
                        }
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetScale}
                        disabled={scale === DISPLAY_SCALE_DEFAULT}
                      >
                        Réinitialiser
                      </Button>
                      <span className="text-xs text-sabc-gray-500">
                        Astuce&nbsp;: choisissez 100&nbsp;% pour un affichage natif ou 85&nbsp;% pour maximiser l'espace disponible.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
