package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sabc/evaluation-service/internal/domain"
)

// PeriodeRepo implements PeriodeRepository for PostgreSQL
type PeriodeRepo struct {
	pool *pgxpool.Pool
}

// NewPeriodeRepo creates a new PostgreSQL periode repository
func NewPeriodeRepo(pool *pgxpool.Pool) *PeriodeRepo {
	return &PeriodeRepo{pool: pool}
}

// FindByID retrieves a period by its ID
func (r *PeriodeRepo) FindByID(ctx context.Context, id uuid.UUID) (*domain.PeriodeEvaluation, error) {
	query := `
		SELECT
			id_periode, code_periode, nom_periode, titre, description,
			date_debut, date_fin, statut, id_regle, est_ouverte, est_cloturee,
			nb_evaluations_attendues, nb_evaluations_completees, taux_completion,
			duree_rappels_jours, nb_max_rappels, escalade_automatique,
			created_at, updated_at
		FROM periodes_evaluation
		WHERE id_periode = $1
	`

	row := r.pool.QueryRow(ctx, query, id)
	return r.scanPeriode(row)
}

// FindActive retrieves all active periods
func (r *PeriodeRepo) FindActive(ctx context.Context) ([]*domain.PeriodeEvaluation, error) {
	query := `
		SELECT
			id_periode, code_periode, nom_periode, titre, description,
			date_debut, date_fin, statut, id_regle, est_ouverte, est_cloturee,
			nb_evaluations_attendues, nb_evaluations_completees, taux_completion,
			duree_rappels_jours, nb_max_rappels, escalade_automatique,
			created_at, updated_at
		FROM periodes_evaluation
		WHERE statut = 'ouverte'
		  AND est_ouverte = true
		  AND est_cloturee = false
		  AND date_debut <= NOW()
		  AND date_fin >= NOW()
		ORDER BY date_debut DESC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query active periods: %w", err)
	}
	defer rows.Close()

	var periodes []*domain.PeriodeEvaluation
	for rows.Next() {
		periode, err := r.scanPeriodeRow(rows)
		if err != nil {
			return nil, err
		}
		periodes = append(periodes, periode)
	}

	return periodes, rows.Err()
}

// FindByCode retrieves a period by its code
func (r *PeriodeRepo) FindByCode(ctx context.Context, code string) (*domain.PeriodeEvaluation, error) {
	query := `
		SELECT
			id_periode, code_periode, nom_periode, titre, description,
			date_debut, date_fin, statut, id_regle, est_ouverte, est_cloturee,
			nb_evaluations_attendues, nb_evaluations_completees, taux_completion,
			duree_rappels_jours, nb_max_rappels, escalade_automatique,
			created_at, updated_at
		FROM periodes_evaluation
		WHERE code_periode = $1
	`

	row := r.pool.QueryRow(ctx, query, code)
	return r.scanPeriode(row)
}

// Create persists a new period
func (r *PeriodeRepo) Create(ctx context.Context, periode *domain.PeriodeEvaluation) error {
	query := `
		INSERT INTO periodes_evaluation (
			id_periode, code_periode, nom_periode, titre, description,
			date_debut, date_fin, statut, id_regle, est_ouverte, est_cloturee,
			nb_evaluations_attendues, nb_evaluations_completees, taux_completion,
			duree_rappels_jours, nb_max_rappels, escalade_automatique,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
	`

	_, err := r.pool.Exec(ctx, query,
		periode.ID,
		periode.CodePeriode,
		periode.NomPeriode,
		periode.Titre,
		periode.Description,
		periode.DateDebut,
		periode.DateFin,
		periode.Statut,
		periode.IDRegle,
		periode.EstOuverte,
		periode.EstCloturee,
		periode.NbEvaluationsAttendues,
		periode.NbEvaluationsCompletees,
		periode.TauxCompletion,
		periode.DureeRappelsJours,
		periode.NbMaxRappels,
		periode.EscaladeAutomatique,
		periode.CreatedAt,
		periode.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("insert periode: %w", err)
	}

	return nil
}

// Update modifies an existing period
func (r *PeriodeRepo) Update(ctx context.Context, periode *domain.PeriodeEvaluation) error {
	query := `
		UPDATE periodes_evaluation SET
			nom_periode = $2,
			titre = $3,
			description = $4,
			date_debut = $5,
			date_fin = $6,
			statut = $7,
			est_ouverte = $8,
			est_cloturee = $9,
			nb_evaluations_attendues = $10,
			nb_evaluations_completees = $11,
			taux_completion = $12,
			duree_rappels_jours = $13,
			nb_max_rappels = $14,
			escalade_automatique = $15,
			updated_at = $16
		WHERE id_periode = $1
	`

	result, err := r.pool.Exec(ctx, query,
		periode.ID,
		periode.NomPeriode,
		periode.Titre,
		periode.Description,
		periode.DateDebut,
		periode.DateFin,
		periode.Statut,
		periode.EstOuverte,
		periode.EstCloturee,
		periode.NbEvaluationsAttendues,
		periode.NbEvaluationsCompletees,
		periode.TauxCompletion,
		periode.DureeRappelsJours,
		periode.NbMaxRappels,
		periode.EscaladeAutomatique,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("update periode: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("periode not found: %s", periode.ID)
	}

	return nil
}

// UpdateCompletionStats updates period completion statistics
func (r *PeriodeRepo) UpdateCompletionStats(ctx context.Context, idPeriode uuid.UUID, completed int, total int) error {
	var tauxCompletion float64
	if total > 0 {
		tauxCompletion = float64(completed) / float64(total) * 100
	}

	query := `
		UPDATE periodes_evaluation SET
			nb_evaluations_completees = $2,
			nb_evaluations_attendues = $3,
			taux_completion = $4,
			updated_at = $5
		WHERE id_periode = $1
	`

	result, err := r.pool.Exec(ctx, query, idPeriode, completed, total, tauxCompletion, time.Now())
	if err != nil {
		return fmt.Errorf("update completion stats: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("periode not found: %s", idPeriode)
	}

	return nil
}

// scanPeriode scans a single row into a PeriodeEvaluation
func (r *PeriodeRepo) scanPeriode(row pgx.Row) (*domain.PeriodeEvaluation, error) {
	var periode domain.PeriodeEvaluation

	err := row.Scan(
		&periode.ID,
		&periode.CodePeriode,
		&periode.NomPeriode,
		&periode.Titre,
		&periode.Description,
		&periode.DateDebut,
		&periode.DateFin,
		&periode.Statut,
		&periode.IDRegle,
		&periode.EstOuverte,
		&periode.EstCloturee,
		&periode.NbEvaluationsAttendues,
		&periode.NbEvaluationsCompletees,
		&periode.TauxCompletion,
		&periode.DureeRappelsJours,
		&periode.NbMaxRappels,
		&periode.EscaladeAutomatique,
		&periode.CreatedAt,
		&periode.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("scan periode: %w", err)
	}

	return &periode, nil
}

// scanPeriodeRow scans a row from a rows iterator
func (r *PeriodeRepo) scanPeriodeRow(rows pgx.Rows) (*domain.PeriodeEvaluation, error) {
	var periode domain.PeriodeEvaluation

	err := rows.Scan(
		&periode.ID,
		&periode.CodePeriode,
		&periode.NomPeriode,
		&periode.Titre,
		&periode.Description,
		&periode.DateDebut,
		&periode.DateFin,
		&periode.Statut,
		&periode.IDRegle,
		&periode.EstOuverte,
		&periode.EstCloturee,
		&periode.NbEvaluationsAttendues,
		&periode.NbEvaluationsCompletees,
		&periode.TauxCompletion,
		&periode.DureeRappelsJours,
		&periode.NbMaxRappels,
		&periode.EscaladeAutomatique,
		&periode.CreatedAt,
		&periode.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("scan periode row: %w", err)
	}

	return &periode, nil
}
