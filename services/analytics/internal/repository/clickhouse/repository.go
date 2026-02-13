package clickhouse

import (
	"context"
	"fmt"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
	"go.uber.org/zap"
)

type Repository struct {
	conn   ch.Conn
	logger *zap.Logger
}

// NewRepository creates a ClickHouse repository.
func NewRepository(conn ch.Conn, logger *zap.Logger) *Repository {
	return &Repository{conn: conn, logger: logger}
}

// GlobalStats holds aggregate metrics.
type GlobalStats struct {
	AverageScore     float64
	TotalEvaluations uint64
	UniqueUsers      uint64
}

// ChannelStats holds evaluation channel data.
type ChannelStats struct {
	Channel       string
	Total         uint64
	AverageScore  float64
}

// TrendPoint represents performance trends.
type TrendPoint struct {
	Period          time.Time
	AverageScore    float64
	TotalEvaluations uint64
}

// AlertRecord represents a raw alert record.
type AlertRecord struct {
	ID          string
	Type        string
	Description string
	Severity    float64
}

// FetchGlobalStats returns global analytics stats for a date range.
func (r *Repository) FetchGlobalStats(ctx context.Context, startDate, endDate time.Time) (GlobalStats, error) {
	query := `
		SELECT
			if(sum(nombre_evaluations) = 0, 0, sum(note_moyenne * nombre_evaluations) / sum(nombre_evaluations)) AS avg_score,
			sum(nombre_evaluations) AS total_evaluations,
			countDistinct(evalue_matricule) AS unique_users
		FROM evaluations_analytics
		WHERE date_jour >= ? AND date_jour <= ?
	`

	row := r.conn.QueryRow(ctx, query, startDate, endDate)
	var stats GlobalStats
	if err := row.Scan(&stats.AverageScore, &stats.TotalEvaluations, &stats.UniqueUsers); err != nil {
		return GlobalStats{}, fmt.Errorf("fetch global stats: %w", err)
	}

	return stats, nil
}

