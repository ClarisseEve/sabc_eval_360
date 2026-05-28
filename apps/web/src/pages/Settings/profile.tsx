import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { User, Mail, Save, Info, Building2, Bell } from 'lucide-react';
import { useAuthContext } from '@/Contexts/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuthContext();

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    date_naissance: user?.date_naissance
      ? user.date_naissance.slice(0, 10)
      : '',
  });

  const [preferences, setPreferences] = useState({
    notifications_email: user?.preferences_json?.notifications_email ?? true,
    notifications_app: user?.preferences_json?.notifications_app ?? true,
  });

  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const layoutUser = {
    name: user
      ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur'
      : 'Utilisateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: user?.avatar,
  };

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const payload: Record<string, any> = { ...formData };
      if (!payload.date_naissance) delete payload.date_naissance;
      payload.preferences = preferences;
      await updateProfile(payload as any);
      setRecentlySuccessful(true);
      window.setTimeout(() => setRecentlySuccessful(false), 2500);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Paramètres - Profil" notifications={[]}>
      <Head title="Paramètres - Profil" />
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">

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
                <dd className="text-sabc-gray-800">{user?.id_branche || '—'}</dd>
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
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
