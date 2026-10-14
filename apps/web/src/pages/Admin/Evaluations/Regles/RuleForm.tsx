import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { evaluationsApi, templatesApi } from '@/Services/api';
import { templateHasValidWeights, templateToRuleCriteria } from '@/utils/rules';
import type { RuleBuilderInput, RuleCriterion } from '@/types/rules';

interface RoleOption {
  id_role: string;
  nom_role: string;
}

interface RuleFormProps {
  title: string;
  subtitle: string;
  data: RuleBuilderInput;
  onChange: (patch: Partial<RuleBuilderInput>) => void;
  onSubmit: (event: React.FormEvent, criteria: RuleCriterion[]) => void;
  onCancel: () => void;
  processing: boolean;
  errors?: Record<string, string>;
  roles: RoleOption[];
  types: string[];
  submitLabel: string;
}

export function RuleForm({
  title,
  subtitle,
  data,
  onChange,
  onSubmit,
  onCancel,
  processing,
  errors = {},
  roles,
  types,
  submitLabel,
}: RuleFormProps) {
  const { data: activePeriods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['periodes', 'actives'],
    queryFn: () => evaluationsApi.periodesActives().then((response) => response.data),
  });
  const activePeriod = Array.isArray(activePeriods) ? activePeriods[0] : null;
  const evaluatedRole = roles.find((role) => role.nom_role === data.role_evalue);
  const { data: assignments = [], isLoading: assignmentsLoading, isError: assignmentsError } = useQuery({
    queryKey: ['templates', 'matrice', activePeriod?.id_periode],
    queryFn: () => templatesApi.getMatrice(activePeriod.id_periode).then((response) => response.data),
    enabled: Boolean(activePeriod?.id_periode && evaluatedRole?.id_role),
  });
  const assignment = Array.isArray(assignments)
    ? assignments.find((item: any) => item.id_role === evaluatedRole?.id_role)
    : null;
  const templateId = assignment?.template_assigne?.id_template;
  const {
    data: template,
    isLoading: templateLoading,
    isError: templateError,
  } = useQuery({
    queryKey: ['templates', templateId],
    queryFn: () => templatesApi.get(String(templateId)).then((response) => response.data),
    enabled: Boolean(templateId),
  });
  const templateCriteria = templateToRuleCriteria(template);
  const canSubmit = template?.statut === 'published' && templateCriteria.length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit(event, templateCriteria);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-sabc-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nom_regle">Nom de la règle *</Label>
              <Input
                id="nom_regle"
                value={data.nom_regle}
                onChange={(event) => onChange({ nom_regle: event.target.value })}
              />
              {errors.nom_regle ? <p className="mt-1 text-sm text-sabc-error">{errors.nom_regle}</p> : null}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={data.description}
                onChange={(event) => onChange({ description: event.target.value })}
                className="min-h-[100px] w-full rounded-lg border border-sabc-gray-200 p-2"
              />
              {errors.description ? <p className="mt-1 text-sm text-sabc-error">{errors.description}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="est_active"
                  checked={data.est_active}
                  onChange={(event) => onChange({ est_active: event.target.checked })}
                  className="rounded border-sabc-gray-200"
                />
                <Label htmlFor="est_active" className="cursor-pointer">Règle active</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexte d’évaluation</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="role_evaluateur">Rôle évaluateur *</Label>
              <Select value={data.role_evaluateur} onValueChange={(value) => onChange({ role_evaluateur: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id_role} value={role.nom_role}>{role.nom_role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role_evalue">Rôle évalué *</Label>
              <Select value={data.role_evalue} onValueChange={(value) => onChange({ role_evalue: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id_role} value={role.nom_role}>{role.nom_role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type_evaluation">Type d’évaluation *</Label>
              <Select value={data.type_evaluation} onValueChange={(value) => onChange({ type_evaluation: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contraintes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="meme_region_obligatoire"
                checked={data.meme_region_obligatoire}
                onChange={(event) => onChange({ meme_region_obligatoire: event.target.checked })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="meme_region_obligatoire" className="cursor-pointer">Même région obligatoire</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="meme_branche_obligatoire"
                checked={data.meme_branche_obligatoire}
                onChange={(event) => onChange({ meme_branche_obligatoire: event.target.checked })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="meme_branche_obligatoire" className="cursor-pointer">Même branche obligatoire</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibilité des résultats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visibility-evaluated"
                checked={data.visibility_policy.evaluated}
                onChange={(event) => onChange({ visibility_policy: { ...data.visibility_policy, evaluated: event.target.checked } })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="visibility-evaluated" className="cursor-pointer">Visible pour l’évalué</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visibility-manager"
                checked={data.visibility_policy.manager_n1}
                onChange={(event) => onChange({ visibility_policy: { ...data.visibility_policy, manager_n1: event.target.checked } })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="visibility-manager" className="cursor-pointer">Visible pour le manager N+1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visibility-upper"
                checked={data.visibility_policy.upper_management}
                onChange={(event) => onChange({ visibility_policy: { ...data.visibility_policy, upper_management: event.target.checked } })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="visibility-upper" className="cursor-pointer">Visible pour les niveaux supérieurs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visibility-admin"
                checked={data.visibility_policy.admin}
                onChange={(event) => onChange({ visibility_policy: { ...data.visibility_policy, admin: event.target.checked } })}
                className="rounded border-sabc-gray-200"
              />
              <Label htmlFor="visibility-admin" className="cursor-pointer">Visible pour l’admin</Label>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="visibility-detail">Niveau de détail</Label>
              <Select
                value={data.visibility_policy.detail}
                onValueChange={(value: 'aggregated' | 'detailed') => onChange({
                  visibility_policy: { ...data.visibility_policy, detail: value },
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aggregated">Agrégé</SelectItem>
                  <SelectItem value="detailed">Détaillé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remontée analytics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ['individual_dashboard', 'Dashboard individuel'],
              ['team_dashboard', 'Dashboard équipe'],
              ['admin_dashboard', 'Dashboard admin'],
              ['alerts', 'Alertes / anomalies'],
              ['improvement_plans', 'Plans d’amélioration'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`analytics-${key}`}
                  checked={Boolean(data.analytics_metadata[key as keyof typeof data.analytics_metadata])}
                  onChange={(event) => onChange({
                    analytics_metadata: {
                      ...data.analytics_metadata,
                      [key]: event.target.checked,
                    },
                  })}
                  className="rounded border-sabc-gray-200"
                />
                <Label htmlFor={`analytics-${key}`} className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template associé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-sabc-gray-600">
              Le template assigné au rôle évalué pour la période active fournit les compétences de cette règle.
            </p>
            {periodsLoading ? (
              <p className="text-sm text-sabc-gray-500">Chargement de la période active…</p>
            ) : !activePeriod ? (
              <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Aucune période active ne permet de déterminer le template associé.
              </p>
            ) : !data.role_evalue ? (
              <p className="text-sm text-sabc-gray-500">Sélectionnez le rôle évalué pour afficher son template.</p>
            ) : !evaluatedRole ? (
              <p role="status" className="text-sm text-sabc-gray-500">Le rôle sélectionné est introuvable.</p>
            ) : assignmentsLoading || templateLoading ? (
              <p className="text-sm text-sabc-gray-500">Chargement du template assigné…</p>
            ) : assignmentsError || templateError ? (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Impossible de charger le template associé.
              </p>
            ) : !assignment?.template_assigne ? (
              <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Aucun template n’est assigné à {data.role_evalue} pour {activePeriod.nom_periode || activePeriod.code_periode}.
              </p>
            ) : !template ? (
              <p role="status" className="text-sm text-sabc-gray-500">Le template assigné est introuvable.</p>
            ) : template.statut !== 'published' ? (
              <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Le template assigné n’est pas publié et ne peut pas être utilisé par cette règle.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-sabc-gray-200 bg-sabc-gray-50 p-4">
                  <div className="font-semibold text-sabc-gray-900">{template.titre || template.nom}</div>
                  <div className="mt-1 text-sm text-sabc-gray-600">
                    {data.role_evalue} · {activePeriod.nom_periode || activePeriod.code_periode} · Version {template.version}
                  </div>
                  {template.description ? <p className="mt-2 text-sm text-sabc-gray-600">{template.description}</p> : null}
                </div>
                {!templateHasValidWeights(template) ? (
                  <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Ce template ne contient pas de pondération valide. Pour permettre l’évaluation, les poids seront répartis équitablement entre ses compétences.
                  </p>
                ) : null}
                {(Array.isArray(template.sections) ? template.sections : []).map((section: any, sectionIndex: number) => (
                  <div key={`${section.titre}-${sectionIndex}`} className="space-y-2">
                    <h3 className="text-sm font-semibold text-sabc-gray-900">{section.titre}</h3>
                    {(Array.isArray(section.competences) ? section.competences : []).map((competence: any, competenceIndex: number) => (
                      <div
                        key={`${competence.libelle}-${competenceIndex}`}
                        className="flex flex-col gap-1 rounded-md border border-sabc-gray-200 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-sabc-gray-900">{competence.libelle}</div>
                          {competence.description ? <p className="mt-1 text-sm text-sabc-gray-600">{competence.description}</p> : null}
                        </div>
                        <div className="shrink-0 text-xs text-sabc-gray-500">
                          {competence.poids}% · Niveau requis {competence.niveau_requis}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <p className="text-xs text-sabc-gray-500">
                  {templateCriteria.length} compétences · aperçu en lecture seule
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={processing || !canSubmit} className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">
            {processing ? 'Enregistrement...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
