import { Link } from 'react-router-dom';
import { Head } from '@/lib/inertia-shim';
import { Lock, Palette, User } from 'lucide-react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { useAuthContext } from '@/Contexts/AuthContext';
import { formatPersonName } from '@/utils/helpers';

const settingsItems = [
  {
    href: '/settings/profile',
    title: 'Mon profil',
    description: 'Modifier vos informations personnelles et votre photo de profil.',
    icon: User,
  },
  {
    href: '/settings/password',
    title: 'Sécurité du compte',
    description: 'Modifier votre mot de passe et protéger votre accès.',
    icon: Lock,
  },
  {
    href: '/settings/appearance',
    title: 'Apparence',
    description: 'Personnaliser l’affichage de l’application.',
    icon: Palette,
  },
];

export default function SettingsIndex() {
  const { user } = useAuthContext();
  const layoutUser = {
    name: formatPersonName(user),
    email: user?.email || '',
    role: user?.role_nom || user?.role || '',
    avatar: user?.avatar,
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Paramètres" notifications={[]}>
      <Head title="Paramètres" />
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Paramètres</h1>
          <p className="mt-1 text-sm text-sabc-gray-600">Gérez votre profil, la sécurité de votre compte et vos préférences d’affichage.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {settingsItems.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} to={href} className="group">
              <Card className="h-full transition-colors group-hover:border-sabc-red-primary/50 group-hover:bg-sabc-red-primary/5">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-sabc-red-primary" />{title}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-sabc-gray-600">{description}</p></CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
