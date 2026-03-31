import './css/app.css';
import './css/scrollbar.css';

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeTheme, ThemeProvider } from './Hooks/useTheme';
import { DisplayScaleProvider } from './Hooks/useDisplayScale';
import { AuthProvider, useAuthContext } from './Contexts/AuthContext';
import { AuthGuard } from './Components/Auth/AuthGuard';
import { QueryProvider } from './Contexts/QueryProvider';
import { ErrorBoundary } from './Components/ErrorBoundary';
import { useInitRouter } from './lib/inertia-shim';

// ─── Loading fallback ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-sabc-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sabc-gray-200 border-t-sabc-red-primary" />
      <span className="text-sm text-sabc-gray-400">Chargement…</span>
    </div>
  </div>
);

// ─── Lazy page imports ───────────────────────────────────────────────────────
// Auth
const Login = lazy(() => import('./pages/Auth/login'));

// Admin
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard/index'));
const AdminUtilisateurs = lazy(() => import('./pages/Admin/Utilisateurs/Index'));
const AdminUtilisateursCreate = lazy(() => import('./pages/Admin/Utilisateurs/Create'));
const AdminUtilisateursShow = lazy(() => import('./pages/Admin/Utilisateurs/Show'));
const AdminUtilisateursEdit = lazy(() => import('./pages/Admin/Utilisateurs/Edit'));
const AdminUtilisateursGaps = lazy(() => import('./pages/Admin/Utilisateurs/Gaps'));
const AdminEvaluationsPeriodes = lazy(() => import('./pages/Admin/Evaluations/Periodes'));
const AdminEvaluationsManagement = lazy(() => import('./pages/Admin/Evaluations/Management'));
const AdminEvaluationsHistory = lazy(() => import('./pages/Admin/Evaluations/History'));
const AdminEvaluationsForm = lazy(() => import('./pages/Admin/Evaluations/Form'));
const AdminRemplacements = lazy(() => import('./pages/Admin/Remplacements/index'));
const AdminRemplacementsCreate = lazy(() => import('./pages/Admin/Remplacements/Create'));

// Role dashboards
const DRDashboard = lazy(() => import('./pages/DR/Dashboard/index'));

// Common
const CommonEvaluationsPending = lazy(() => import('./pages/Common/Evaluations/Pending'));

// Settings
const SettingsProfile = lazy(() => import('./pages/Settings/profile'));
const SettingsPassword = lazy(() => import('./pages/Settings/password'));

// Errors
const NotFound = lazy(() => import('./pages/Errors/404'));
const Forbidden = lazy(() => import('./pages/Errors/403'));
const ServerError = lazy(() => import('./pages/Errors/500'));

// ─── Dashboard redirect by role ─────────────────────────────────────────────
function DashboardRedirect() {
  const { user } = useAuthContext();
  if (!user) return <Navigate to="/login" replace />;

  const role = (user.role_nom || user.role || '').toUpperCase();
  if (user.est_admin || role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;

  const rolePaths: Record<string, string> = {
    DR: '/dr/dashboard', CDTT: '/cdtt/dashboard', CSC: '/csc/dashboard',
    CDV: '/cdv/dashboard', TMO: '/tmo/dashboard', RTM: '/rtm/dashboard',
    SRMO: '/srmo/dashboard', CDS: '/cds/dashboard', SS: '/ss/dashboard', AS: '/as/dashboard',
  };
  return <Navigate to={rolePaths[role] || '/admin/dashboard'} replace />;
}

// ─── Router initializer (bridges inertia-shim navigate) ─────────────────────
function RouterInit({ children }: { children: React.ReactNode }) {
  useInitRouter();
  return <>{children}</>;
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <DisplayScaleProvider>
          <AuthProvider>
            <BrowserRouter>
              <RouterInit>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                  {/* Public */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected routes */}
<Route path="/" element={<AuthGuard><DashboardRedirect /></AuthGuard>} />
                  <Route path="/dashboard" element={<AuthGuard><DashboardRedirect /></AuthGuard>} />

                  {/* Admin */}
                  <Route path="/admin/dashboard" element={<AuthGuard><AdminDashboard /></AuthGuard>} />
                  <Route path="/admin/utilisateurs" element={<AuthGuard><AdminUtilisateurs /></AuthGuard>} />
                  <Route path="/admin/utilisateurs/create" element={<AuthGuard><AdminUtilisateursCreate /></AuthGuard>} />
                  <Route path="/admin/utilisateurs/gaps" element={<AuthGuard><AdminUtilisateursGaps /></AuthGuard>} />
                  <Route path="/admin/utilisateurs/:matricule" element={<AuthGuard><AdminUtilisateursShow /></AuthGuard>} />
                  <Route path="/admin/utilisateurs/:matricule/edit" element={<AuthGuard><AdminUtilisateursEdit /></AuthGuard>} />
                  <Route path="/admin/evaluations/periodes" element={<AuthGuard><AdminEvaluationsPeriodes /></AuthGuard>} />
                  <Route path="/admin/evaluations/management" element={<AuthGuard><AdminEvaluationsManagement /></AuthGuard>} />
                  <Route path="/admin/evaluations/history" element={<AuthGuard><AdminEvaluationsHistory /></AuthGuard>} />
                  <Route path="/admin/evaluations/form" element={<AuthGuard><AdminEvaluationsForm /></AuthGuard>} />
                  <Route path="/admin/remplacements" element={<AuthGuard><AdminRemplacements /></AuthGuard>} />
                  <Route path="/admin/remplacements/create" element={<AuthGuard><AdminRemplacementsCreate /></AuthGuard>} />

                  {/* Role dashboards — all lazy-load the same generic component, role handled server-side */}
                  <Route path="/dr/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/cdtt/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/csc/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/cdv/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/tmo/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/rtm/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/srmo/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/cds/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/ss/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />
                  <Route path="/as/dashboard" element={<AuthGuard><DRDashboard /></AuthGuard>} />

                  {/* Common */}
                  <Route path="/common/evaluations/pending" element={<AuthGuard><CommonEvaluationsPending /></AuthGuard>} />

                  {/* Settings */}
                  <Route path="/settings/profile" element={<AuthGuard><SettingsProfile /></AuthGuard>} />
                  <Route path="/settings/password" element={<AuthGuard><SettingsPassword /></AuthGuard>} />

                  {/* Errors */}
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </RouterInit>
            </BrowserRouter>
          </AuthProvider>
        </DisplayScaleProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

// ─── Mount ───────────────────────────────────────────────────────────────────
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

initializeTheme();
