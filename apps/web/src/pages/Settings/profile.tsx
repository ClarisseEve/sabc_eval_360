import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { User, Mail, Save, Info, Building2, Bell, Camera } from 'lucide-react';
import { useAuthContext } from '@/Contexts/AuthContext';
import { formatPersonName } from '@/utils/helpers';

export default function Profile() {
  const { user, updateProfile } = useAuthContext();

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    photo_url: user?.avatar || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    date_naissance: user?.date_naissance
      ? user.date_naissance.slice(0, 10)
      : '',
  });

  const [preferences, setPreferences] = useState({
    notifications_email: user?.preferences_json?.notifications_email ?? true,
    notifications_app: user?.preferences_json?.notifications_app ?? true,
    langue: (user?.preferences_json?.langue ?? 'fr') as 'fr' | 'en',
  });

  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layoutUser = {
    name: formatPersonName(user),
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: user?.avatar,
  };

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);
    try {
      const payload: Record<string, any> = { ...formData };
      if (!payload.date_naissance) delete payload.date_naissance;
      payload.preferences = preferences;
      await updateProfile(payload as any);
      setRecentlySuccessful(true);
      window.setTimeout(() => setRecentlySuccessful(false), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Paramètres - Profil" notifications={[]}>
      <Head title="Paramètres - Profil" />
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Mon profil</h1>
          <p className="mt-1 text-sm text-sabc-gray-600">
            Consultez votre rattachement et mettez à jour vos informations personnelles.
          </p>
        </header>

        {/* Section organisationnelle — read-only */}
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-sabc-gray-700">
              <Building2 className="h-4 w-4" />
              Informations organisationnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-sabc-gray-500 font-medium">Matricule</dt>
                <dd className="text-sabc-gray-800 font-semibold">{user?.matricule || '—'}</dd>
              </div>
              <div>
                <dt className="text-sabc-gray-500 font-medium">Rôle</dt>
                <dd className="text-sabc-gray-800">{user?.role_nom || user?.role || '—'}</dd>
              </div>
              <div>
                <dt className="text-sabc-gray-500 font-medium">Région</dt>
                <dd className="text-sabc-gray-800">{user?.region_nom || user?.id_region || '—'}</dd>
              </div>
              <div>
                <dt className="text-sabc-gray-500 font-medium">Branche</dt>
                <dd className="text-sabc-gray-800">{user?.branche?.nom_branche ?? user?.id_branche ?? '—'}</dd>
              </div>
              {user?.manager_matricule && (
                <div>
                  <dt className="text-sabc-gray-500 font-medium">Manager</dt>
                  <dd className="text-sabc-gray-800">{user.manager_matricule}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Message info administrateur */}
        <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Pour modifier votre région, branche ou rôle, contactez l'administrateur.
          </span>
        </div>

        {/* Formulaire informations personnelles + préférences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">

              {/* Nom / Prénom */}
              <div>
                <label htmlFor="photo_url" className="mb-2 flex items-center gap-2 text-sm font-medium text-sabc-gray-800">
                  <Camera className="h-4 w-4" />
                  Photo de profil
                </label>
                <div className="flex items-center gap-4">
                  {formData.photo_url ? <img src={formData.photo_url} alt="Aperçu du profil" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sabc-red-primary/10 text-sabc-red-primary"><User className="h-6 w-6" /></div>}
                  <Input id="photo_url" type="url" value={formData.photo_url} onChange={setField('photo_url')} placeholder="https://.../photo.jpg" />
                </div>
                <p className="mt-1 text-xs text-sabc-gray-500">Ajoutez l’URL d’une photo accessible pour l’afficher dans votre profil.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="nom" className="mb-2 block text-sm font-medium text-sabc-gray-800">
                    Nom
                  </label>
                  <Input id="nom" value={formData.nom} onChange={setField('nom')} />
                </div>
                <div>
                  <label htmlFor="prenom" className="mb-2 block text-sm font-medium text-sabc-gray-800">
                    Prénom
                  </label>
                  <Input id="prenom" value={formData.prenom} onChange={setField('prenom')} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-sabc-gray-800">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input id="email" type="email" value={formData.email} onChange={setField('email')} />
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="telephone" className="mb-2 block text-sm font-medium text-sabc-gray-800">
                  Téléphone
                </label>
                <Input id="telephone" value={formData.telephone} onChange={setField('telephone')} />
              </div>

              {/* Date de naissance */}
              <div>
                <label htmlFor="date_naissance" className="mb-2 block text-sm font-medium text-sabc-gray-800">
                  Date de naissance
                </label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={formData.date_naissance}
                  onChange={setField('date_naissance')}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {/* Préférences */}
              <div className="space-y-3 border-t pt-4">
                <p className="flex items-center gap-2 text-sm font-medium text-sabc-gray-800">
                  <Bell className="h-4 w-4" />
                  Préférences de notifications
                </p>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-sabc-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-sabc-red-primary"
                    checked={preferences.notifications_email}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, notifications_email: e.target.checked }))
                    }
                  />
                  Recevoir les notifications par email
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-sabc-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-sabc-red-primary"
                    checked={preferences.notifications_app}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, notifications_app: e.target.checked }))
                    }
                  />
                  Recevoir les notifications dans l'application
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Langue de l'interface
                  </label>
                  <select
                    value={preferences.langue}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, langue: e.target.value as 'fr' | 'en' }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {processing ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                {recentlySuccessful && (
                  <p className="text-sm font-medium text-sabc-success">Profil mis à jour</p>
                )}
              </div>

            </form>
            {error && (
              <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
