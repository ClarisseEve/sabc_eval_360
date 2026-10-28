import * as React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import AuthCardLayout from '@/Components/Layout/auth/auth-card-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Alert, AlertDescription } from '@/Components/UI/Alert/Alert';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page de réinitialisation de mot de passe simplifiée pour SABC Eval360
 * Redirige les utilisateurs vers le service informatique interne
 */
export default function ForgotPassword() {
    return (
        <AuthCardLayout>
            <Head title="Mot de passe oublié - SABC Évaluation 360°" />
            
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-sabc-red-primary"></div>
                    <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
                    <CardDescription>
                        Pour réinitialiser votre mot de passe, veuillez contacter le service informatique interne
                    </CardDescription>
                </CardHeader>
                
                <CardContent>
                    <Alert className="mb-6 bg-sabc-info/10 border-sabc-info">
                        <AlertDescription className="text-sabc-gray-800">
                            Pour des raisons de sécurité, la réinitialisation des mots de passe pour SABC Évaluation 360° 
                            est gérée par le service informatique interne. Veuillez contacter l'équipe IT au poste 1234 ou 
                            par email à <span className="font-medium">support@sabc.cm</span>.
                        </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col space-y-4">
                        <div className="rounded-md border border-sabc-gray-200 p-4">
                            <h3 className="font-medium text-sabc-gray-800 mb-2">Service Informatique SABC</h3>
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
                    </div>
                </CardContent>
                
                <CardFooter className="flex justify-center border-t border-sabc-gray-200 p-4">
                    <Link href="/login" className="text-sabc-red-primary hover:underline w-full">
                        <Button className="w-full bg-white border border-sabc-gray-200 text-sabc-red-primary hover:bg-sabc-gray-50">
                            Retour à la page de connexion
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </AuthCardLayout>
    );
}
