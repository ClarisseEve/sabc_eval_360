import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Head, Link } from '@/lib/inertia-shim';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/UI/Card/Card';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="bg-sabc-gray-50 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <Head title="Connexion - SABC Évaluation 360°" />
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-40 h-20 mb-4">
          <img 
            src="/images/logos/sabc-logo.png" 
            alt="SABC Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader className="text-center border-b border-sabc-gray-200 bg-white rounded-t-xl">
          <CardTitle className="text-2xl font-semibold text-[#424242]">Connexion</CardTitle>
          <CardDescription className="text-[#9E9E9E]">Connectez-vous pour accéder à votre tableau de bord</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sabc-gray-800 font-medium">Matricule ou Email</Label>
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
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-sabc-gray-200 p-6 bg-white rounded-b-xl">
          <p className="text-center text-sm text-sabc-gray-700">
            Besoin d’un accès ? Contactez votre administrateur.
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-6 text-center text-sm text-[#9E9E9E]">
        &copy; {new Date().getFullYear()} SABC - Tous droits réservés
      </div>
    </div>
  );
};

export default Login;
