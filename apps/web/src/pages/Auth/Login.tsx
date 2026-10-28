import { BrandLockup, BrandMark } from '@/Components/Brand/BrandMark';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Head, Link } from '@/lib/inertia-shim';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const { login, isAuthenticated } = useAuthContext();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            await login(identifier, password);
            navigate('/dashboard', { replace: true });
        } catch (error: any) {
            const serverErrors = error.response?.data?.errors || {};
            if (error.response?.status === 401) {
                setErrors({ identifier: 'Identifiants incorrects.' });
            } else if (typeof serverErrors === 'object' && Object.keys(serverErrors).length) {
                setErrors(serverErrors);
            } else {
                setErrors({ identifier: error.response?.data?.message || 'Erreur de connexion.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="dark:bg-sabc-gray-900 flex min-h-svh bg-white">
            <Head title="Connexion - SABC Évaluation 360°" />

            {/* Panneau de marque: emblème à capsule tournante, nom du produit */}
            <aside className="border-sabc-gray-200 bg-sabc-gray-50 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 relative hidden w-[46%] flex-col justify-between overflow-hidden border-r p-12 lg:flex">
                <p className="sabc-display text-sabc-gray-500 text-sm font-normal">SABC · Boissons du Cameroun</p>

                <div className="max-w-md">
                    <BrandMark spin className="sabc-fade h-44 w-44" title="SABC, Boissons du Cameroun" />
                    <div className="sabc-rise mt-10" style={{ '--sabc-i': 2 } as React.CSSProperties}>
                        <p className="text-sabc-gray-500 flex items-center gap-2 text-sm font-medium">
                            <span className="bg-sabc-accent inline-block h-2 w-2 rounded-full" aria-hidden />
                            Direction commerciale et marketing
                        </p>
                        {/* Même composition que le logo: mot rouge, ligne grise plus petite dessous. */}
                        <h1 className="mt-4 leading-none">
                            <span className="text-sabc-red-primary block text-6xl">Évaluation</span>
                            <span className="text-sabc-gray-500 dark:text-sabc-gray-300 mt-2 block text-3xl font-normal">360° des équipes</span>
                        </h1>
                        <p className="text-sabc-gray-600 dark:text-sabc-gray-300 mt-6 text-base">
                            Évaluations croisées, validation hiérarchique et suivi des compétences des équipes terrain, région par région.
                        </p>
                    </div>
                </div>

                <p className="text-sabc-gray-500 text-sm">&copy; {new Date().getFullYear()} SABC. Tous droits réservés.</p>
            </aside>

            {/* Formulaire */}
            <main className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="sabc-rise w-full max-w-sm">
                    <BrandLockup className="mb-12 lg:hidden" />

                    <h2 className="text-sabc-gray-900 text-2xl font-semibold dark:text-white">Connexion</h2>
                    <p className="text-sabc-gray-500 dark:text-sabc-gray-400 mt-1 mb-8 text-sm">
                        Identifiez-vous avec votre matricule ou votre adresse e-mail.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="identifier" className="text-sabc-gray-800 font-medium">
                                    Matricule ou e-mail
                                </Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    autoFocus
                                    autoComplete="username"
                                    aria-invalid={Boolean(errors.identifier)}
                                    aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                                    className={`h-11 rounded-lg ${errors.identifier ? 'border-sabc-error' : 'border-sabc-gray-200'}`}
                                    placeholder="Votre matricule ou votre e-mail"
                                />
                                {errors.identifier && (
                                    <p id="identifier-error" role="alert" className="text-sabc-error text-sm font-medium">
                                        {errors.identifier}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sabc-gray-800 font-medium">
                                        Mot de passe
                                    </Label>
                                    <Link href="/forgot-password" className="text-sabc-red-primary text-sm font-medium hover:underline">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={errors.password ? 'password-error' : undefined}
                                        className={`h-11 rounded-lg pr-12 ${errors.password ? 'border-sabc-error' : 'border-sabc-gray-200'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="text-sabc-gray-500 hover:text-sabc-gray-700 absolute inset-y-0 right-3 flex items-center"
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p id="password-error" role="alert" className="text-sabc-error text-sm font-medium">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-8 h-12 w-full text-base font-semibold"
                            disabled={processing}
                            loading={processing}
                            size="lg"
                        >
                            {processing ? 'Connexion en cours...' : 'Se connecter'}
                        </Button>
                    </form>

                    <p className="border-sabc-gray-200 text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-400 mt-8 border-t pt-6 text-sm">
                        Besoin d’un accès ? Contactez votre administrateur.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
