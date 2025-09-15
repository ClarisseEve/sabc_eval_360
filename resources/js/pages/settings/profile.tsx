import React, { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { route } from '@/routes';
import { User, Mail, Save, AlertTriangle } from 'lucide-react';

interface Props {
  user: any;
  pageTitle: string;
  isAdmin?: boolean;
  permissions?: string[];
  mustVerifyEmail: boolean;
  status?: string;
}

type ProfileForm = {
    name: string;
    email: string;
}

export default function Profile({ user, pageTitle, isAdmin, permissions, mustVerifyEmail, status }: Props) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: user.name || '',
        email: user.email || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('settings.profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout 
            user={user} 
            pageTitle={pageTitle || "Paramètres - Profil"}
            isAdmin={isAdmin}
            permissions={permissions}
        >
            <Head title="Paramètres - Profil" />

            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sabc-red-primary">
                            <User className="h-5 w-5" />
                            Informations du profil
                        </CardTitle>
                        <p className="text-sabc-gray-400 text-sm">
                            Modifiez vos informations personnelles et votre adresse email SABC.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-sabc-gray-800">
                                    Nom complet
                                </label>
                                <Input
                                    id="name"
                                    className="w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Saisissez votre nom complet"
                                />
                                {errors.name && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-sabc-gray-800 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Adresse email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="w-full"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Saisissez votre adresse email SABC"
                                />
                                {errors.email && (
                                    <p className="text-sm text-sabc-error mt-1">{errors.email}</p>
                                )}
                            </div>

                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="bg-sabc-accent-light border border-sabc-accent rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-sabc-accent mt-0.5" />
                                        <div>
                                            <p className="text-sm text-sabc-gray-800 font-medium">
                                                Adresse email non vérifiée
                                            </p>
                                            <p className="text-sm text-sabc-gray-400 mt-1">
                                                Votre adresse email n'est pas encore vérifiée.{' '}
                                                <Link
                                                    href={route('verification.send')}
                                                    method="post"
                                                    as="button"
                                                    className="text-sabc-red-primary underline hover:text-sabc-red-dark transition-colors"
                                                >
                                                    Cliquez ici pour renvoyer l'email de vérification.
                                                </Link>
                                            </p>
                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-sabc-success">
                                                    ✓ Un nouveau lien de vérification a été envoyé à votre adresse email.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-4">
                                <Button 
                                    type="submit"
                                    disabled={processing}
                                    className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
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
                                        ✓ Profil mis à jour avec succès
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
