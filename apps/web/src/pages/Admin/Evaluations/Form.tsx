import React from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Calendar, ClipboardList, UserRound } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { reglesApi, evaluationsApi } from '@/Services/api';
import { useAuthContext } from '@/Contexts/AuthContext';
import { useEligibles, usePeriodesActives } from '@/Hooks/queries/useEvaluationsQuery';
import { AdminEvaluationsLayout } from './shared';
import { filterApplicableRules } from '@/utils/rules';

type EligibleOption = {
  matricule: string;
  label: string;
  bucket: string;
  role: string;
};

function normalizeEligibles(data: any): EligibleOption[] {
  if (!data) return [];

  const push = (items: any[], bucket: string) => items.map((item) => ({
    matricule: item.matricule,
    label: [item.prenom, item.nom].filter(Boolean).join(' ').trim() || item.matricule,
    bucket,
    role: item.role_nom || item.role,
  }));

  const rows = [
    ...(data.auto ? [{
      matricule: data.auto.matricule,
      label: [data.auto.prenom, data.auto.nom].filter(Boolean).join(' ').trim() || data.auto.matricule,
      bucket: 'Auto-évaluation',
      role: data.auto.role_nom || data.auto.role,
    }] : []),
    ...push(Array.isArray(data.subordonnes) ? data.subordonnes : [], 'Subordonnés'),
    ...push(Array.isArray(data.pairs) ? data.pairs : [], 'Pairs'),
  ];

  return rows.filter((row, index, source) => source.findIndex((candidate) => candidate.matricule === row.matricule) === index);
}

export default function EvaluationFormPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [selectedPeriode, setSelectedPeriode] = React.useState('');
  const [selectedTarget, setSelectedTarget] = React.useState('');
  const [selectedRegle, setSelectedRegle] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const { data: eligiblesData } = useEligibles();
  const { data: periodesData } = usePeriodesActives();
  const { data: reglesData } = useSuspenseQuery({
    queryKey: ['regles', 'actives'],
    queryFn: () => reglesApi.list().then((r) => r.data),
  });

  const eligibles = React.useMemo(() => normalizeEligibles(eligiblesData), [eligiblesData]);
  const periodes = Array.isArray(periodesData) ? periodesData : [];
  const regles = Array.isArray(reglesData) ? reglesData : [];

  React.useEffect(() => {
    if (!selectedPeriode && periodes.length > 0) {
      setSelectedPeriode(periodes[0].id_periode);
    }
  }, [periodes, selectedPeriode]);

  React.useEffect(() => {
    if (!selectedRegle && regles.length > 0) {
      setSelectedRegle(regles[0].id_regle);
    }
  }, [regles, selectedRegle]);

  const selectedEligible = eligibles.find((item) => item.matricule === selectedTarget);
  const evaluationType = selectedEligible?.bucket === 'Auto-évaluation'
    ? 'auto'
    : selectedEligible?.bucket === 'Pairs'
      ? 'pairs'
      : selectedEligible?.bucket === 'Subordonnés'
        ? 'descendante'
        : null;
  const applicableRules = React.useMemo(
    () => filterApplicableRules(regles, user?.role_nom || user?.role, selectedEligible?.role, evaluationType),
    [regles, user?.role_nom, user?.role, selectedEligible?.role, evaluationType],
  );
  const selectedRule = applicableRules.find((item) => item.id_regle === selectedRegle);
  const selectedPeriodeData = periodes.find((item: any) => item.id_periode === selectedPeriode);

  React.useEffect(() => {
    if (applicableRules.length > 0) {
      setSelectedRegle((current) => current && applicableRules.some((rule) => rule.id_regle === current)
        ? current
        : applicableRules[0].id_regle);
      return;
    }
    setSelectedRegle('');
  }, [applicableRules]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.matricule) throw new Error('Utilisateur non authentifié');
      return evaluationsApi.create({
        evaluateur_matricule: user.matricule,
        evalue_matricule: selectedTarget,
        id_periode: selectedPeriode,
        id_regle: selectedRegle,
      });
    },
    onSuccess: (response) => {
      const id = response.data?.id_evaluation || response.data?.id;
      if (id) {
        navigate(`/common/evaluations/${id}/edit`);
        return;
      }
      navigate('/common/evaluations');
    },
    onError: (mutationError: any) => {
      setError(mutationError?.response?.data?.message || mutationError?.message || 'Impossible de créer l’évaluation.');
    },
  });

  const disabled = !selectedPeriode || !selectedTarget || !selectedRegle || createMutation.isPending;

  return (
    <AdminEvaluationsLayout title="Créer une évaluation">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer une évaluation</h1>
          <p className="text-sm text-sabc-gray-600">Initialise une nouvelle évaluation sur une période active avec une règle existante.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/evaluations/management')}>
          Retour à la gestion
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de création</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-sabc-gray-700">Période active</label>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  {periodes.map((periode: any) => (
                    <SelectItem key={periode.id_periode} value={periode.id_periode}>
                      {periode.nom_periode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sabc-gray-700">Collaborateur à évaluer</label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un collaborateur" />
                </SelectTrigger>
                <SelectContent>
                  {eligibles.map((target) => (
                    <SelectItem key={target.matricule} value={target.matricule}>
                      {target.label} · {target.bucket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-sabc-gray-700">Règle d’évaluation</label>
              <Select value={selectedRegle} onValueChange={setSelectedRegle}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une règle" />
                </SelectTrigger>
                <SelectContent>
                  {applicableRules.map((regle: any) => (
                    <SelectItem key={regle.id_regle} value={regle.id_regle}>
                      {regle.nom_regle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={disabled}
              onClick={() => {
                setError(null);
                createMutation.mutate();
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {createMutation.isPending ? 'Création en cours...' : 'Créer et ouvrir le brouillon'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-sabc-gray-700">
              <div className="rounded-lg border border-sabc-gray-200 p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-sabc-gray-900">
                  <Calendar className="h-4 w-4" />
                  Période
                </div>
                <div>{selectedPeriodeData?.nom_periode || 'Aucune période sélectionnée'}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-sabc-gray-900">
                  <UserRound className="h-4 w-4" />
                  Cible
                </div>
                <div>{selectedEligible?.label || 'Aucun collaborateur sélectionné'}</div>
                <div className="text-xs text-sabc-gray-500">{selectedEligible?.bucket || ''}</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 p-4">
                <div className="mb-1 flex items-center gap-2 font-medium text-sabc-gray-900">
                  <ClipboardList className="h-4 w-4" />
                  Règle
                </div>
                <div>{selectedRule?.nom_regle || 'Aucune règle sélectionnée'}</div>
                <div className="text-xs text-sabc-gray-500">{selectedRule?.description || ''}</div>
                {selectedRule ? (
                  <div className="mt-2 text-xs text-sabc-gray-500">
                    {selectedRule.criteres?.length || 0} critères · {selectedRule.sections?.length || 0} section(s)
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pré-conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-sabc-gray-600">
              <p>La période doit être ouverte et active côté backend.</p>
              <p>La cible doit apparaître dans les éligibles de l’utilisateur connecté.</p>
              <p>La règle sélectionnée sera attachée au brouillon créé.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminEvaluationsLayout>
  );
}
