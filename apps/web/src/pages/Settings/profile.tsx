import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { User, Mail, Save } from 'lucide-react';
import { useAuthContext } from '@/Contexts/AuthContext';
import { profileApi } from '@/Services/api';

export default function Profile() {
  const { user, updateProfile } = useAuthContext();
  const [data, setData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  });
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: user?.avatar,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await profileApi.update(data);
      await updateProfile(data as any);
      setRecentlySuccessful(true);
      window.setTimeout(() => setRecentlySuccessful(false), 2500);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Paramètres - Profil" notifications={[]}>
      <Head title="Paramètres - Profil" />
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
              <User className="h-5 w-5" />
              Informations du profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="nom" className="mb-2 block text-sm font-medium text-sabc-gray-800">Nom</label>
                  <Input id="nom" value={data.nom} onChange={(e) => setData((p) => ({ ...p, nom: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="prenom" className="mb-2 block text-sm font-medium text-sabc-gray-800">Prénom</label>
                  <Input id="prenom" value={data.prenom} onChange={(e) => setData((p) => ({ ...p, prenom: e.target.value }))} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-sabc-gray-800">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input id="email" type="email" value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="telephone" className="mb-2 block text-sm font-medium text-sabc-gray-800">Téléphone</label>
                <Input id="telephone" value={data.telephone} onChange={(e) => setData((p) => ({ ...p, telephone: e.target.value }))} />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={processing} className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {processing ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                {recentlySuccessful ? <p className="text-sm font-medium text-sabc-success">Profil mis à jour</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
