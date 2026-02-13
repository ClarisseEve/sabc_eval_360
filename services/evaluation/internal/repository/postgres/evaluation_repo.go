package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sabc/evaluation-service/internal/domain"
	"github.com/sabc/evaluation-service/internal/repository"
)

// EvaluationRepo implements EvaluationRepository for PostgreSQL
type EvaluationRepo struct {
	pool *pgxpool.Pool
}

// NewEvaluationRepo creates a new PostgreSQL evaluation repository
func NewEvaluationRepo(pool *pgxpool.Pool) *EvaluationRepo {
	return &EvaluationRepo{pool: pool}
}

// Create persists a new evaluation
func (r *EvaluationRepo) Create(ctx context.Context, eval *domain.Evaluation) error {
	notesJSON, err := encodeNotesJSON(eval.Notes)
	if err != nil {
		return fmt.Errorf("marshal notes: %w", err)
	}

	query := `
		INSERT INTO evaluations (
			id_evaluation, evaluateur_matricule, evalue_matricule,
			id_periode, id_regle, date_evaluation, statut,
			notations_json, commentaire_general, note_globale, type_evaluation,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err = r.pool.Exec(ctx, query,
		eval.ID,
		eval.EvaluateurMatricule,
		eval.EvalueMatricule,
		eval.IDPeriode,
		eval.IDRegle,
		eval.DateEvaluation,
		eval.Statut,
		notesJSON,
		eval.CommentaireGeneral,
		eval.ScoreGlobal,
		eval.TypeEvaluation,
		eval.CreatedAt,
		eval.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("insert evaluation: %w", err)
	}

	return nil
}

// Update modifies an existing evaluation
func (r *EvaluationRepo) Update(ctx context.Context, eval *domain.Evaluation) error {
	notesJSON, err := encodeNotesJSON(eval.Notes)
	if err != nil {
		return fmt.Errorf("marshal notes: %w", err)
	}

	query := `
		UPDATE evaluations SET
			statut = $2,
			notations_json = $3,
			commentaire_general = $4,
			commentaire_validation = $5,
			validateur_matricule = $6,
			date_soumission = $7,
			date_validation = $8,
			note_globale = $9,
			updated_at = $10
		WHERE id_evaluation = $1
	`

	result, err := r.pool.Exec(ctx, query,
		eval.ID,
		eval.Statut,
		notesJSON,
		eval.CommentaireGeneral,
		eval.CommentaireValidation,
		eval.ValidateurMatricule,
		eval.DateSoumission,
		eval.DateValidation,
		eval.ScoreGlobal,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("update evaluation: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("evaluation not found: %s", eval.ID)
	}

	return nil
}

// FindByID retrieves an evaluation by its ID
func (r *EvaluationRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.Evaluation, error) {
	query := `
		SELECT
			id_evaluation, evaluateur_matricule, evalue_matricule,
			id_periode, id_regle, date_evaluation, date_soumission,
			date_validation, statut, notations_json, commentaire_general,
			commentaire_validation, validateur_matricule, note_globale,
			type_evaluation, created_at, updated_at
		FROM evaluations
		WHERE id_evaluation = $1
	`

	row := r.pool.QueryRow(ctx, query, id)
	return r.scanEvaluation(row)
}

// FindByEvaluateur retrieves all evaluations by an evaluator
func (r *EvaluationRepo) FindByEvaluateur(ctx context.Context, matricule string, filters repository.EvaluationFilters) ([]*domain.Evaluation, error) {
	query, args := r.buildQuery("evaluateur_matricule = $1", matricule, filters)
	return r.queryEvaluations(ctx, query, args)
}

// FindByEvalue retrieves all evaluations for an evaluated user
func (r *EvaluationRepo) FindByEvalue(ctx context.Context, matricule string, filters repository.EvaluationFilters) ([]*domain.Evaluation, error) {
	query, args := r.buildQuery("evalue_matricule = $1", matricule, filters)
	return r.queryEvaluations(ctx, query, args)
}

// FindByPeriode retrieves all evaluations for a period
func (r *EvaluationRepo) FindByPeriode(ctx context.Context, idPeriode uuid.UUID, filters repository.EvaluationFilters) ([]*domain.Evaluation, error) {
	query, args := r.buildQuery("id_periode = $1", idPeriode, filters)
	return r.queryEvaluations(ctx, query, args)
}

// FindPending retrieves evaluations awaiting action
func (r *EvaluationRepo) FindPending(ctx context.Context, matricule string, statut domain.Statut) ([]*domain.Evaluation, error) {
	query := `
		SELECT
			id_evaluation, evaluateur_matricule, evalue_matricule,
			id_periode, id_regle, date_evaluation, date_soumission,
			date_validation, statut, notations_json, commentaire_general,
			commentaire_validation, validateur_matricule, note_globale,
			type_evaluation, created_at, updated_at
		FROM evaluations
		WHERE evaluateur_matricule = $1 AND statut = $2
		ORDER BY date_evaluation DESC
	`

	return r.queryEvaluations(ctx, query, []any{matricule, statut})
}

// CountByPeriode counts evaluations by period and status
func (r *EvaluationRepo) CountByPeriode(ctx context.Context, idPeriode uuid.UUID, statut domain.Statut) (int, error) {
	query := `SELECT COUNT(*) FROM evaluations WHERE id_periode = $1 AND statut = $2`

	var count int
	err := r.pool.QueryRow(ctx, query, idPeriode, statut).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count evaluations: %w", err)
	}

	return count, nil
}

// Delete removes an evaluation
func (r *EvaluationRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM evaluations WHERE id_evaluation = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete evaluation: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("evaluation not found: %s", id)
	}

	return nil
}

// buildQuery constructs a dynamic query with filters
func (r *EvaluationRepo) buildQuery(baseCondition string, baseArg any, filters repository.EvaluationFilters) (string, []any) {
	var conditions []string
	var args []any

	conditions = append(conditions, baseCondition)
	args = append(args, baseArg)

	argNum := 2

	if filters.Statut != nil {
		conditions = append(conditions, fmt.Sprintf("statut = $%d", argNum))
		args = append(args, *filters.Statut)
		argNum++
	}

	if filters.TypeEvaluation != nil {
		conditions = append(conditions, fmt.Sprintf("type_evaluation = $%d", argNum))
		args = append(args, *filters.TypeEvaluation)
		argNum++
	}

	if filters.IDPeriode != nil {
		conditions = append(conditions, fmt.Sprintf("id_periode = $%d", argNum))
		args = append(args, *filters.IDPeriode)
		argNum++
	}

	if filters.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("date_evaluation >= $%d", argNum))
		args = append(args, *filters.DateFrom)
		argNum++
	}

	if filters.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("date_evaluation <= $%d", argNum))
		args = append(args, *filters.DateTo)
		argNum++
	}

	query := fmt.Sprintf(`
		SELECT
			id_evaluation, evaluateur_matricule, evalue_matricule,
			id_periode, id_regle, date_evaluation, date_soumission,
			date_validation, statut, notations_json, commentaire_general,
			commentaire_validation, validateur_matricule, note_globale,
			type_evaluation, created_at, updated_at
		FROM evaluations
		WHERE %s
		ORDER BY date_evaluation DESC
	`, strings.Join(conditions, " AND "))

	if filters.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", filters.Limit)
	}
	if filters.Offset > 0 {
		query += fmt.Sprintf(" OFFSET %d", filters.Offset)
	}

	return query, args
}

// queryEvaluations executes a query and returns evaluations
func (r *EvaluationRepo) queryEvaluations(ctx context.Context, query string, args []any) ([]*domain.Evaluation, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query evaluations: %w", err)
	}
	defer rows.Close()

	var evaluations []*domain.Evaluation
	for rows.Next() {
		eval, err := r.scanEvaluationRow(rows)
		if err != nil {
			return nil, err
		}
		evaluations = append(evaluations, eval)
	}

	return evaluations, rows.Err()
}

// scanEvaluation scans a single row into an Evaluation
func (r *EvaluationRepo) scanEvaluation(row pgx.Row) (*domain.Evaluation, error) {
	var eval domain.Evaluation
	var notesJSON []byte

	err := row.Scan(
		&eval.ID,
		&eval.EvaluateurMatricule,
		&eval.EvalueMatricule,
		&eval.IDPeriode,
		&eval.IDRegle,
		&eval.DateEvaluation,
		&eval.DateSoumission,
		&eval.DateValidation,
		&eval.Statut,
		&notesJSON,
		&eval.CommentaireGeneral,
		&eval.CommentaireValidation,
		&eval.ValidateurMatricule,
		&eval.ScoreGlobal,
		&eval.TypeEvaluation,
		&eval.CreatedAt,
		&eval.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("scan evaluation: %w", err)
	}

	if len(notesJSON) > 0 {
		notes, err := decodeNotesJSON(notesJSON)
		if err != nil {
			return nil, fmt.Errorf("unmarshal notes: %w", err)
		}
		eval.Notes = notes
	}

	return &eval, nil
}

// scanEvaluationRow scans a row from a rows iterator
func (r *EvaluationRepo) scanEvaluationRow(rows pgx.Rows) (*domain.Evaluation, error) {
	var eval domain.Evaluation
	var notesJSON []byte

	err := rows.Scan(
		&eval.ID,
		&eval.EvaluateurMatricule,
		&eval.EvalueMatricule,
		&eval.IDPeriode,
		&eval.IDRegle,
		&eval.DateEvaluation,
		&eval.DateSoumission,
		&eval.DateValidation,
		&eval.Statut,
		&notesJSON,
		&eval.CommentaireGeneral,
		&eval.CommentaireValidation,
		&eval.ValidateurMatricule,
		&eval.ScoreGlobal,
		&eval.TypeEvaluation,
		&eval.CreatedAt,
		&eval.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("scan evaluation row: %w", err)
	}

	if len(notesJSON) > 0 {
		notes, err := decodeNotesJSON(notesJSON)
		if err != nil {
			return nil, fmt.Errorf("unmarshal notes: %w", err)
		}
		eval.Notes = notes
	}

	return &eval, nil
}

type legacyNote struct {
	ID           any     `json:"id,omitempty"`
	Note         float64 `json:"note"`
	Commentaire  string  `json:"commentaire,omitempty"`
	CritereNom   string  `json:"critere_nom,omitempty"`
	NomCritere   string  `json:"nom_critere,omitempty"`
	CodeCritere  string  `json:"code_critere,omitempty"`
	Ponderation  float64 `json:"ponderation,omitempty"`
	NoteMaximale float64 `json:"note_maximale,omitempty"`
}

type legacyNoteOut struct {
	ID           any     `json:"id,omitempty"`
	Note         float64 `json:"note"`
	Commentaire  string  `json:"commentaire,omitempty"`
	CritereNom   string  `json:"critere_nom,omitempty"`
	Ponderation  float64 `json:"ponderation,omitempty"`
	NoteMaximale float64 `json:"note_maximale,omitempty"`
}

func decodeNotesJSON(data []byte) (domain.NotesJSON, error) {
	var structured domain.NotesJSON
	if err := json.Unmarshal(data, &structured); err == nil && len(structured.Criteres) > 0 {
		return structured, nil
	}

	var legacy []legacyNote
	if err := json.Unmarshal(data, &legacy); err != nil {
		return domain.NotesJSON{}, err
	}

	criteres := make([]domain.Note, 0, len(legacy))
	for _, note := range legacy {
		name := note.NomCritere
		if name == "" {
			name = note.CritereNom
		}

		code := note.CodeCritere
		if code == "" && note.ID != nil {
			code = fmt.Sprint(note.ID)
		}

		criteres = append(criteres, domain.Note{
			CodeCritere:  code,
			NomCritere:   name,
			Note:         note.Note,
			Ponderation:  note.Ponderation,
			Commentaire:  note.Commentaire,
			NoteMaximale: note.NoteMaximale,
		})
	}

	return domain.NotesJSON{Criteres: criteres}, nil
}

func encodeNotesJSON(notes domain.NotesJSON) ([]byte, error) {
	if len(notes.Criteres) == 0 {
		return []byte("[]"), nil
	}

	legacy := make([]legacyNoteOut, 0, len(notes.Criteres))
	for _, note := range notes.Criteres {
		var id any
		if note.CodeCritere != "" {
			id = note.CodeCritere
		}

		legacy = append(legacy, legacyNoteOut{
			ID:           id,
			Note:         note.Note,
			Commentaire:  note.Commentaire,
			CritereNom:   note.NomCritere,
			Ponderation:  note.Ponderation,
			NoteMaximale: note.NoteMaximale,
		})
	}

	return json.Marshal(legacy)
}
