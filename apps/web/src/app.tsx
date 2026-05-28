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
const Login = lazy(() => import('./pages/Auth/Login'));

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

// Admin: Évaluations — Règles
const AdminReglesIndex = lazy(() => import('./pages/Admin/Evaluations/Regles/Index'));
const AdminReglesCreate = lazy(() => import('./pages/Admin/Evaluations/Regles/Create'));
const AdminReglesEdit = lazy(() => import('./pages/Admin/Evaluations/Regles/Edit'));

// Admin: Remplacements
const AdminRemplacements = lazy(() => import('./pages/Admin/Remplacements/index'));
const AdminRemplacementsCreate = lazy(() => import('./pages/Admin/Remplacements/Create'));
const AdminRemplacementsShow = lazy(() => import('./pages/Admin/Remplacements/Show'));
const AdminRemplacementsEdit = lazy(() => import('./pages/Admin/Remplacements/Edit'));

// Admin: Rôles
const AdminRoles = lazy(() => import('./pages/Admin/Roles/index'));
const AdminRolesCreate = lazy(() => import('./pages/Admin/Roles/create'));
const AdminRolesShow = lazy(() => import('./pages/Admin/Roles/show'));
const AdminRolesPermissions = lazy(() => import('./pages/Admin/Roles/permissions'));

// Admin: Structure
const AdminStructure = lazy(() => import('./pages/Admin/Structure/index'));
const AdminStructureRegions = lazy(() => import('./pages/Admin/Structure/regions'));
const AdminStructureServices = lazy(() => import('./pages/Admin/Structure/services'));
const AdminStructureDistricts = lazy(() => import('./pages/Admin/Structure/districts'));
const AdminStructureSecteurs = lazy(() => import('./pages/Admin/Structure/secteurs'));

// Admin: Analytics
const AdminAnalytics = lazy(() => import('./pages/Admin/Analytics/Index'));

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

// Role sub-pages (transition pages)
const DRTeams = lazy(() => import('./pages/DR/Teams'));
const DRPerformance = lazy(() => import('./pages/DR/Performance'));
const CDTTCommercial = lazy(() => import('./pages/CDTT/Commercial'));
const CDTTMarketing = lazy(() => import('./pages/CDTT/Marketing'));
const CDSObjectives = lazy(() => import('./pages/CDS/Objectives'));
const CDSPerformance = lazy(() => import('./pages/CDS/Performance'));
const CDVPerformance = lazy(() => import('./pages/CDV/Performance'));
const CDVSectors = lazy(() => import('./pages/CDV/Sectors'));
const CSCDistricts = lazy(() => import('./pages/CSC/Districts/index'));
const CSCPerformance = lazy(() => import('./pages/CSC/Performance/index'));
const TMOActivities = lazy(() => import('./pages/TMO/Activities'));
const TMOPerformance = lazy(() => import('./pages/TMO/Performance'));
const SSAssistants = lazy(() => import('./pages/SS/Assistants'));
const SSEvents = lazy(() => import('./pages/SS/Events'));
const RTMCampaigns = lazy(() => import('./pages/RTM/Campaigns'));
const RTMOperators = lazy(() => import('./pages/RTM/Operators'));
const SRMOCampaigns = lazy(() => import('./pages/SRMO/Campaigns'));
const SRMOOperators = lazy(() => import('./pages/SRMO/Operators'));
const ASEvents = lazy(() => import('./pages/AS/Events'));
const ASReports = lazy(() => import('./pages/AS/Reports'));

// Common: Évaluations
const CommonEvaluationsIndex = lazy(() => import('./pages/Common/Evaluations/index'));
const CommonEvaluationsMine = lazy(() => import('./pages/Common/Evaluations/Mine'));
const CommonEvaluationsPending = lazy(() => import('./pages/Common/Evaluations/Pending'));
const CommonEvaluationsToValidate = lazy(() => import('./pages/Common/Evaluations/ToValidate'));
const CommonEvaluationsRecues = lazy(() => import('./pages/Common/Evaluations/Recues'));
const CommonEvaluationsDonnees = lazy(() => import('./pages/Common/Evaluations/Donnees'));
const CommonEvaluationsShow = lazy(() => import('./pages/Common/Evaluations/Show'));
const CommonEvaluationsEdit = lazy(() => import('./pages/Common/Evaluations/Edit'));

// Common: Other
const CommonProfile = lazy(() => import('./pages/Common/Profile'));
const CommonSettings = lazy(() => import('./pages/Common/Settings'));

// Common: Team
const TeamOverview = lazy(() => import('./pages/Common/Team/Overview'));
const TeamEvaluations = lazy(() => import('./pages/Common/Team/Evaluations'));
const AxesAmeliorationPage = lazy(() => import('./pages/Common/AxesAmelioration/index'));

// Settings
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

