import * as React from 'react';
import { Menu, X, Sun, Moon, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Tooltip } from '@/Components/UI/Tooltip/Tooltip';
import { Badge } from '@/Components/UI/Badge/Badge';
import { useTheme } from '@/hooks/useTheme';

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
  onToggleSidebar?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  onToggleSidebar,
  className,
}) => {
  const { theme, toggleTheme } = useTheme();
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
      'flex h-16 items-center justify-between border-b border-sabc-gray-200 bg-white px-4 dark:border-sabc-gray-800 dark:bg-sabc-gray-900',
      className
    )}>
      {/* Partie gauche */}
      <div className="flex items-center">
        {/* Bouton toggle sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo SABC */}
        <div className="flex items-center">
          <div className="mr-2 h-8 w-8 rounded-md bg-sabc-red-primary"></div>
          <span className="hidden text-lg font-bold text-sabc-gray-900 dark:text-white md:inline-block">
            SABC Eval360
          </span>
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
              className="relative"
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
                <Button variant="ghost" size="sm">
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
                        'mb-2 rounded-md border border-sabc-gray-200 p-2 dark:border-sabc-gray-800',
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
                <Button variant="link" size="sm">
                  Voir toutes les notifications
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Profil utilisateur */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar
                name={user.name}
                src={user.avatar}
                size="sm"
              />
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                  {user.name}
                </span>
                <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-sabc-gray-500 dark:text-sabc-gray-400" />
            </Button>
            
            {/* Menu utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-md border border-sabc-gray-200 bg-white p-2 shadow-lg dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
                <div className="mb-2 border-b border-sabc-gray-200 pb-2 dark:border-sabc-gray-800">
                  <div className="font-medium text-sabc-gray-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                    {user.email}
                  </div>
                </div>
                <ul className="space-y-1">
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      Mon profil
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      Mes évaluations
                    </Button>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      Paramètres
                    </Button>
                  </li>
                  <li className="border-t border-sabc-gray-200 pt-1 dark:border-sabc-gray-800">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sabc-error hover:bg-sabc-error/10"
                    >
                      Déconnexion
                    </Button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export { Header };
export default Header;
