import { ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import CriteresEditor from '@/Components/Evaluations/CriteresEditor';
import type { RuleBuilderInput } from '@/types/rules';

interface RuleFormProps {
  title: string;
  subtitle: string;
  data: RuleBuilderInput;
  onChange: (patch: Partial<RuleBuilderInput>) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  processing: boolean;
  errors?: Record<string, string>;
  roles: string[];
  categories: string[];
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
  categories,
  types,
  submitLabel,
}: RuleFormProps) {
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

      <form onSubmit={onSubmit} className="space-y-6">
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
                    <SelectItem key={role} value={role}>{role}</SelectItem>
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
                    <SelectItem key={role} value={role}>{role}</SelectItem>
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
            <CardTitle>Critères d’évaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <CriteresEditor
              value={data.criteres}
              onChange={(criteres) => onChange({ criteres })}
              categories={categories}
              errors={errors.criteres}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={processing} className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">
            {processing ? 'Enregistrement...' : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