// FetchChannelStats returns evaluation stats grouped by channel.
func (r *Repository) FetchChannelStats(ctx context.Context, startDate, endDate time.Time) ([]ChannelStats, error) {
	query := `
		SELECT
			id_type_evaluation,
			sum(nombre_evaluations) AS total_evaluations,
			if(sum(nombre_evaluations) = 0, 0, sum(note_moyenne * nombre_evaluations) / sum(nombre_evaluations)) AS avg_score
		FROM evaluations_analytics
		WHERE date_jour >= ? AND date_jour <= ?
		GROUP BY id_type_evaluation
	`

	rows, err := r.conn.Query(ctx, query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("fetch channel stats: %w", err)
	}
	defer rows.Close()

	stats := make([]ChannelStats, 0)
	for rows.Next() {
		var item ChannelStats
		if err := rows.Scan(&item.Channel, &item.Total, &item.AverageScore); err != nil {
			return nil, fmt.Errorf("scan channel stats: %w", err)
		}
		stats = append(stats, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate channel stats: %w", err)
	}

	return stats, nil
}

// FetchTrend returns performance trend grouped by month.
func (r *Repository) FetchTrend(ctx context.Context, startDate, endDate time.Time) ([]TrendPoint, error) {
	query := `
		SELECT
			toStartOfMonth(date_jour) AS period,
			if(sum(nombre_evaluations) = 0, 0, sum(note_moyenne * nombre_evaluations) / sum(nombre_evaluations)) AS avg_score,
			sum(nombre_evaluations) AS total_evaluations
		FROM evaluations_analytics
		WHERE date_jour >= ? AND date_jour <= ?
		GROUP BY period
		ORDER BY period
	`

	rows, err := r.conn.Query(ctx, query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("fetch trend: %w", err)
	}
	defer rows.Close()

	points := make([]TrendPoint, 0)
	for rows.Next() {
		var item TrendPoint
		if err := rows.Scan(&item.Period, &item.AverageScore, &item.TotalEvaluations); err != nil {
			return nil, fmt.Errorf("scan trend: %w", err)
		}
		points = append(points, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate trend: %w", err)
	}

	return points, nil
}

// FetchAlerts returns latest anomaly alerts.
func (r *Repository) FetchAlerts(ctx context.Context, limit uint64) ([]AlertRecord, error) {
	query := `
		SELECT
			id_anomalie,
			CAST(type_anomalie AS String) AS type_anomalie,
			description,
			score_severite
		FROM logs_anomalies
		ORDER BY score_severite DESC, created_at DESC
		LIMIT ?
	`

	rows, err := r.conn.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("fetch alerts: %w", err)
	}
	defer rows.Close()

	alerts := make([]AlertRecord, 0)
	for rows.Next() {
		var item AlertRecord
		if err := rows.Scan(&item.ID, &item.Type, &item.Description, &item.Severity); err != nil {
			return nil, fmt.Errorf("scan alerts: %w", err)
		}
		alerts = append(alerts, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate alerts: %w", err)
	}

	return alerts, nil
}

// UserScore holds score data for a user.
type UserScore struct {
	Matricule         string
	Periode           string
	ScoreGlobal       float64
	ScoreAuto         *float64
	ScorePairs        *float64
	ScoreManager      *float64
	Progression       *float64
	NbEvaluations     uint32
	ScoresParCritere  string
	StatutCalcul      string
}

// FetchUserScore returns score for a specific user.
func (r *Repository) FetchUserScore(ctx context.Context, matricule string, periode *string) (*UserScore, error) {
	query := `
		SELECT
			matricule,
			periode_evaluation,
			score_global,
			score_auto_evaluation,
			score_pairs,
			score_manager,
			progression_vs_precedente,
			nb_evaluations_recues,
			scores_par_critere,
			CAST(statut_calcul AS String) AS statut_calcul
		FROM scores_utilisateurs
		WHERE matricule = ?
	`
	args := []interface{}{matricule}

	if periode != nil && *periode != "" {
		query += " AND periode_evaluation = ?"
		args = append(args, *periode)
	}

	query += " ORDER BY created_at DESC LIMIT 1"

	row := r.conn.QueryRow(ctx, query, args...)

	var score UserScore
	if err := row.Scan(
		&score.Matricule,
		&score.Periode,
		&score.ScoreGlobal,
		&score.ScoreAuto,
		&score.ScorePairs,
		&score.ScoreManager,
		&score.Progression,
		&score.NbEvaluations,
		&score.ScoresParCritere,
		&score.StatutCalcul,
	); err != nil {
		return nil, fmt.Errorf("fetch user score: %w", err)
	}

	return &score, nil
}

// RegionalPerformance holds regional stats.
type RegionalPerformance struct {
	RegionID          string
	RegionNom         string
	EstTaniere        bool
	ScoreMoyen        float64
	NombreEvaluations uint32
	Progression       *float64
}

// FetchRegionalPerformance returns performance stats by region.
func (r *Repository) FetchRegionalPerformance(ctx context.Context, startDate, endDate time.Time) ([]RegionalPerformance, error) {
	query := `
		SELECT
			region_id,
			region_nom,
			est_taniere = 1 AS est_taniere,
			if(sum(nombre_evaluations) = 0, 0, sum(score_moyen * nombre_evaluations) / sum(nombre_evaluations)) AS score_moyen,
			sum(nombre_evaluations) AS nombre_evaluations,
			avg(progression_vs_precedent) AS progression
		FROM performance_region
		WHERE date_jour >= ? AND date_jour <= ?
		GROUP BY region_id, region_nom, est_taniere
		ORDER BY score_moyen DESC
	`

	rows, err := r.conn.Query(ctx, query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("fetch regional performance: %w", err)
	}
	defer rows.Close()

	results := make([]RegionalPerformance, 0)
	for rows.Next() {
		var item RegionalPerformance
		if err := rows.Scan(
			&item.RegionID,
			&item.RegionNom,
			&item.EstTaniere,
			&item.ScoreMoyen,
			&item.NombreEvaluations,
			&item.Progression,
		); err != nil {
			return nil, fmt.Errorf("scan regional performance: %w", err)
		}
		results = append(results, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate regional performance: %w", err)
	}

	return results, nil
}

// Recommendation holds recommendation data.
type Recommendation struct {
	ID               string
	Matricule        string
	Type             string
	Titre            string
	Description      string
	Priorite         string
	ScorePertinence  float64
	Statut           string
	DateEcheance     *time.Time
}

// FetchRecommendations returns recommendations for a user.
func (r *Repository) FetchRecommendations(ctx context.Context, matricule string, limit uint64) ([]Recommendation, error) {
	query := `
		SELECT
			id_recommandation,
			matricule_destinataire,
			CAST(type_recommandation AS String) AS type_recommandation,
			titre,
			description,
			CAST(priorite AS String) AS priorite,
			score_pertinence,
			CAST(statut AS String) AS statut,
			date_echeance_suggeree
		FROM recommandations
		WHERE matricule_destinataire = ?
		ORDER BY priorite DESC, score_pertinence DESC
		LIMIT ?
	`

	rows, err := r.conn.Query(ctx, query, matricule, limit)
	if err != nil {
		return nil, fmt.Errorf("fetch recommendations: %w", err)
	}
	defer rows.Close()

	results := make([]Recommendation, 0)
	for rows.Next() {
		var item Recommendation
		if err := rows.Scan(
			&item.ID,
			&item.Matricule,
			&item.Type,
			&item.Titre,
			&item.Description,
			&item.Priorite,
			&item.ScorePertinence,
			&item.Statut,
			&item.DateEcheance,
		); err != nil {
			return nil, fmt.Errorf("scan recommendation: %w", err)
		}
		results = append(results, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate recommendations: %w", err)
	}

	return results, nil
}

// AnomalyRecord holds detailed anomaly data.
type AnomalyRecord struct {
	ID                string
	Type              string
	MatriculeConcerne string
	Description       string
	Severite          float64
	Statut            string
	ValeurDetectee    *float64
	SeuilConfigure    *float64
	EcartSeuil        *float64
	CreatedAt         time.Time
}

// FetchAnomalies returns anomalies with filters.
func (r *Repository) FetchAnomalies(ctx context.Context, startDate, endDate time.Time, limit uint64) ([]AnomalyRecord, error) {
	query := `
		SELECT
			id_anomalie,
			CAST(type_anomalie AS String) AS type_anomalie,
			matricule_concerne,
			description,
			score_severite,
			CAST(statut AS String) AS statut,
			valeur_detectee,
			seuil_configure,
			ecart_seuil,
			created_at
		FROM logs_anomalies
		WHERE created_at >= ? AND created_at <= ?
		ORDER BY score_severite DESC, created_at DESC
		LIMIT ?
	`

	rows, err := r.conn.Query(ctx, query, startDate, endDate, limit)
	if err != nil {
		return nil, fmt.Errorf("fetch anomalies: %w", err)
	}
	defer rows.Close()

	results := make([]AnomalyRecord, 0)
	for rows.Next() {
		var item AnomalyRecord
		if err := rows.Scan(
			&item.ID,
			&item.Type,
			&item.MatriculeConcerne,
			&item.Description,
			&item.Severite,
			&item.Statut,
			&item.ValeurDetectee,
			&item.SeuilConfigure,
			&item.EcartSeuil,
			&item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan anomaly: %w", err)
		}
		results = append(results, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate anomalies: %w", err)
	}

	return results, nil
}
