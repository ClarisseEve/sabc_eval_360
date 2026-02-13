package domain

import (
	"github.com/google/uuid"
)

// EvaluationPermission defines who can evaluate whom
type EvaluationPermission struct {
	ID              uuid.UUID      `json:"id_permission"`
	RoleEvaluateur  string         `json:"role_evaluateur"`
	RoleEvalue      string         `json:"role_evalue"`
	TypeEvaluation  TypeEvaluation `json:"type_evaluation"`
	EstAutorise     bool           `json:"est_autorise"`
	EstActive       bool           `json:"est_active"`
	Description     string         `json:"description"`
	ConditionsJSON  map[string]any `json:"conditions_json,omitempty"`
}

// IsAllowed checks if the evaluation is permitted
func (p *EvaluationPermission) IsAllowed() bool {
	return p.EstAutorise && p.EstActive
}

// PermissionMatrix holds all evaluation permissions
type PermissionMatrix struct {
	permissions []EvaluationPermission
}

// NewPermissionMatrix creates a new permission matrix
func NewPermissionMatrix(permissions []EvaluationPermission) *PermissionMatrix {
	return &PermissionMatrix{permissions: permissions}
}

// CanEvaluate checks if a role can evaluate another role with a specific type
func (m *PermissionMatrix) CanEvaluate(roleEvaluateur, roleEvalue string, typeEval TypeEvaluation) bool {
	for _, p := range m.permissions {
		if p.RoleEvaluateur == roleEvaluateur &&
			p.RoleEvalue == roleEvalue &&
			p.TypeEvaluation == typeEval &&
			p.IsAllowed() {
			return true
		}
	}
	return false
}

// GetAllowedTypes returns all evaluation types allowed for a role pair
func (m *PermissionMatrix) GetAllowedTypes(roleEvaluateur, roleEvalue string) []TypeEvaluation {
	var types []TypeEvaluation
	for _, p := range m.permissions {
		if p.RoleEvaluateur == roleEvaluateur &&
			p.RoleEvalue == roleEvalue &&
			p.IsAllowed() {
			types = append(types, p.TypeEvaluation)
		}
	}
	return types
}

// GetEvaluableRoles returns all roles that can be evaluated by a given role
func (m *PermissionMatrix) GetEvaluableRoles(roleEvaluateur string) []string {
	roleMap := make(map[string]bool)
	for _, p := range m.permissions {
		if p.RoleEvaluateur == roleEvaluateur && p.IsAllowed() {
			roleMap[p.RoleEvalue] = true
		}
	}

	var roles []string
	for role := range roleMap {
		roles = append(roles, role)
	}
	return roles
}
