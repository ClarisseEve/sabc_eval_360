package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/sabc/evaluation-service/internal/domain"
	"github.com/sabc/evaluation-service/internal/repository"
	"go.uber.org/zap"
)

// Service errors
var (
	ErrEvaluationNotFound    = errors.New("evaluation not found")
	ErrPeriodeNotFound       = errors.New("periode not found")
	ErrPeriodeNotActive      = errors.New("periode is not active")
	ErrPermissionDenied      = errors.New("permission denied")
	ErrAlreadyEvaluated      = errors.New("evaluation already exists for this period")
	ErrCannotEvaluateSelf    = errors.New("cannot evaluate yourself with this type")
	ErrInvalidEvaluationType = errors.New("invalid evaluation type for roles")
)

// EvaluationService handles evaluation business logic
type EvaluationService struct {
	evalRepo       repository.EvaluationRepository
	periodeRepo    repository.PeriodeRepository
	permissionRepo repository.PermissionRepository
	scoreRepo      repository.ScoreRepository
	logger         *zap.Logger
}

// NewEvaluationService creates a new evaluation service
func NewEvaluationService(
	evalRepo repository.EvaluationRepository,
	periodeRepo repository.PeriodeRepository,
	permissionRepo repository.PermissionRepository,
	scoreRepo repository.ScoreRepository,
	logger *zap.Logger,
) *EvaluationService {
	return &EvaluationService{
		evalRepo:       evalRepo,
		periodeRepo:    periodeRepo,
		permissionRepo: permissionRepo,
		scoreRepo:      scoreRepo,
		logger:         logger,
	}
}

// CreateEvaluationInput holds data for creating an evaluation
type CreateEvaluationInput struct {
	EvaluateurMatricule string
	EvalueMatricule     string
	RoleEvaluateur      string
	RoleEvalue          string
	IDPeriode           uuid.UUID
	IDRegle             uuid.UUID
}

// CreateEvaluation creates a new evaluation
func (s *EvaluationService) CreateEvaluation(ctx context.Context, input CreateEvaluationInput) (*domain.Evaluation, error) {
	// Validate period is active
	periode, err := s.periodeRepo.FindByID(ctx, input.IDPeriode)
	if err != nil {
		return nil, fmt.Errorf("find periode: %w", err)
	}
	if periode == nil {
		return nil, ErrPeriodeNotFound
	}
	if err := periode.CanCreateEvaluation(); err != nil {
		return nil, ErrPeriodeNotActive
	}

	// Determine evaluation type
	typeEval := s.determineEvaluationType(input.EvaluateurMatricule, input.EvalueMatricule, input.RoleEvaluateur, input.RoleEvalue)

	// Check permission
	allowed, err := s.permissionRepo.IsAllowed(ctx, input.RoleEvaluateur, input.RoleEvalue, typeEval)
	if err != nil {
		return nil, fmt.Errorf("check permission: %w", err)
	}
	if !allowed {
		return nil, ErrPermissionDenied
	}

	// Create evaluation
	eval := domain.NewEvaluation(
		input.EvaluateurMatricule,
		input.EvalueMatricule,
		input.IDPeriode,
		input.IDRegle,
		typeEval,
	)

	if err := s.evalRepo.Create(ctx, eval); err != nil {
		return nil, fmt.Errorf("create evaluation: %w", err)
	}

	s.logger.Info("evaluation created",
		zap.String("id", eval.ID.String()),
		zap.String("evaluateur", input.EvaluateurMatricule),
		zap.String("evalue", input.EvalueMatricule),
		zap.String("type", string(typeEval)),
	)

	return eval, nil
}

// determineEvaluationType determines the type of evaluation based on roles
func (s *EvaluationService) determineEvaluationType(evaluateurMatricule, evalueMatricule, roleEvaluateur, roleEvalue string) domain.TypeEvaluation {
	// Self-evaluation
	if evaluateurMatricule == evalueMatricule {
		return domain.TypeAuto
	}

	// Manager evaluating subordinate
	if s.isManager(roleEvaluateur, roleEvalue) {
		return domain.TypeDescendante
	}

	// Subordinate evaluating manager
	if s.isManager(roleEvalue, roleEvaluateur) {
		return domain.TypeAscendante
	}

	// Same level = peers
	if roleEvaluateur == roleEvalue {
		return domain.TypePairs
	}

	return domain.TypeAutre
}

