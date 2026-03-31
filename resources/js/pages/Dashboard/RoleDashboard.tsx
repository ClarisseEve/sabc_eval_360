import React, { Suspense } from 'react';
import { Head } from '@/lib/inertia-shim';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { DashboardSkeleton } from '@/Components/UI/Skeleton/DashboardSkeleton';
import { useDashboard } from '@/Hooks/useDashboard';
import { useAuthContext } from '@/Contexts/AuthContext';
import { RBAC, normalizeRole } from '@/config/rbac';
import {
  ClipboardList, Clock, CheckCircle, TrendingUp, TrendingDown,
  AlertTriangle, Users, ArrowRight, RefreshCw,
} from 'lucide-react';

const RoleDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const role = normalizeRole(user?.role_nom ?? user?.role);

  const userName = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email : '';
  const layoutUser = {
    name: userName,
    email: user?.email ?? '',
    role: user?.role_nom ?? user?.role ?? role,
  };

  return (
    <AppLayout user={layoutUser} pageTitle="Tableau de bord">
      <Head title="Tableau de bord - SABC Évaluation 360°" />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </AppLayout>
  );
};

function DashboardContent() {
  const { user } = useAuthContext();
  const { role, dashboard, scores, evaluations, loading, error, refresh } = useDashboard();
  const navigate = useNavigate();
  const caps = RBAC[role] ?? RBAC.CSC;

  const stats = dashboard?.stats;
  const title = dashboard?.title ?? 'Tableau de bord';

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-sabc-warning" />
        <p className="text-sabc-gray-600">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
        </Button>
      </div>
    );
  }

  const enAttente = evaluations?.en_attente ?? [];
  const aValider = evaluations?.a_valider ?? [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">{title}</h1>
          <p className="text-sm text-sabc-gray-500 mt-1">
            Bonjour {user?.prenom ?? ''}, voici votre situation
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
        </Button>
      </div>

        {/* Période active banner */}
        {stats?.periode_active && (
          <div className="rounded-lg border border-sabc-red-light bg-sabc-red-light/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-sabc-red-primary" />
              <div>
                <p className="font-medium text-sabc-gray-900">Période en cours : {stats.periode_active.nom}</p>
                <p className="text-sm text-sabc-gray-500">Clôture le {new Date(stats.periode_active.fin).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            {enAttente.length > 0 && (
              <Button size="sm" onClick={() => navigate('/evaluations/pending')}>
                {enAttente.length} à compléter <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* KPIs row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="À compléter"
            value={stats?.evaluations_en_attente ?? 0}
            icon={<ClipboardList className="h-5 w-5 text-sabc-red-primary" />}
            accent={stats?.evaluations_en_attente ? 'warning' : 'default'}
            onClick={() => navigate('/evaluations/pending')}
          />
          <KpiCard
            label="Total évaluations"
            value={stats?.evaluations_total ?? 0}
            icon={<CheckCircle className="h-5 w-5 text-sabc-success" />}
          />
          {scores?.score_pondere != null && (
            <KpiCard
              label="Mon score"
              value={`${scores.score_pondere.toFixed(1)}/5`}
              icon={scores.progression >= 0
                ? <TrendingUp className="h-5 w-5 text-sabc-success" />
                : <TrendingDown className="h-5 w-5 text-sabc-error" />
              }
              sub={scores.progression !== 0 ? `${scores.progression > 0 ? '+' : ''}${scores.progression.toFixed(1)} vs période précédente` : undefined}
            />
          )}
          {caps.canEvaluateSubs && (
            <KpiCard
              label="À valider"
              value={aValider.length}
              icon={<Users className="h-5 w-5 text-sabc-info" />}
              accent={aValider.length > 0 ? 'warning' : 'default'}
              onClick={() => navigate('/evaluations/validate')}
            />
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évaluations à compléter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Évaluations à compléter</CardTitle>
                {enAttente.length > 0 && (
                  <Badge className="bg-sabc-red-primary text-white">{enAttente.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {enAttente.length === 0 ? (
                <div className="text-center py-8 text-sabc-gray-400">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-sabc-success" />
                  <p>Toutes vos évaluations sont à jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enAttente.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id_evaluation}
                      className="flex items-center justify-between p-3 rounded-lg border border-sabc-gray-200 hover:border-sabc-red-primary cursor-pointer transition-colors"
                      onClick={() => navigate(`/evaluations/${ev.id_evaluation}`)}
                    >
                      <div>
                        <p className="font-medium text-sabc-gray-900 text-sm">{ev.evalue_matricule}</p>
                        <p className="text-xs text-sabc-gray-500">{ev.type_evaluation} • {new Date(ev.date_evaluation).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <Badge variant="outline" className={ev.statut === 'brouillon' ? 'text-sabc-warning border-sabc-warning' : 'text-sabc-info border-sabc-info'}>
                        {ev.statut}
                      </Badge>
                    </div>
                  ))}
                  {enAttente.length > 5 && (
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/evaluations/pending')}>
                      Voir les {enAttente.length} évaluations <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* À valider (managers only) OR Mon score (operationals) */}
          {caps.canEvaluateSubs && aValider.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Évaluations à valider</CardTitle>
                  <Badge className="bg-sabc-accent text-white">{aValider.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aValider.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id_evaluation}
                      className="flex items-center justify-between p-3 rounded-lg border border-sabc-gray-200 hover:border-sabc-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/evaluations/${ev.id_evaluation}/validate`)}
                    >
                      <div>
                        <p className="font-medium text-sabc-gray-900 text-sm">{ev.evalue_matricule}</p>
                        <p className="text-xs text-sabc-gray-500">par {ev.evaluateur_matricule} • {ev.type_evaluation}</p>
                      </div>
                      <Button size="sm">Valider</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : scores ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Mon score de performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scores.par_type.map((t) => (
                  <div key={t.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-sabc-gray-600 capitalize">
                        {t.type === 'auto' ? 'Auto-évaluation' : t.type === 'pairs' ? 'Pairs' : t.type === 'descendante' ? 'Manager' : t.type}
                      </span>
                      <span className="text-sm font-bold text-sabc-gray-900">{t.moyenne.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(t.moyenne / 5) * 100} className="h-2" />
                    <p className="text-xs text-sabc-gray-400 mt-0.5">{t.nb_evaluations} évaluation(s)</p>
                  </div>
                ))}
                {scores.score_pondere != null && (
                  <div className="pt-3 border-t border-sabc-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sabc-gray-900">Score pondéré SABC</span>
                      <span className="text-xl font-bold text-sabc-red-primary">{scores.score_pondere.toFixed(1)}/5</span>
                    </div>
                    <p className="text-xs text-sabc-gray-400 mt-1">Auto 20% • Pairs 40% • Manager 40%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-lg">Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-8 text-sabc-gray-400">
                  <p>Aucune évaluation validée pour le moment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}

function KpiCard({ label, value, icon, sub, accent, onClick }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: 'warning' | 'default';
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${accent === 'warning' ? 'border-sabc-warning bg-sabc-warning/5' : 'border-sabc-gray-200 bg-white'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-sabc-gray-600">{label}</span></div>
      <p className="text-2xl font-bold text-sabc-gray-900">{value}</p>
      {sub && <p className="text-xs text-sabc-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default RoleDashboard;
