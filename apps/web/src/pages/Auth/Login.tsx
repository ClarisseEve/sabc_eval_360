import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head, Link } from '@/lib/inertia-shim';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Eye, EyeOff } from 'lucide-react';

/** Cercle cranté de la capsule du logo: 21 crans, comme une capsule couronne. */
function CrownCap({ className = '' }: { className?: string }) {
  const teeth = 21;
  const points = Array.from({ length: teeth * 2 }, (_, i) => {
    const angle = (Math.PI * i) / teeth;
    const radius = i % 2 === 0 ? 100 : 92;
    return `${(100 + radius * Math.cos(angle)).toFixed(2)},${(100 + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={className}>
      <polygon points={points} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

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
    <div className="flex min-h-svh bg-white dark:bg-sabc-gray-900">
      <Head title="Connexion - SABC Évaluation 360°" />

      {/* Panneau de marque: logo, capsule animée, nom du produit */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-sabc-gray-200 bg-sabc-gray-50 p-12 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 lg:flex">
        {/* Le PNG a un fond blanc: multiply le fond dans le panneau gris. */}
        <img src="/images/logos/sabc-logo.png" alt="SABC, Boissons du Cameroun" className="sabc-fade h-20 w-auto self-start object-contain mix-blend-multiply dark:rounded-md dark:bg-white dark:p-2 dark:mix-blend-normal" />

        <div className="relative z-10 max-w-md sabc-rise" style={{ '--sabc-i': 2 } as React.CSSProperties}>
          <p className="flex items-center gap-2 text-sm font-medium text-sabc-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-sabc-accent" aria-hidden />
            Direction commerciale et marketing
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-sabc-gray-900 dark:text-white">
            Évaluation <span className="text-sabc-red-primary">360°</span>
          </h1>
          <p className="mt-4 text-base text-sabc-gray-600 dark:text-sabc-gray-300">
            Évaluations croisées, validation hiérarchique et suivi des compétences des équipes terrain, région par région.
          </p>
        </div>

        <p className="relative z-10 text-sm text-sabc-gray-500">&copy; {new Date().getFullYear()} SABC. Tous droits réservés.</p>

        <CrownCap className="sabc-cap-spin pointer-events-none absolute -bottom-40 -right-40 h-[34rem] w-[34rem] text-sabc-gray-300 dark:text-sabc-gray-600" />
      </aside>

      {/* Formulaire */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm sabc-rise">
          <img src="/images/logos/sabc-logo.png" alt="SABC, Boissons du Cameroun" className="mb-10 h-16 w-auto object-contain lg:hidden dark:rounded-md dark:bg-white dark:p-2" />

          <h2 className="text-2xl font-semibold text-sabc-gray-900 dark:text-white">Connexion</h2>
          <p className="mt-1 mb-8 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            Identifiez-vous avec votre matricule ou votre adresse e-mail.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sabc-gray-800 font-medium">Matricule ou e-mail</Label>
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
                  <p id="identifier-error" role="alert" className="text-sm text-sabc-error font-medium">{errors.identifier}</p>
                )}
              </div>
          
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sabc-gray-800 font-medium">Mot de passe</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-sabc-red-primary hover:underline font-medium"
                  >
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
                    className="absolute inset-y-0 right-3 flex items-center text-sabc-gray-500 hover:text-sabc-gray-700"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-sm text-sabc-error font-medium">{errors.password}</p>
                )}
              </div>
            </div>
        
            <Button
              type="submit"
              className="mt-8 w-full h-12 text-base font-semibold"
              disabled={processing}
              loading={processing}
              size="lg"
            >
              {processing ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-8 border-t border-sabc-gray-200 pt-6 text-sm text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-400">
            Besoin d’un accès ? Contactez votre administrateur.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
