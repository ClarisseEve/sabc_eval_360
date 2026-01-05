import * as React from 'react';
import { Menu, X, Sun, Moon, Bell, ChevronDown, AlignLeft, AlignRight } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Tooltip } from '@/Components/UI/Tooltip/Tooltip';
import { Badge } from '@/Components/UI/Badge/Badge';
import { useTheme } from '@/Hooks/useTheme';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  notifications?: {
    id: string;
    title: string;
    message: string;
    status: 'info' | 'warning' | 'error' | 'success';
    read: boolean;
    createdAt: string;
  }[];
  className?: string;
  pageTitle?: string; // Titre de la page actuelle
}

const Header: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  className,
  pageTitle = 'Dashboard', // Titre par défaut si non fourni
}) => {
  const { theme, toggleTheme } = useTheme();
  
  // Effet pour appliquer le thème au document
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  
  // Fermer les menus lorsqu'on clique en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const unreadNotifications = notifications.filter(notification => !notification.read);
  
  return (
    <header className={cn(
      'flex h-16 items-center justify-between border-b border-sabc-gray-200 bg-white px-4 dark:border-sabc-gray-800 dark:bg-sabc-gray-900 shadow-sm',
      className
    )}>
      {/* Partie gauche */}
      <div className="flex items-center">
        {/* Titre de la page */}
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-sabc-red-primary dark:text-sabc-red-light hover:text-sabc-red-dark dark:hover:text-sabc-red-primary transition-colors">
            {pageTitle}
          </h1>
        </div>
      </div>
      
      {/* Partie droite */}
      <div className="flex items-center space-x-2">
        {/* Bouton thème */}
        <Tooltip tooltipContent={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="nav-icon-hover"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </Tooltip>
        
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Tooltip tooltipContent="Notifications">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="relative nav-icon-hover"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sabc-red-primary text-[10px] font-bold text-white">
                  {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                </span>
              )}
            </Button>
          </Tooltip>
          
          {/* Menu notifications */}
          {showNotifications && (
            <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-md border border-sabc-gray-200 bg-white p-2 shadow-lg dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
              <div className="mb-2 flex items-center justify-between border-b border-sabc-gray-200 pb-2 dark:border-sabc-gray-800">
                <h3 className="font-medium text-sabc-gray-900 dark:text-white">Notifications</h3>
                <Button variant="ghost" size="sm" className="nav-icon-hover">
                  Tout marquer comme lu
                </Button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-sabc-gray-500 dark:text-sabc-gray-400">
                  Aucune notification
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'mb-2 rounded-md border border-sabc-gray-200 p-2 dark:border-sabc-gray-800 hover:bg-sabc-gray-50 dark:hover:bg-sabc-gray-800/70 transition-colors activity-item-hover',
                        !notification.read && 'bg-sabc-gray-50 dark:bg-sabc-gray-800/50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center">
                            <StatusBadge
                              variant={notification.status}
                              withDot
                              className="mr-2"
                            />
                            <h4 className="font-medium text-sabc-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                          </div>
                          <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="primary" className="ml-2">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-right text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {notification.createdAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2 border-t border-sabc-gray-200 pt-2 text-center dark:border-sabc-gray-800">
                <Button variant="link" size="sm" className="hover:text-sabc-red-dark dark:hover:text-sabc-red-primary transition-colors">
                  Voir toutes les notifications
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Profil utilisateur - version simplifiée sans menu déroulant */}
        {user && (
          <div className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-sabc-gray-100 dark:hover:bg-sabc-gray-800/70 transition-colors cursor-pointer">
            <Avatar
              name={user.name}
              src={user.avatar}
              size="sm"
            />
            <div className="flex-col items-start text-left">
              <span className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-xs block text-sabc-gray-500 dark:text-sabc-gray-400">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export { Header };
export default Header;
