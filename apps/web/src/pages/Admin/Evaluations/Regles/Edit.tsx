import React from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { RuleForm } from './RuleForm';
import { builderInputToPayload, createEmptyRuleBuilderInput, ruleToBuilderInput } from '@/utils/rules';
import type { RuleBuilderInput } from '@/types/rules';

export default function EditRulePage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [formData, setFormData] = React.useState<RuleBuilderInput>(createEmptyRuleBuilderInput());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { data: ruleData } = useSuspenseQuery({
    queryKey: ['admin', 'roles', 'regles', id],
    queryFn: () => adminApi.roles.getRegle(id).then((response) => response.data),
  });

  const { data: rolesData } = useSuspenseQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => adminApi.roles.list().then((response) => response.data),
  });

  React.useEffect(() => {
    if (ruleData) {
      setFormData(ruleToBuilderInput(ruleData));
    }
  }, [ruleData]);

  const roles = Array.isArray(rolesData) ? rolesData : [];
  const types = ['auto', 'pairs', 'descendante', 'ascendante', '360'];

  const updateMutation = useMutation({
    mutationFn: (criteria: RuleBuilderInput['criteres']) =>
      adminApi.roles.updateRegle(id, builderInputToPayload({ ...formData, criteres: criteria })),
    onSuccess: () => navigate('/admin/evaluations/regles'),
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      setErrorMessage(Array.isArray(message) ? message.join(' ') : message || 'Impossible de mettre à jour la règle.');
    },
  });

  return (
    <AdminEvaluationsLayout title="Modifier une règle d’évaluation">
      {errorMessage ? (
        <div className="rounded-lg border border-sabc-red-primary/30 bg-sabc-red-light px-4 py-3 text-sm text-sabc-red-primary">
          {errorMessage}
        </div>
      ) : null}

      <RuleForm
        title="Modifier une règle d’évaluation"
        subtitle={formData.nom_regle || 'Ajustez la relation d’évaluation et consultez le template associé.'}
        data={formData}
        onChange={(patch) => setFormData((current) => ({ ...current, ...patch }))}
        onSubmit={(_event, criteria) => {
          setErrorMessage(null);
          updateMutation.mutate(criteria);
        }}
        onCancel={() => navigate('/admin/evaluations/regles')}
        processing={updateMutation.isPending}
        roles={roles}
        types={types}
        submitLabel="Mettre à jour la règle"
      />
    </AdminEvaluationsLayout>
  );
}
