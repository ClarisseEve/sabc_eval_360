import React, { FormEventHandler, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { route } from '@/routes';
import { Lock, Save } from 'lucide-react';

interface Props {
  user: any;
  pageTitle: string;
  isAdmin?: boolean;
  permissions?: string[];
}

export default function Password({ user, pageTitle, isAdmin, permissions }: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('settings.password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout 
            user={user} 
            pageTitle={pageTitle || "Paramètres - Mot de passe"}
            isAdmin={isAdmin}
            permissions={permissions}
        >
            <Head title="Paramètres - Mot de passe" />

            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
                            <Lock className="h-5 w-5" />
                            Modifier le mot de passe
                        </CardTitle>
                        <p className="text-sabc-gray-400 text-sm">
                            Assurez-vous d'utiliser un mot de passe long et sécurisé pour protéger votre compte SABC.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={updatePassword} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="current_password" className="text-sm font-medium text-sabc-gray-800">
                                    Mot de passe actuel
                                </label>
                                <Input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    type="password"
                                    className="w-full"
                                    autoComplete="current-password"
                                    placeholder="Saisissez votre mot de passe actuel"
                                    required
                                />
                                {errors.current_password && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.current_password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-sabc-gray-800">
                                    Nouveau mot de passe
                                </label>
                                <Input
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    type="password"
                                    className="w-full"
                                    autoComplete="new-password"
                                    placeholder="Saisissez votre nouveau mot de passe"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password_confirmation" className="text-sm font-medium text-sabc-gray-800">
                                    Confirmer le nouveau mot de passe
                                </label>
                                <Input
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    type="password"
                                    className="w-full"
                                    autoComplete="new-password"
                                    placeholder="Confirmez votre nouveau mot de passe"
                                    required
                                />
                                {errors.password_confirmation && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button 
                                    type="submit"
                                    disabled={processing}
                                    className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-x-2"
                                    enterTo="opacity-100 translate-x-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveTo="opacity-0 translate-x-2"
                                >
                                    <p className="text-sm text-sabc-success font-medium">
                                        ✓ Mot de passe modifié avec succès
                                    </p>
                                </Transition>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