function buildLegacyLayoutUser(user: ReturnType<typeof useAuthContext>['user']) {
  if (!user) {
    return {
      name: 'Utilisateur',
      email: '',
      role: '',
      avatar: undefined,
    };
  }

  const fullName = user.name || [user.prenom, user.nom].filter(Boolean).join(' ').trim();

  return {
    name: fullName || user.email,
    email: user.email,
    role: user.role_nom || user.role,
    avatar: user.avatar,
  };
}

function LegacyAuthRoute({ component: Component }: { component: React.ElementType }) {
  const { user } = useAuthContext();
  return <Component auth={{ user: buildLegacyLayoutUser(user) }} />;
}

function RulesRedirect() {
  return <Navigate to="/admin/evaluations/regles" replace />;
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
                      {/* ── Public ── */}
                      <Route path="/login" element={<Login />} />

                      {/* ── Root redirect ── */}
                      <Route path="/" element={<G><DashboardRedirect /></G>} />
                      <Route path="/dashboard" element={<G><DashboardRedirect /></G>} />

                      {/* ── Admin: Dashboard ── */}
                      <Route path="/admin/dashboard" element={<G><AdminDashboard /></G>} />

                      {/* ── Admin: Utilisateurs (static routes BEFORE :matricule) ── */}
                      <Route path="/admin/utilisateurs" element={<G><AdminUtilisateurs /></G>} />
                      <Route path="/admin/utilisateurs/create" element={<G><AdminUtilisateursCreate /></G>} />
                      <Route path="/admin/utilisateurs/gaps" element={<G><AdminUtilisateursGaps /></G>} />
                      <Route path="/admin/utilisateurs/:matricule" element={<G><AdminUtilisateursShow /></G>} />
                      <Route path="/admin/utilisateurs/:matricule/edit" element={<G><AdminUtilisateursEdit /></G>} />

                      {/* ── Admin: Évaluations ── */}
                      <Route path="/admin/evaluations/periodes" element={<G><AdminEvaluationsPeriodes /></G>} />
                      <Route path="/admin/evaluations/management" element={<G><AdminEvaluationsManagement /></G>} />
                      <Route path="/admin/evaluations/history" element={<G><AdminEvaluationsHistory /></G>} />
                      <Route path="/admin/evaluations/:id" element={<G><AdminEvaluationsShow /></G>} />
                      <Route path="/admin/evaluations/form" element={<G><AdminEvaluationsForm /></G>} />

                      {/* ── Admin: Règles d'évaluation ── */}
                      <Route path="/admin/evaluations/regles" element={<G><AdminReglesIndex /></G>} />
                      <Route path="/admin/evaluations/regles/create" element={<G><AdminReglesCreate /></G>} />
                      <Route path="/admin/evaluations/regles/:id/edit" element={<G><AdminReglesEdit /></G>} />

                      {/* ── Admin: Templates ── */}
                      <Route path="/admin/evaluations/templates" element={<G><RulesRedirect /></G>} />
                      <Route path="/admin/evaluations/templates/:id/edit" element={<G><RulesRedirect /></G>} />

                      {/* ── Admin: Remplacements ── */}
                      <Route path="/admin/remplacements" element={<G><AdminRemplacements /></G>} />
                      <Route path="/admin/remplacements/create" element={<G><AdminRemplacementsCreate /></G>} />
                      <Route path="/admin/remplacements/:id" element={<G><AdminRemplacementsShow /></G>} />
                      <Route path="/admin/remplacements/:id/edit" element={<G><AdminRemplacementsEdit /></G>} />

                      {/* ── Admin: Rôles ── */}
                      <Route path="/admin/roles" element={<G><AdminRoles /></G>} />
                      <Route path="/admin/roles/create" element={<G><AdminRolesCreate /></G>} />
                      <Route path="/admin/roles/permissions" element={<G><AdminRolesPermissions /></G>} />
                      <Route path="/admin/roles/:id" element={<G><AdminRolesShow /></G>} />

                      {/* ── Admin: Structure Organisationnelle ── */}
                      <Route path="/admin/structure" element={<G><AdminStructure /></G>} />
                      <Route path="/admin/structure/regions" element={<G><AdminStructureRegions /></G>} />
                      <Route path="/admin/structure/services" element={<G><AdminStructureServices /></G>} />
                      <Route path="/admin/structure/districts" element={<G><AdminStructureDistricts /></G>} />
                      <Route path="/admin/structure/secteurs" element={<G><AdminStructureSecteurs /></G>} />

                      {/* ── Admin: Analytics ── */}
                      <Route path="/admin/analytics" element={<G><AdminAnalytics /></G>} />
                      <Route path="/analytics/dashboard" element={<G><AdminAnalytics /></G>} />
                      <Route path="/analytics/regions" element={<G><AdminAnalytics /></G>} />
                      <Route path="/analytics/anomalies" element={<G><AdminAnalytics /></G>} />

                      {/* ── Role Dashboards — each role → its own component ── */}
                      <Route path="/dr/dashboard" element={<G><DRDashboard /></G>} />
                      <Route path="/cdtt/dashboard" element={<G><CDTTDashboard /></G>} />
                      <Route path="/csc/dashboard" element={<G><CSCDashboard /></G>} />
                      <Route path="/cdv/dashboard" element={<G><CDVDashboard /></G>} />
                      <Route path="/cds/dashboard" element={<G><CDSDashboard /></G>} />
                      <Route path="/tmo/dashboard" element={<G><TMODashboard /></G>} />
                      <Route path="/ss/dashboard" element={<G><SSDashboard /></G>} />
                      <Route path="/rtm/dashboard" element={<G><RTMDashboard /></G>} />
                      <Route path="/srmo/dashboard" element={<G><SRMODashboard /></G>} />
                      <Route path="/as/dashboard" element={<G><ASDashboard /></G>} />

                      {/* ── Role sub-pages (transition pages, not all in sidebar) ── */}
                      <Route path="/dr/teams" element={<G><LegacyAuthRoute component={DRTeams} /></G>} />
                      <Route path="/dr/performance" element={<G><LegacyAuthRoute component={DRPerformance} /></G>} />
                      <Route path="/cdtt/commercial" element={<G><LegacyAuthRoute component={CDTTCommercial} /></G>} />
                      <Route path="/cdtt/marketing" element={<G><LegacyAuthRoute component={CDTTMarketing} /></G>} />
                      <Route path="/cds/objectives" element={<G><LegacyAuthRoute component={CDSObjectives} /></G>} />
                      <Route path="/cds/performance" element={<G><LegacyAuthRoute component={CDSPerformance} /></G>} />
                      <Route path="/cdv/performance" element={<G><LegacyAuthRoute component={CDVPerformance} /></G>} />
                      <Route path="/cdv/sectors" element={<G><LegacyAuthRoute component={CDVSectors} /></G>} />
                      <Route path="/csc/districts" element={<G><LegacyAuthRoute component={CSCDistricts} /></G>} />
                      <Route path="/csc/performance" element={<G><CSCPerformance /></G>} />
                      <Route path="/tmo/activities" element={<G><LegacyAuthRoute component={TMOActivities} /></G>} />
                      <Route path="/tmo/performance" element={<G><LegacyAuthRoute component={TMOPerformance} /></G>} />
                      <Route path="/ss/assistants" element={<G><LegacyAuthRoute component={SSAssistants} /></G>} />
                      <Route path="/ss/events" element={<G><LegacyAuthRoute component={SSEvents} /></G>} />
                      <Route path="/rtm/campaigns" element={<G><LegacyAuthRoute component={RTMCampaigns} /></G>} />
                      <Route path="/rtm/operators" element={<G><LegacyAuthRoute component={RTMOperators} /></G>} />
                      <Route path="/srmo/campaigns" element={<G><LegacyAuthRoute component={SRMOCampaigns} /></G>} />
                      <Route path="/srmo/operators" element={<G><LegacyAuthRoute component={SRMOOperators} /></G>} />
                      <Route path="/as/events" element={<G><ASEvents /></G>} />
                      <Route path="/as/reports" element={<G><ASReports /></G>} />

                      {/* ── Common: Évaluations ── */}
                      <Route path="/evaluations" element={<G><CommonEvaluationsIndex /></G>} />
                      <Route path="/evaluations/mine" element={<G><CommonEvaluationsMine /></G>} />
                      <Route path="/evaluations/pending" element={<G><CommonEvaluationsPending /></G>} />
                      <Route path="/evaluations/validate" element={<G><CommonEvaluationsToValidate /></G>} />
                      <Route path="/evaluations/recues" element={<G><CommonEvaluationsRecues /></G>} />
                      <Route path="/evaluations/donnees" element={<G><CommonEvaluationsDonnees /></G>} />
                      <Route path="/evaluations/history" element={<G><CommonEvaluationsIndex /></G>} />
                      <Route path="/evaluations/:id" element={<G><CommonEvaluationsShow /></G>} />
                      <Route path="/evaluations/:id/edit" element={<G><CommonEvaluationsEdit /></G>} />
                      {/* Legacy paths (redirects from old nav) */}
                      <Route path="/common/evaluations/pending" element={<G><CommonEvaluationsPending /></G>} />
                      <Route path="/common/evaluations/mine" element={<G><CommonEvaluationsMine /></G>} />
                      <Route path="/common/evaluations/validate" element={<G><CommonEvaluationsToValidate /></G>} />
                      <Route path="/common/evaluations/:id" element={<G><CommonEvaluationsShow /></G>} />
                      <Route path="/common/evaluations/:id/edit" element={<G><CommonEvaluationsEdit /></G>} />

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
                      <Route path="/settings/profile" element={<G><SettingsProfile /></G>} />
                      <Route path="/settings/password" element={<G><SettingsPassword /></G>} />
                      <Route path="/settings/appearance" element={<G><SettingsAppearance /></G>} />

                      {/* ── Errors ── */}
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
