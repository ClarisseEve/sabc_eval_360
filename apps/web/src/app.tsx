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
import { ToastProvider } from './Contexts/ToastContext';
import { ConfirmProvider } from './Contexts/ConfirmContext';
import { Toaster } from './Components/UI/Toast';
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
const Login = lazy(() => import('./pages/Auth/Login'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const Register = lazy(() => import('./pages/Auth/Register'));

// Admin: Dashboard
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard/index'));

// Admin: Utilisateurs
const AdminUtilisateurs = lazy(() => import('./pages/Admin/Utilisateurs/Index'));
const AdminUtilisateursCreate = lazy(() => import('./pages/Admin/Utilisateurs/Create'));
const AdminUtilisateursShow = lazy(() => import('./pages/Admin/Utilisateurs/Show'));
const AdminUtilisateursEdit = lazy(() => import('./pages/Admin/Utilisateurs/Edit'));
const AdminUtilisateursGaps = lazy(() => import('./pages/Admin/Utilisateurs/Gaps'));

// Admin: Évaluations
const AdminEvaluationsPeriodes = lazy(() => import('./pages/Admin/Evaluations/Periodes'));
const AdminEvaluationsManagement = lazy(() => import('./pages/Admin/Evaluations/Management'));
const AdminEvaluationsHistory = lazy(() => import('./pages/Admin/Evaluations/History'));
const AdminEvaluationsShow = lazy(() => import('./pages/Admin/Evaluations/Show'));
const AdminEvaluationsForm = lazy(() => import('./pages/Admin/Evaluations/Form'));
const AdminRatingSheets = lazy(() => import('./pages/Admin/Evaluations/RatingSheets'));

// Admin: Évaluations — Règles
const AdminReglesIndex = lazy(() => import('./pages/Admin/Evaluations/Regles/Index'));
const AdminReglesCreate = lazy(() => import('./pages/Admin/Evaluations/Regles/Create'));
const AdminReglesEdit = lazy(() => import('./pages/Admin/Evaluations/Regles/Edit'));

// Admin: Évaluations — Templates
const AdminTemplatesIndex = lazy(() => import('./pages/Admin/Evaluations/Templates/Index'));
const AdminTemplatesCreate = lazy(() => import('./pages/Admin/Evaluations/Templates/Create'));
const AdminTemplatesEdit = lazy(() => import('./pages/Admin/Evaluations/Templates/Edit'));
const AdminTemplatesShow = lazy(() => import('./pages/Admin/Evaluations/Templates/Show'));

// Admin: Remplacements
const AdminRemplacements = lazy(() => import('./pages/Admin/Remplacements/index'));
const AdminRemplacementsCreate = lazy(() => import('./pages/Admin/Remplacements/Create'));
const AdminRemplacementsShow = lazy(() => import('./pages/Admin/Remplacements/Show'));
const AdminRemplacementsEdit = lazy(() => import('./pages/Admin/Remplacements/Edit'));

// Admin: Rôles
const AdminRoles = lazy(() => import('./pages/Admin/Roles/index'));
const AdminRolesCreate = lazy(() => import('./pages/Admin/Roles/create'));
const AdminRolesShow = lazy(() => import('./pages/Admin/Roles/show'));

// Admin: Structure
const AdminStructure = lazy(() => import('./pages/Admin/Structure/index'));
const AdminStructureRegions = lazy(() => import('./pages/Admin/Structure/regions'));
const AdminStructureServices = lazy(() => import('./pages/Admin/Structure/services'));
const AdminStructureDistricts = lazy(() => import('./pages/Admin/Structure/districts'));
const AdminStructureSecteurs = lazy(() => import('./pages/Admin/Structure/secteurs'));

// Admin: Analytics
const AdminAnalytics = lazy(() => import('./pages/Admin/Analytics/Index'));

// Admin: Reports
const AdminReports        = lazy(() => import('./pages/Admin/Reports/Index'));
const AdminReportsBuilder = lazy(() => import('./pages/Admin/Reports/Builder'));

// Role Dashboards — each role has its own component
const DRDashboard = lazy(() => import('./pages/DR/Dashboard/index'));
const CDTTDashboard = lazy(() => import('./pages/CDTT/Dashboard/index'));
const CSCDashboard = lazy(() => import('./pages/CSC/Dashboard/index'));
const CDVDashboard = lazy(() => import('./pages/CDV/Dashboard/index'));
const CDSDashboard = lazy(() => import('./pages/CDS/Dashboard/index'));
const TMODashboard = lazy(() => import('./pages/TMO/Dashboard/index'));
const SSDashboard = lazy(() => import('./pages/SS/Dashboard/index'));
const RTMDashboard = lazy(() => import('./pages/RTM/Dashboard/index'));
const SRMODashboard = lazy(() => import('./pages/SRMO/Dashboard/index'));
const ASDashboard = lazy(() => import('./pages/AS/Dashboard/index'));

// Common: Évaluations
const CommonEvaluationsIndex = lazy(() => import('./pages/Common/Evaluations/index'));
const CommonEvaluationsMine = lazy(() => import('./pages/Common/Evaluations/Mine'));
const CommonEvaluationsPending = lazy(() => import('./pages/Common/Evaluations/Pending'));
const CommonEvaluationsToValidate = lazy(() => import('./pages/Common/Evaluations/ToValidate'));
const CommonEvaluationsRecues = lazy(() => import('./pages/Common/Evaluations/Recues'));
const CommonEvaluationsDonnees = lazy(() => import('./pages/Common/Evaluations/Donnees'));
const CommonEvaluationsHistorique = lazy(() => import('./pages/Common/Evaluations/Historique'));
const CommonRatingSheets = lazy(() => import('./pages/Common/Evaluations/RatingSheets'));
const CommonEvaluationsShow = lazy(() => import('./pages/Common/Evaluations/Show'));
const CommonEvaluationsEdit = lazy(() => import('./pages/Common/Evaluations/Edit'));

// Epic 6: Dashboards Manager & Collaborateur
const ManagerDashboard = lazy(() => import('./pages/Manager/Dashboard'));
const CollaborateurDashboard = lazy(() => import('./pages/Collaborateur/Dashboard'));

// Common: Other
const CommonProfile = lazy(() => import('./pages/Common/Profile'));
const CommonSettings = lazy(() => import('./pages/Common/Settings'));

// Common: Team
const TeamOverview = lazy(() => import('./pages/Common/Team/Overview'));
const TeamEvaluations = lazy(() => import('./pages/Common/Team/Evaluations'));
const AxesAmeliorationPage = lazy(() => import('./pages/Common/AxesAmelioration/index'));

// Settings
const SettingsIndex = lazy(() => import('./pages/Settings'));
const SettingsProfile = lazy(() => import('./pages/Settings/profile'));
const SettingsPassword = lazy(() => import('./pages/Settings/password'));
const SettingsAppearance = lazy(() => import('./pages/Settings/appearance'));

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

// ─── AuthGuard shorthand ────────────────────────────────────────────────────
function G({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

// ─── Admin-only guard shorthand (authenticated AND role ADMIN) ──────────────
function A({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRoles={['ADMIN']}>{children}</AuthGuard>;
}

function R({ role, children }: { role: string; children: React.ReactNode }) {
  return <AuthGuard requiredRoles={[role]}>{children}</AuthGuard>;
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <DisplayScaleProvider>
          <ToastProvider>
            <ConfirmProvider>
            <AuthProvider>
            <BrowserRouter>
              <RouterInit>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* ── Public ── */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/register" element={<Register />} />

                      {/* ── Root redirect ── */}
                      <Route path="/" element={<G><DashboardRedirect /></G>} />
                      <Route path="/dashboard" element={<G><DashboardRedirect /></G>} />

                      {/* ── Admin: Dashboard ── */}
                      <Route path="/admin/dashboard" element={<A><AdminDashboard /></A>} />

                      {/* ── Admin: Utilisateurs (static routes BEFORE :matricule) ── */}
                      <Route path="/admin/utilisateurs" element={<A><AdminUtilisateurs /></A>} />
                      <Route path="/admin/utilisateurs/create" element={<A><AdminUtilisateursCreate /></A>} />
                      <Route path="/admin/utilisateurs/gaps" element={<A><AdminUtilisateursGaps /></A>} />
                      <Route path="/admin/utilisateurs/:matricule" element={<A><AdminUtilisateursShow /></A>} />
                      <Route path="/admin/utilisateurs/:matricule/edit" element={<A><AdminUtilisateursEdit /></A>} />

                      {/* ── Admin: Évaluations ── */}
                      <Route path="/admin/evaluations/periodes" element={<A><AdminEvaluationsPeriodes /></A>} />
                      <Route path="/admin/evaluations/fiches" element={<A><AdminRatingSheets /></A>} />
                      <Route path="/admin/evaluations/management" element={<A><AdminEvaluationsManagement /></A>} />
                      <Route path="/admin/evaluations/history" element={<A><AdminEvaluationsHistory /></A>} />
                      <Route path="/admin/evaluations/:id" element={<A><AdminEvaluationsShow /></A>} />
                      <Route path="/admin/evaluations/form" element={<A><AdminEvaluationsForm /></A>} />

                      {/* ── Admin: Règles d'évaluation ── */}
                      <Route path="/admin/evaluations/regles" element={<A><AdminReglesIndex /></A>} />
                      <Route path="/admin/evaluations/regles/create" element={<A><AdminReglesCreate /></A>} />
                      <Route path="/admin/evaluations/regles/:id/edit" element={<A><AdminReglesEdit /></A>} />

                      {/* ── Admin: Templates ── */}
                      <Route path="/admin/evaluations/templates" element={<A><AdminTemplatesIndex /></A>} />
                      <Route path="/admin/evaluations/templates/create" element={<A><AdminTemplatesCreate /></A>} />
                      <Route path="/admin/evaluations/templates/assignations" element={<Navigate to="/admin/evaluations/templates" replace />} />
                      <Route path="/admin/evaluations/templates/:id/edit" element={<A><AdminTemplatesEdit /></A>} />
                      <Route path="/admin/evaluations/templates/:id" element={<A><AdminTemplatesShow /></A>} />

                      {/* ── Admin: Remplacements ── */}
                      <Route path="/admin/remplacements" element={<A><AdminRemplacements /></A>} />
                      <Route path="/admin/remplacements/create" element={<A><AdminRemplacementsCreate /></A>} />
                      <Route path="/admin/remplacements/:id" element={<A><AdminRemplacementsShow /></A>} />
                      <Route path="/admin/remplacements/:id/edit" element={<A><AdminRemplacementsEdit /></A>} />

                      {/* ── Admin: Rôles ── */}
                      <Route path="/admin/roles" element={<A><AdminRoles /></A>} />
                      <Route path="/admin/roles/create" element={<A><AdminRolesCreate /></A>} />
                      <Route path="/admin/roles/permissions" element={<Navigate to="/admin/evaluations/regles" replace />} />
                      <Route path="/admin/roles/:id" element={<A><AdminRolesShow /></A>} />

                      {/* ── Admin: Structure Organisationnelle ── */}
                      <Route path="/admin/structure" element={<A><AdminStructure /></A>} />
                      <Route path="/admin/structure/regions" element={<A><AdminStructureRegions /></A>} />
                      <Route path="/admin/structure/services" element={<A><AdminStructureServices /></A>} />
                      <Route path="/admin/structure/districts" element={<A><AdminStructureDistricts /></A>} />
                      <Route path="/admin/structure/secteurs" element={<A><AdminStructureSecteurs /></A>} />

                      {/* ── Admin: Analytics (ADMIN uniquement) ── */}
                      <Route path="/admin/analytics" element={<A><AdminAnalytics /></A>} />
                      <Route path="/analytics/dashboard" element={<Navigate to="/admin/analytics?tab=overview" replace />} />
                      <Route path="/analytics/regions" element={<Navigate to="/admin/analytics?tab=regions" replace />} />
                      <Route path="/analytics/anomalies" element={<Navigate to="/admin/analytics?tab=anomalies" replace />} />

                      {/* ── Admin: Reports ── */}
                      <Route path="/admin/reports"          element={<A><AdminReports /></A>} />
                      <Route path="/admin/reports/:id/edit" element={<A><AdminReportsBuilder /></A>} />

                      {/* ── Role Dashboards — each role → its own component ── */}
                      <Route path="/dr/dashboard" element={<R role="DR"><DRDashboard /></R>} />
                      <Route path="/cdtt/dashboard" element={<R role="CDTT"><CDTTDashboard /></R>} />
                      <Route path="/csc/dashboard" element={<R role="CSC"><CSCDashboard /></R>} />
                      <Route path="/cdv/dashboard" element={<R role="CDV"><CDVDashboard /></R>} />
                      <Route path="/cds/dashboard" element={<R role="CDS"><CDSDashboard /></R>} />
                      <Route path="/tmo/dashboard" element={<R role="TMO"><TMODashboard /></R>} />
                      <Route path="/ss/dashboard" element={<R role="SS"><SSDashboard /></R>} />
                      <Route path="/rtm/dashboard" element={<R role="RTM"><RTMDashboard /></R>} />
                      <Route path="/srmo/dashboard" element={<R role="SRMO"><SRMODashboard /></R>} />
                      <Route path="/as/dashboard" element={<R role="AS"><ASDashboard /></R>} />

                      {/* Les anciennes sous-pages contenaient des données de démonstration.
                          Elles redirigent vers le dashboard réel tant qu'elles ne sont pas câblées à l'API. */}
                      <Route path="/dr/teams" element={<R role="DR"><Navigate to="/dr/dashboard" replace /></R>} />
                      <Route path="/dr/performance" element={<R role="DR"><Navigate to="/dr/dashboard" replace /></R>} />
                      <Route path="/cdtt/commercial" element={<R role="CDTT"><Navigate to="/cdtt/dashboard" replace /></R>} />
                      <Route path="/cdtt/marketing" element={<R role="CDTT"><Navigate to="/cdtt/dashboard" replace /></R>} />
                      <Route path="/cds/objectives" element={<R role="CDS"><Navigate to="/cds/dashboard" replace /></R>} />
                      <Route path="/cds/performance" element={<R role="CDS"><Navigate to="/cds/dashboard" replace /></R>} />
                      <Route path="/cdv/performance" element={<R role="CDV"><Navigate to="/cdv/dashboard" replace /></R>} />
                      <Route path="/cdv/sectors" element={<R role="CDV"><Navigate to="/cdv/dashboard" replace /></R>} />
                      <Route path="/csc/districts" element={<R role="CSC"><Navigate to="/csc/dashboard" replace /></R>} />
                      <Route path="/csc/performance" element={<R role="CSC"><Navigate to="/csc/dashboard" replace /></R>} />
                      <Route path="/tmo/activities" element={<R role="TMO"><Navigate to="/tmo/dashboard" replace /></R>} />
                      <Route path="/tmo/performance" element={<R role="TMO"><Navigate to="/tmo/dashboard" replace /></R>} />
                      <Route path="/ss/assistants" element={<R role="SS"><Navigate to="/ss/dashboard" replace /></R>} />
                      <Route path="/ss/events" element={<R role="SS"><Navigate to="/ss/dashboard" replace /></R>} />
                      <Route path="/rtm/campaigns" element={<R role="RTM"><Navigate to="/rtm/dashboard" replace /></R>} />
                      <Route path="/rtm/operators" element={<R role="RTM"><Navigate to="/rtm/dashboard" replace /></R>} />
                      <Route path="/srmo/campaigns" element={<R role="SRMO"><Navigate to="/srmo/dashboard" replace /></R>} />
                      <Route path="/srmo/operators" element={<R role="SRMO"><Navigate to="/srmo/dashboard" replace /></R>} />
                      <Route path="/as/events" element={<R role="AS"><Navigate to="/as/dashboard" replace /></R>} />
                      <Route path="/as/reports" element={<R role="AS"><Navigate to="/as/dashboard" replace /></R>} />

                      {/* ── Common: Évaluations ── */}
                      <Route path="/evaluations" element={<G><CommonEvaluationsIndex /></G>} />
                      <Route path="/evaluations/mine" element={<G><CommonEvaluationsMine /></G>} />
                      <Route path="/evaluations/pending" element={<G><CommonEvaluationsPending /></G>} />
                      <Route path="/evaluations/validate" element={<G><CommonEvaluationsToValidate /></G>} />
                      <Route path="/evaluations/recues" element={<G><CommonEvaluationsRecues /></G>} />
                      <Route path="/evaluations/donnees" element={<G><CommonEvaluationsDonnees /></G>} />
                      <Route path="/evaluations/historique" element={<G><CommonEvaluationsHistorique /></G>} />
                      <Route path="/evaluations/fiches" element={<G><CommonRatingSheets /></G>} />
                      {/* Alias historique: rendait le hub au lieu de l'historique. */}
                      <Route path="/evaluations/history" element={<Navigate to="/evaluations/historique" replace />} />
                      <Route path="/evaluations/:id" element={<G><CommonEvaluationsShow /></G>} />
                      <Route path="/evaluations/:id/edit" element={<G><CommonEvaluationsEdit /></G>} />
                      {/* Legacy paths (redirects from old nav) */}
                      <Route path="/common/evaluations/pending" element={<G><CommonEvaluationsPending /></G>} />
                      <Route path="/common/evaluations/mine" element={<G><CommonEvaluationsMine /></G>} />
                      <Route path="/common/evaluations/validate" element={<G><CommonEvaluationsToValidate /></G>} />
                      <Route path="/common/evaluations/:id" element={<G><CommonEvaluationsShow /></G>} />
                      <Route path="/common/evaluations/:id/edit" element={<G><CommonEvaluationsEdit /></G>} />

                      {/* ── Epic 6: Dashboards Manager & Collaborateur ── */}
                      <Route path="/manager/dashboard" element={<G><ManagerDashboard /></G>} />
                      <Route path="/collaborateur/dashboard" element={<G><CollaborateurDashboard /></G>} />

                      {/* ── Common: Team ── */}
                      <Route path="/equipe/subordonnes" element={<G><TeamOverview /></G>} />
                      <Route path="/equipe/evaluations" element={<G><TeamEvaluations /></G>} />
                      <Route path="/axes-amelioration" element={<G><AxesAmeliorationPage /></G>} />
                      {/* Legacy paths */}
                      <Route path="/common/team/overview" element={<G><TeamOverview /></G>} />
                      <Route path="/common/team/evaluations" element={<G><TeamEvaluations /></G>} />

                      {/* ── Common: Profile & Settings ── */}
                      <Route path="/common/profile" element={<G><CommonProfile /></G>} />
                      <Route path="/common/settings" element={<G><CommonSettings /></G>} />

                      {/* ── Settings ── */}
                      <Route path="/settings" element={<G><SettingsIndex /></G>} />
                      <Route path="/settings/profile" element={<G><SettingsProfile /></G>} />
                      <Route path="/settings/password" element={<G><SettingsPassword /></G>} />
                      <Route path="/settings/appearance" element={<G><SettingsAppearance /></G>} />

                      {/* ── Errors ── */}
                      <Route path="/403" element={<Forbidden />} />
                      <Route path="/500" element={<ServerError />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster />
                  </Suspense>
                </ErrorBoundary>
              </RouterInit>
            </BrowserRouter>
            </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
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
