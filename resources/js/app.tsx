import '../css/app.css';
import '../css/scrollbar.css';

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeTheme, ThemeProvider } from './Hooks/useTheme';
import { DisplayScaleProvider } from './Hooks/useDisplayScale';
import { AuthProvider, useAuthContext } from './Contexts/AuthContext';
import { AuthGuard } from './Components/Auth/AuthGuard';
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

// Unified role dashboard (fetches real data, adapts to role)
const RoleDashboard = lazy(() => import('./pages/Dashboard/RoleDashboard'));

// Admin pages
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
const AdminRemplacementsShow = lazy(() => import('./pages/Admin/Remplacements/Show'));
const AdminRemplacementsEdit = lazy(() => import('./pages/Admin/Remplacements/Edit'));

// Common evaluation pages (transition pages — not all in sidebar)
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

  return <Navigate to={`/${role.toLowerCase()}/dashboard`} replace />;
}

// ─── Router initializer (bridges inertia-shim navigate) ─────────────────────
function RouterInit({ children }: { children: React.ReactNode }) {
  useInitRouter();
  return <>{children}</>;
}

// ─── Guarded shorthand ──────────────────────────────────────────────────────
function G({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <DisplayScaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <RouterInit>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ── Public ── */}
                  <Route path="/login" element={<Login />} />

                  {/* ── Root redirect ── */}
                  <Route path="/" element={<G><DashboardRedirect /></G>} />
                  <Route path="/dashboard" element={<G><DashboardRedirect /></G>} />

                  {/* ── Admin dashboard ── */}
                  <Route path="/admin/dashboard" element={<G><AdminDashboard /></G>} />

                  {/* ── Admin: Utilisateurs ── */}
                  <Route path="/admin/utilisateurs" element={<G><AdminUtilisateurs /></G>} />
                  <Route path="/admin/utilisateurs/create" element={<G><AdminUtilisateursCreate /></G>} />
                  <Route path="/admin/utilisateurs/gaps" element={<G><AdminUtilisateursGaps /></G>} />
                  <Route path="/admin/utilisateurs/:matricule" element={<G><AdminUtilisateursShow /></G>} />
                  <Route path="/admin/utilisateurs/:matricule/edit" element={<G><AdminUtilisateursEdit /></G>} />

                  {/* ── Admin: Évaluations ── */}
                  <Route path="/admin/evaluations/periodes" element={<G><AdminEvaluationsPeriodes /></G>} />
                  <Route path="/admin/evaluations/management" element={<G><AdminEvaluationsManagement /></G>} />
                  <Route path="/admin/evaluations/history" element={<G><AdminEvaluationsHistory /></G>} />
                  <Route path="/admin/evaluations/form" element={<G><AdminEvaluationsForm /></G>} />

                  {/* ── Admin: Remplacements ── */}
                  <Route path="/admin/remplacements" element={<G><AdminRemplacements /></G>} />
                  <Route path="/admin/remplacements/create" element={<G><AdminRemplacementsCreate /></G>} />
                  <Route path="/admin/remplacements/:id" element={<G><AdminRemplacementsShow /></G>} />
                  <Route path="/admin/remplacements/:id/edit" element={<G><AdminRemplacementsEdit /></G>} />

                  {/* ── Role dashboards — single component, adapts to user role ── */}
                  <Route path="/dr/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/cdtt/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/csc/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/cdv/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/tmo/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/rtm/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/srmo/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/cds/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/ss/dashboard" element={<G><RoleDashboard /></G>} />
                  <Route path="/as/dashboard" element={<G><RoleDashboard /></G>} />

                  {/* ── Évaluations (transition pages — not all in sidebar menu) ── */}
                  <Route path="/evaluations/mine" element={<G><CommonEvaluationsPending /></G>} />
                  <Route path="/evaluations/pending" element={<G><CommonEvaluationsPending /></G>} />
                  <Route path="/evaluations/validate" element={<G><CommonEvaluationsPending /></G>} />
                  <Route path="/evaluations/history" element={<G><CommonEvaluationsPending /></G>} />
                  <Route path="/evaluations/:id" element={<G><AdminEvaluationsForm /></G>} />
                  <Route path="/evaluations/:id/validate" element={<G><AdminEvaluationsForm /></G>} />

                  {/* ── Settings ── */}
                  <Route path="/settings/profile" element={<G><SettingsProfile /></G>} />
                  <Route path="/settings/password" element={<G><SettingsPassword /></G>} />

                  {/* ── Errors ── */}
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </RouterInit>
          </BrowserRouter>
        </AuthProvider>
      </DisplayScaleProvider>
    </ThemeProvider>
  );
}

// ─── Mount ───────────────────────────────────────────────────────────────────
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

initializeTheme();
