import React, { useRef, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Lock, Save } from 'lucide-react';
import { useAuthContext } from '@/Contexts/AuthContext';
import { profileApi } from '@/Services/api';

export default function Password() {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);
  const { user } = useAuthContext();
  const [data, setData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [processing, setProcessing] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const layoutUser = {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Utilisateur' : 'Utilisateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: user?.avatar,
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage(null);
    try {
      await profileApi.changePassword(data);
      setData({ current_password: '', password: '', password_confirmation: '' });
      setRecentlySuccessful(true);
      window.setTimeout(() => setRecentlySuccessful(false), 2500);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Une erreur est survenue. Vérifiez votre mot de passe actuel et réessayez.';
      setErrorMessage(message);
      if (message.toLowerCase().includes('actuel')) {
        currentPasswordInput.current?.focus();
      } else {
        passwordInput.current?.focus();
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Paramètres - Mot de passe" notifications={[]}>
      <Head title="Paramètres - Mot de passe" />
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
              <Lock className="h-5 w-5" />
              Modifier le mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updatePassword} className="space-y-6">
              {errorMessage ? (
                <div role="alert" className="rounded-md border border-sabc-error/30 bg-sabc-error/10 px-4 py-3 text-sm font-medium text-sabc-error">
                  {errorMessage}
                </div>
              ) : null}
              <div>
                <label htmlFor="current_password" className="mb-2 block text-sm font-medium text-sabc-gray-800">Mot de passe actuel</label>
                <Input id="current_password" ref={currentPasswordInput} type="password" value={data.current_password} onChange={(e) => setData((p) => ({ ...p, current_password: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-sabc-gray-800">Nouveau mot de passe</label>
                <Input id="password" ref={passwordInput} type="password" value={data.password} onChange={(e) => setData((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="password_confirmation" className="mb-2 block text-sm font-medium text-sabc-gray-800">Confirmation</label>
                <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData((p) => ({ ...p, password_confirmation: e.target.value }))} />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={processing} className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {processing ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                </Button>
                {recentlySuccessful ? <p className="text-sm font-medium text-sabc-success">Mot de passe modifié</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
