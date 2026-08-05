import React from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi, reglesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { RuleForm } from './RuleForm';
import { builderInputToPayload, createEmptyRuleBuilderInput } from '@/utils/rules';
import type { RuleBuilderInput } from '@/types/rules';

export default function CreateRulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Pre-fill the couple/type when launched from a matrix cell.
  const [formData, setFormData] = React.useState<RuleBuilderInput>(() => {
    const base = createEmptyRuleBuilderInput();
    const roleEvaluateur = searchParams.get('role_evaluateur');
    const roleEvalue = searchParams.get('role_evalue');
    const typeEvaluation = searchParams.get('type_evaluation');
    return {
      ...base,
      role_evaluateur: roleEvaluateur ?? base.role_evaluateur,
      role_evalue: roleEvalue ?? base.role_evalue,
      type_evaluation: typeEvaluation ?? base.type_evaluation,
    };
  });
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { data: rolesData } = useSuspenseQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => adminApi.roles.list().then((response) => response.data),
  });

  const { data: constraintsData } = useSuspenseQuery({
    queryKey: ['regles', 'constraints'],
    queryFn: () => reglesApi.constraints().then((response) => response.data),
  });

  const roles = Array.isArray(rolesData) ? rolesData.map((role: any) => role.nom_role) : [];
  const categories = Array.isArray(constraintsData?.categories_valides)
    ? constraintsData.categories_valides
    : ['Compétences', 'Leadership', 'Performance', 'Exécution'];
  const types = ['auto', 'pairs', 'descendante', 'ascendante', '360'];

  const createMutation = useMutation({
    mutationFn: () => adminApi.roles.createRegle(builderInputToPayload(formData)),
    onSuccess: () => navigate('/admin/evaluations/regles'),
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      setErrorMessage(Array.isArray(message) ? message.join(' ') : message || 'Impossible de créer la règle.');
    },
  });

  return (
    <AdminEvaluationsLayout title="Créer une règle d’évaluation">
      {errorMessage ? (
        <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">
          {errorMessage}
        </div>
      ) : null}

      <RuleForm
        title="Créer une règle d’évaluation"
        subtitle="Définissez le contexte, la visibilité et les critères évalués."
        data={formData}
        onChange={(patch) => setFormData((current) => ({ ...current, ...patch }))}
        onSubmit={(event) => {
          event.preventDefault();
          setErrorMessage(null);
          createMutation.mutate();
        }}
        onCancel={() => navigate('/admin/evaluations/regles')}
        processing={createMutation.isPending}
        roles={roles}
        categories={categories}
        types={types}
        submitLabel="Créer la règle"
      />
    </AdminEvaluationsLayout>
  );
}
