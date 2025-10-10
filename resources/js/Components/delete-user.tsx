import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from '@/routes';
import { Button } from '@/Components/UI/Button/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/UI/Dialog/Dialog';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';

/**
 * Composant pour la suppression de compte utilisateur
 * Respecte les règles graphiques SABC
 */
export default function DeleteUser() {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const [password, setPassword] = useState('');

  const {
    delete: destroy,
    processing,
    reset,
  } = useForm({});

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };

  const deleteUser = (e: React.FormEvent) => {
    e.preventDefault();

    destroy(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => {
        // Focus sur le champ de mot de passe en cas d'erreur
        if (document.getElementById('password')) {
          (document.getElementById('password') as HTMLInputElement).focus();
        }
      },
      onFinish: () => reset(),
    });
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);
    setPassword('');
    reset();
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-medium text-gray-900">Supprimer le compte</h2>
        <p className="mt-1 text-sm text-gray-600">
          Une fois votre compte supprimé, toutes ses ressources et données seront définitivement effacées.
          Avant de supprimer votre compte, veuillez télécharger toutes les données ou informations que vous souhaitez conserver.
        </p>
      </header>

      <Button
        onClick={confirmUserDeletion}
        style={{ 
          backgroundColor: 'var(--sabc-error)',
          color: 'white'
        }}
      >
        Supprimer le compte
      </Button>

      <Dialog open={confirmingUserDeletion} onOpenChange={setConfirmingUserDeletion}>
        <DialogContent>
          <form onSubmit={deleteUser}>
            <DialogHeader>
              <DialogTitle>Êtes-vous sûr de vouloir supprimer votre compte?</DialogTitle>
              <DialogDescription>
                Une fois votre compte supprimé, toutes ses ressources et données seront définitivement effacées.
                Veuillez entrer votre mot de passe pour confirmer que vous souhaitez supprimer définitivement votre compte.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full"
                placeholder="Mot de passe"
                required
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeModal}>
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={processing}
                style={{ 
                  backgroundColor: 'var(--sabc-error)',
                  color: 'white'
                }}
              >
                Supprimer le compte
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