// isManager checks if role1 is a manager role over role2
func (s *EvaluationService) isManager(role1, role2 string) bool {
	// SABC hierarchy: DR > CDTT > RTM > SRMO > TMO > SS
	hierarchy := map[string]int{
		"DR":    6,
		"CDTT":  5,
		"RTM":   4,
		"SRMO":  3,
		"TMO":   2,
		"SS":    1,
		"AS":    1,
		"CDV":   2,
		"CDS":   2,
		"CSC":   2,
		"Admin": 7,
	}

	level1, ok1 := hierarchy[role1]
	level2, ok2 := hierarchy[role2]

	if !ok1 || !ok2 {
		return false
	}

	return level1 > level2
}

// GetEvaluation retrieves an evaluation by ID
func (s *EvaluationService) GetEvaluation(ctx context.Context, id uuid.UUID) (*domain.Evaluation, error) {
	eval, err := s.evalRepo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find evaluation: %w", err)
	}
	if eval == nil {
		return nil, ErrEvaluationNotFound
	}
	return eval, nil
}

// UpdateNotesInput holds data for updating evaluation notes
type UpdateNotesInput struct {
	ID                 uuid.UUID
	Notes              domain.NotesJSON
	CommentaireGeneral string
	UserMatricule      string // For permission check
}

// UpdateNotes updates evaluation notes
func (s *EvaluationService) UpdateNotes(ctx context.Context, input UpdateNotesInput) (*domain.Evaluation, error) {
	eval, err := s.evalRepo.FindByID(ctx, input.ID)
	if err != nil {
		return nil, fmt.Errorf("find evaluation: %w", err)
	}
	if eval == nil {
		return nil, ErrEvaluationNotFound
	}

	// Only evaluator can update notes
	if eval.EvaluateurMatricule != input.UserMatricule {
		return nil, ErrPermissionDenied
	}

	if err := eval.UpdateNotes(input.Notes, input.CommentaireGeneral); err != nil {
		return nil, err
	}

	if err := s.evalRepo.Update(ctx, eval); err != nil {
		return nil, fmt.Errorf("update evaluation: %w", err)
	}

	s.logger.Info("evaluation notes updated",
		zap.String("id", eval.ID.String()),
		zap.String("evaluateur", eval.EvaluateurMatricule),
	)

	return eval, nil
}

// SubmitEvaluation submits an evaluation for validation
func (s *EvaluationService) SubmitEvaluation(ctx context.Context, id uuid.UUID, userMatricule string) (*domain.Evaluation, error) {
	eval, err := s.evalRepo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find evaluation: %w", err)
	}
	if eval == nil {
		return nil, ErrEvaluationNotFound
	}

	// Only evaluator can submit
	if eval.EvaluateurMatricule != userMatricule {
		return nil, ErrPermissionDenied
	}

	if err := eval.Submit(); err != nil {
		return nil, err
	}

	if err := s.evalRepo.Update(ctx, eval); err != nil {
		return nil, fmt.Errorf("update evaluation: %w", err)
	}

	s.logger.Info("evaluation submitted",
		zap.String("id", eval.ID.String()),
		zap.String("evaluateur", eval.EvaluateurMatricule),
	)

	return eval, nil
}

// ValidateEvaluationInput holds data for validating an evaluation
type ValidateEvaluationInput struct {
	ID                  uuid.UUID
	ValidateurMatricule string
	EstValide           bool
	Commentaire         string
}

