import React, { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Card } from '@/Components/UI/Card/Card';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: ReactNode;
}

/**
 * Layout pour les pages de paramètres
 * Respecte les règles graphiques SABC
 */
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { url } = usePage();

  // Définition des liens de navigation des paramètres
  const navItems = [
    {
      title: 'Profil',
      href: '/settings/profile',
      active: url.startsWith('/settings/profile'),
    },
    {
      title: 'Mot de passe',
      href: '/settings/password',
      active: url.startsWith('/settings/password'),
    },
    {
      title: 'Apparence',
      href: '/settings/appearance',
      active: url.startsWith('/settings/appearance'),
    },
    {
      title: 'Notifications',
      href: '/settings/notifications',
      active: url.startsWith('/settings/notifications'),
    },
  ];

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
      {/* Sidebar de navigation */}
      <aside className="lg:w-1/5">
        <Card>
          <nav className="flex flex-col space-y-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-[#E53E3E] text-white'
                    : 'hover:bg-[#FED7D7] text-[#424242]'
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </Card>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 lg:max-w-3xl">
        {children}
      </div>
    </div>
  );
}
