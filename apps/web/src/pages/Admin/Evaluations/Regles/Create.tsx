import React from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/Services/api';
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

  const roles = Array.isArray(rolesData) ? rolesData : [];
  const types = ['auto', 'pairs', 'descendante', 'ascendante', '360'];

  const createMutation = useMutation({
    mutationFn: (criteria: RuleBuilderInput['criteres']) =>
      adminApi.roles.createRegle(builderInputToPayload({ ...formData, criteres: criteria })),
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
        subtitle="Définissez la relation d’évaluation; les compétences proviennent du template associé."
        data={formData}
        onChange={(patch) => setFormData((current) => ({ ...current, ...patch }))}
        onSubmit={(_event, criteria) => {
          setErrorMessage(null);
          createMutation.mutate(criteria);
        }}
        onCancel={() => navigate('/admin/evaluations/regles')}
        processing={createMutation.isPending}
        roles={roles}
        types={types}
        submitLabel="Créer la règle"
      />
    </AdminEvaluationsLayout>
  );
}