// ValidateEvaluation validates or rejects an evaluation
func (s *EvaluationService) ValidateEvaluation(ctx context.Context, input ValidateEvaluationInput) (*domain.Evaluation, error) {
	eval, err := s.evalRepo.FindByID(ctx, input.ID)
	if err != nil {
		return nil, fmt.Errorf("find evaluation: %w", err)
	}
	if eval == nil {
		return nil, ErrEvaluationNotFound
	}

	if input.EstValide {
		if err := eval.Validate(input.ValidateurMatricule, input.Commentaire); err != nil {
			return nil, err
		}
	} else {
		if err := eval.Reject(input.ValidateurMatricule, input.Commentaire); err != nil {
			return nil, err
		}
	}

	if err := s.evalRepo.Update(ctx, eval); err != nil {
		return nil, fmt.Errorf("update evaluation: %w", err)
	}

	// If validated, update user scores
	if input.EstValide {
		if err := s.updateUserScores(ctx, eval); err != nil {
			s.logger.Error("failed to update user scores",
				zap.Error(err),
				zap.String("evaluation_id", eval.ID.String()),
			)
		}
	}

	s.logger.Info("evaluation validated",
		zap.String("id", eval.ID.String()),
		zap.Bool("approved", input.EstValide),
		zap.String("validateur", input.ValidateurMatricule),
	)

	return eval, nil
}

// updateUserScores recalculates user scores after validation
func (s *EvaluationService) updateUserScores(ctx context.Context, eval *domain.Evaluation) error {
	// Get all validated evaluations for this user and period
	filters := repository.EvaluationFilters{
		Statut:    ptrTo(domain.StatutValide),
		IDPeriode: &eval.IDPeriode,
	}

	evaluations, err := s.evalRepo.FindByEvalue(ctx, eval.EvalueMatricule, filters)
	if err != nil {
		return fmt.Errorf("find evaluations: %w", err)
	}

	// Calculate scores
	calculator := domain.NewScoreCalculator()
	for _, e := range evaluations {
		calculator.AddEvaluation(e)
	}

	userScore := calculator.CalculateUserScore(eval.EvalueMatricule, eval.IDPeriode)

	// Get previous period score for evolution
	prevScore, _ := s.scoreRepo.FindPreviousScore(ctx, eval.EvalueMatricule, eval.IDPeriode)
	userScore.GetEvolution(prevScore)

	// Count evaluations given
	givenEvals, err := s.evalRepo.FindByEvaluateur(ctx, eval.EvalueMatricule, repository.EvaluationFilters{
		IDPeriode: &eval.IDPeriode,
		Statut:    ptrTo(domain.StatutValide),
	})
	if err == nil {
		userScore.NbEvaluationsDonnees = len(givenEvals)
	}

	// Upsert score
	if err := s.scoreRepo.Upsert(ctx, userScore); err != nil {
		return fmt.Errorf("upsert score: %w", err)
	}

	return nil
}

// GetUserEvaluations retrieves evaluations for a user
func (s *EvaluationService) GetUserEvaluations(ctx context.Context, matricule string, filters repository.EvaluationFilters) ([]*domain.Evaluation, error) {
	return s.evalRepo.FindByEvaluateur(ctx, matricule, filters)
}

// GetEvaluationsToComplete retrieves pending evaluations for a user
func (s *EvaluationService) GetEvaluationsToComplete(ctx context.Context, matricule string) ([]*domain.Evaluation, error) {
	return s.evalRepo.FindPending(ctx, matricule, domain.StatutBrouillon)
}

// GetEvaluationsToValidate retrieves evaluations awaiting validation
func (s *EvaluationService) GetEvaluationsToValidate(ctx context.Context, managerMatricule string) ([]*domain.Evaluation, error) {
	// This would need integration with user hierarchy service
	// For now, return submitted evaluations
	filters := repository.EvaluationFilters{
		Statut: ptrTo(domain.StatutSoumis),
	}
	return s.evalRepo.FindByEvalue(ctx, managerMatricule, filters)
}

// GetActivePeriodes retrieves active evaluation periods
func (s *EvaluationService) GetActivePeriodes(ctx context.Context) ([]*domain.PeriodeEvaluation, error) {
	return s.periodeRepo.FindActive(ctx)
}

// GetUserScore retrieves a user's score for a period
func (s *EvaluationService) GetUserScore(ctx context.Context, matricule string, idPeriode uuid.UUID) (*domain.ScoreUtilisateur, error) {
	return s.scoreRepo.FindByUserAndPeriod(ctx, matricule, idPeriode)
}

// Helper function
func ptrTo[T any](v T) *T {
	return &v
}
