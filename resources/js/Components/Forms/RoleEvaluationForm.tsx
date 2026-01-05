import * as React from 'react';
import { EvaluationForm, EvaluationFormData } from './EvaluationForm';
import { EvaluationRole, getSkillsForRole, getRoleConfig } from './evaluationSkillsConfig';

export interface RoleEvaluationFormProps {
  role: EvaluationRole;
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

/**
 * Composant générique pour les formulaires d'évaluation par rôle
 * Remplace les 9 composants spécifiques (CDSEvaluationForm, CSCEvaluationForm, etc.)
 *
 * Usage:
 * <RoleEvaluationForm role="CDS" evaluation={...} onSaveDraft={...} onSubmit={...} />
 */
export const RoleEvaluationForm: React.FC<RoleEvaluationFormProps> = ({
  role,
  evaluation,
  onSaveDraft,
  onSubmit,
  readOnly = false,
  className,
}) => {
  const skills = getSkillsForRole(role);
  const config = getRoleConfig(role);

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-white p-4 shadow-sm dark:bg-sabc-gray-800">
        <h2 className="text-xl font-semibold text-sabc-gray-900 dark:text-white">
          {config.title}
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          {config.description}
        </p>
      </div>

      <EvaluationForm
        skills={skills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

// Factory pour créer des composants spécifiques (rétrocompatibilité)
export const createRoleEvaluationForm = (role: EvaluationRole) => {
  const RoleSpecificForm: React.FC<Omit<RoleEvaluationFormProps, 'role'>> = (props) => (
    <RoleEvaluationForm role={role} {...props} />
  );
  RoleSpecificForm.displayName = `${role}EvaluationForm`;
  return RoleSpecificForm;
};

// Exports pour rétrocompatibilité avec les imports existants
export const CDSEvaluationForm = createRoleEvaluationForm('CDS');
export const CDVEvaluationForm = createRoleEvaluationForm('CDV');
export const CSCEvaluationForm = createRoleEvaluationForm('CSC');
export const CDTTEvaluationForm = createRoleEvaluationForm('CDTT');
export const RTMEvaluationForm = createRoleEvaluationForm('RTM');
export const TMOEvaluationForm = createRoleEvaluationForm('TMO');
export const SRMOEvaluationForm = createRoleEvaluationForm('SRMO');
export const SSEvaluationForm = createRoleEvaluationForm('SS');
export const ASEvaluationForm = createRoleEvaluationForm('AS');

export default RoleEvaluationForm;
