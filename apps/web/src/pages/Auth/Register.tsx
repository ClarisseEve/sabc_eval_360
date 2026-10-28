import * as React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import AuthCardLayout from '@/Components/Layout/auth/auth-card-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Alert, AlertDescription } from '@/Components/UI/Alert/Alert';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page d'inscription désactivée pour SABC Eval360
 * Les comptes sont créés par l'administrateur selon les règles SABC.
 */
export default function Register() {
    return (
        <AuthCardLayout>
            <Head title="Inscription désactivée - SABC Évaluation 360°" />

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-sabc-red-primary"></div>
                    <CardTitle className="text-2xl font-bold">Inscription désactivée</CardTitle>
                    <CardDescription>
                        Les comptes SABC Eval360 sont créés et gérés par l'administrateur.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Alert className="mb-6 bg-sabc-info/10 border-sabc-info">
                        <AlertDescription className="text-sabc-gray-800">
                            Pour obtenir un accès, contactez votre manager ou l'équipe IT. Vos identifiants
                            vous seront fournis après validation.
                        </AlertDescription>
                    </Alert>

                    <div className="rounded-md border border-sabc-gray-200 p-4">
                        <h3 className="font-medium text-sabc-gray-800 mb-2">Support SABC</h3>
                        <ul className="text-sm text-sabc-gray-600 space-y-2">
                            <li className="flex items-center">
                                Téléphone : +237 233 42 75 00 (poste 1234)
                            </li>
                            <li className="flex items-center">
                                E-mail : support@sabc.cm
                            </li>
                            <li className="flex items-center">
                                Horaires : Lun-Ven, 8h-17h
                            </li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-sabc-gray-200 p-4">
                    <Link href="/login" className="text-sabc-red-primary hover:underline w-full">
                        <Button className="w-full bg-white border border-sabc-gray-200 text-sabc-red-primary hover:bg-sabc-gray-50">
                            Retour à la connexion
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </AuthCardLayout>
    );
}
