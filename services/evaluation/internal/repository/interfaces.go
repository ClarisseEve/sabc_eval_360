package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/sabc/evaluation-service/internal/domain"
)

// EvaluationRepository defines the evaluation data access interface
type EvaluationRepository interface {
	// Create persists a new evaluation
	Create(ctx context.Context, eval *domain.Evaluation) error

	// Update modifies an existing evaluation
	Update(ctx context.Context, eval *domain.Evaluation) error

	// FindByID retrieves an evaluation by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Evaluation, error)

	// FindByEvaluateur retrieves all evaluations by an evaluator
	FindByEvaluateur(ctx context.Context, matricule string, filters EvaluationFilters) ([]*domain.Evaluation, error)

	// FindByEvalue retrieves all evaluations for an evaluated user
	FindByEvalue(ctx context.Context, matricule string, filters EvaluationFilters) ([]*domain.Evaluation, error)

	// FindByPeriode retrieves all evaluations for a period
	FindByPeriode(ctx context.Context, idPeriode uuid.UUID, filters EvaluationFilters) ([]*domain.Evaluation, error)

	// FindPending retrieves evaluations awaiting action
	FindPending(ctx context.Context, matricule string, statut domain.Statut) ([]*domain.Evaluation, error)

	// CountByPeriode counts evaluations by period and status
	CountByPeriode(ctx context.Context, idPeriode uuid.UUID, statut domain.Statut) (int, error)

	// Delete removes an evaluation
	Delete(ctx context.Context, id uuid.UUID) error
}

// EvaluationFilters holds query filters for evaluations
type EvaluationFilters struct {
	Statut         *domain.Statut
	TypeEvaluation *domain.TypeEvaluation
	IDPeriode      *uuid.UUID
	DateFrom       *string
	DateTo         *string
	Limit          int
	Offset         int
}

// PeriodeRepository defines the period data access interface
type PeriodeRepository interface {
	// FindByID retrieves a period by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*domain.PeriodeEvaluation, error)

	// FindActive retrieves all active periods
	FindActive(ctx context.Context) ([]*domain.PeriodeEvaluation, error)

	// FindByCode retrieves a period by its code
	FindByCode(ctx context.Context, code string) (*domain.PeriodeEvaluation, error)

	// Create persists a new period
	Create(ctx context.Context, periode *domain.PeriodeEvaluation) error

	// Update modifies an existing period
	Update(ctx context.Context, periode *domain.PeriodeEvaluation) error

	// UpdateCompletionStats updates period completion statistics
	UpdateCompletionStats(ctx context.Context, idPeriode uuid.UUID, completed int, total int) error
}

// PermissionRepository defines the permission data access interface
type PermissionRepository interface {
	// FindAll retrieves all permissions
	FindAll(ctx context.Context) ([]domain.EvaluationPermission, error)

	// FindByRoles retrieves permissions for specific role pairs
	FindByRoles(ctx context.Context, roleEvaluateur, roleEvalue string) ([]domain.EvaluationPermission, error)

	// IsAllowed checks if a specific evaluation is permitted
	IsAllowed(ctx context.Context, roleEvaluateur, roleEvalue string, typeEval domain.TypeEvaluation) (bool, error)
}

// ScoreRepository defines the score data access interface
type ScoreRepository interface {
	// FindByUserAndPeriod retrieves a user's score for a period
	FindByUserAndPeriod(ctx context.Context, matricule string, idPeriode uuid.UUID) (*domain.ScoreUtilisateur, error)

	// Upsert creates or updates a user score
	Upsert(ctx context.Context, score *domain.ScoreUtilisateur) error

	// FindByPeriod retrieves all scores for a period
	FindByPeriod(ctx context.Context, idPeriode uuid.UUID) ([]*domain.ScoreUtilisateur, error)

	// FindPreviousScore retrieves the score from the previous period
	FindPreviousScore(ctx context.Context, matricule string, currentPeriode uuid.UUID) (*float64, error)

	// UpdatePosition updates team position for a user
	UpdatePosition(ctx context.Context, matricule string, idPeriode uuid.UUID, position int) error
}

// RegleRepository defines the rule data access interface
type RegleRepository interface {
	// FindByID retrieves a rule by its ID
	FindByID(ctx context.Context, id uuid.UUID) (*RegleEvaluation, error)

	// FindActive retrieves all active rules
	FindActive(ctx context.Context) ([]*RegleEvaluation, error)
}

// RegleEvaluation represents an evaluation rule
type RegleEvaluation struct {
	ID          uuid.UUID      `json:"id_regle"`
	NomRegle    string         `json:"nom_regle"`
	Description string         `json:"description"`
	Criteres    []CritereRegle `json:"criteres"`
	EstActive   bool           `json:"est_active"`
	DateDebut   *string        `json:"date_debut,omitempty"`
	DateFin     *string        `json:"date_fin,omitempty"`
}

// CritereRegle represents an evaluation criterion
type CritereRegle struct {
	Code        string  `json:"code"`
	Nom         string  `json:"nom"`
	Description string  `json:"description"`
	Ponderation float64 `json:"ponderation"`
	NoteMin     float64 `json:"note_min"`
	NoteMax     float64 `json:"note_max"`
}
