import * as React from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Tooltip } from '@/Components/UI/Tooltip/Tooltip';
import { Badge } from '@/Components/UI/Badge/Badge';
import { useTheme } from '@/Hooks/useTheme';
import { useAuthContext } from '@/Contexts/AuthContext';
import { Link } from '@/lib/inertia-shim';
import { notificationsApi } from '@/Services/api';

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
    link?: string;
  }[];
  className?: string;
  pageTitle?: string;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  onLogout?: () => void | Promise<void>;
}

type NotificationStatus = NonNullable<HeaderProps['notifications']>[number]['status'];
type DisplayNotification = NonNullable<HeaderProps['notifications']>[number];

const Header: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  className,
  onMenuClick,
  isMenuOpen = false,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [apiNotifications, setApiNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const wasMenuOpen = React.useRef(isMenuOpen);

  React.useEffect(() => {
    if (wasMenuOpen.current && !isMenuOpen) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpen.current = isMenuOpen;
  }, [isMenuOpen]);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  React.useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const loadNotifications = React.useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list({ limit: 10 }),
        notificationsApi.count(),
      ]);
      setApiNotifications(Array.isArray(listRes.data) ? listRes.data : []);
      setUnreadCount(countRes.data?.count ?? 0);
    } catch {
      // Les notifications transmises au layout restent disponibles comme repli.
      setApiNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    await loadNotifications();
  };

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    await loadNotifications();
  };

  const mappedNotifications: DisplayNotification[] = apiNotifications.length > 0
    ? apiNotifications.map((notification) => ({
        id: notification.id_notification,
        title: notification.titre,
        message: notification.message,
        status: (
          notification.type === 'warning'
            ? 'warning'
            : notification.type === 'success' || notification.type === 'validation'
              ? 'success'
              : 'info'
        ) as NotificationStatus,
        read: Boolean(notification.est_lu),
        createdAt: notification.date_creation
          ? new Date(notification.date_creation).toLocaleString()
          : '',
        link: typeof notification.lien === 'string' ? notification.lien : undefined,
      }))
    : notifications;

  const unreadNotifications = mappedNotifications.filter((notification) => !notification.read);
  const displayedUnreadCount = apiNotifications.length > 0
    ? unreadCount
    : unreadNotifications.length;

  const openNotifications = () => {
    setShowUserMenu(false);
    setShowNotifications((open) => !open);
  };

  const openUserMenu = () => {
    setShowNotifications(false);
    setShowUserMenu((open) => !open);
  };

  const selectNotification = (notification: DisplayNotification) => {
    if (!notification.read) {
      void markRead(notification.id).catch(() => undefined);
    }
    setShowNotifications(false);
    if (notification.link?.startsWith('/')) {
      navigate(notification.link);
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    if (onLogout) {
      await onLogout();
    } else {
      await logout();
    }
    navigate('/login', { replace: true });
  };

  return (
    <header
      className={cn(
        'flex h-16 min-w-0 items-center justify-between border-b border-sabc-gray-200 bg-white px-2 dark:border-sabc-gray-800 dark:bg-sabc-gray-900 sm:px-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center">
        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={isMenuOpen}
          aria-controls="app-sidebar"
          className="shrink-0 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Tooltip tooltipContent={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="nav-icon-hover"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </Tooltip>

        <div className="relative" ref={notificationsRef}>
          <Tooltip tooltipContent="Notifications">
            <Button
              variant="ghost"
              size="icon"
              onClick={openNotifications}
              aria-label={`Notifications${displayedUnreadCount > 0 ? `, ${displayedUnreadCount} non lue${displayedUnreadCount > 1 ? 's' : ''}` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="dialog"
              aria-controls="header-notifications"
              className="relative nav-icon-hover"
            >
              <Bell className="h-5 w-5" />
              {displayedUnreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sabc-red-primary px-1 text-[10px] font-bold text-white">
                  {displayedUnreadCount > 9 ? '9+' : displayedUnreadCount}
                </span>
              )}
            </Button>
          </Tooltip>

          {showNotifications && (
            <div
              id="header-notifications"
              role="dialog"
              aria-label="Notifications"
              className="fixed left-2 right-2 top-20 z-50 rounded-lg border border-sabc-gray-200 bg-white p-3 shadow-xl dark:border-sabc-gray-700 dark:bg-sabc-gray-900 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
            >
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-sabc-gray-200 pb-2 dark:border-sabc-gray-800">
                <h2 className="font-medium text-sabc-gray-900 dark:text-white">Notifications</h2>
                {displayedUnreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto whitespace-normal px-2 py-1 text-right text-xs nav-icon-hover"
                    onClick={() => void markAllRead()}
                  >
                    Tout marquer comme lu
                  </Button>
                )}
              </div>

              {notificationsLoading ? (
                <div className="py-4 text-center text-sabc-gray-500 dark:text-sabc-gray-400" role="status">
                  Chargement…
                </div>
              ) : mappedNotifications.length === 0 ? (
                <div className="py-4 text-center text-sabc-gray-500 dark:text-sabc-gray-400">
                  Aucune notification
                </div>
              ) : (
                <div className="max-h-[min(20rem,65vh)] space-y-2 overflow-y-auto">
                  {mappedNotifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => selectNotification(notification)}
                      className={cn(
                        'w-full rounded-lg border border-sabc-gray-200 p-2 text-left transition-colors hover:bg-sabc-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary/40 dark:border-sabc-gray-700 dark:hover:bg-sabc-gray-800/70',
                        !notification.read && 'bg-sabc-gray-50 dark:bg-sabc-gray-800/50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center">
                            <StatusBadge variant={notification.status} withDot className="mr-2 shrink-0" />
                            <span className="font-medium text-sabc-gray-900 dark:text-white">
                              {notification.title}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="primary" className="shrink-0">Nouveau</Badge>
                        )}
                      </div>
                      <span className="mt-1 block text-right text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {notification.createdAt}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={openUserMenu}
              aria-label={`Ouvrir le menu de ${user.name}`}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              aria-controls="header-user-menu"
              className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-sabc-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary/40 dark:hover:bg-sabc-gray-800/70 sm:px-2"
            >
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <span className="hidden flex-col items-start text-left md:flex">
                <span className="max-w-40 truncate text-sm font-medium text-sabc-gray-900 dark:text-white">
                  {user.name}
                </span>
                <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{user.role}</span>
              </span>
              <ChevronDown
                className={cn('hidden h-4 w-4 text-sabc-gray-500 transition-transform sm:block', showUserMenu && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {showUserMenu && (
              <div
                id="header-user-menu"
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-sabc-gray-200 bg-white p-2 shadow-xl dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
              >
                <div className="border-b border-sabc-gray-200 px-3 py-2 dark:border-sabc-gray-800 md:hidden">
                  <p className="truncate text-sm font-medium text-sabc-gray-900 dark:text-white">{user.name}</p>
                  <p className="truncate text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{user.role}</p>
                </div>
                <Link
                  href="/settings/profile"
                  role="menuitem"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sabc-gray-700 transition-colors hover:bg-sabc-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary/40 dark:text-sabc-gray-200 dark:hover:bg-sabc-gray-800"
                >
                  <User className="h-4 w-4" />
                  Mon profil
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sabc-gray-700 transition-colors hover:bg-sabc-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary/40 dark:text-sabc-gray-200 dark:hover:bg-sabc-gray-800"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>
                <Button
                  type="button"
                  role="menuitem"
                  variant="ghost"
                  onClick={() => void handleLogout()}
                  className="mt-1 w-full justify-start gap-2 text-sabc-error hover:text-sabc-red-primary"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
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
