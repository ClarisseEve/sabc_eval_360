package domain

import (
	"time"

	"github.com/google/uuid"
)

// ScoreUtilisateur represents aggregated user scores
type ScoreUtilisateur struct {
	Matricule              string    `json:"matricule"`
	IDPeriode              uuid.UUID `json:"id_periode"`
	ScoreAuto              *float64  `json:"score_auto,omitempty"`
	ScoreAutoEvaluation    *float64  `json:"score_auto_evaluation,omitempty"`
	ScorePairs             *float64  `json:"score_pairs,omitempty"`
	ScoreManager           *float64  `json:"score_manager,omitempty"`
	ScoreGlobal            *float64  `json:"score_global,omitempty"`
	ProgressionVsPrecedente *float64 `json:"progression_vs_precedente,omitempty"`
	NbEvaluationsRecues    int       `json:"nb_evaluations_recues"`
	NbEvaluationsDonnees   int       `json:"nb_evaluations_donnees"`
	PositionEquipe         *int      `json:"position_equipe,omitempty"`
	DerniereMaj            time.Time `json:"derniere_maj"`
}

// Score weights for SABC
const (
	WeightAuto    = 0.20
	WeightPairs   = 0.40
	WeightManager = 0.40
)

// CalculateGlobalScore computes the weighted global score
// Formula: 20% auto + 40% pairs + 40% manager
func (s *ScoreUtilisateur) CalculateGlobalScore() {
	var total float64
	var weightSum float64

	if s.ScoreAuto != nil {
		total += *s.ScoreAuto * WeightAuto
		weightSum += WeightAuto
	}

	if s.ScorePairs != nil {
		total += *s.ScorePairs * WeightPairs
		weightSum += WeightPairs
	}

	if s.ScoreManager != nil {
		total += *s.ScoreManager * WeightManager
		weightSum += WeightManager
	}

	if weightSum > 0 {
		score := total / weightSum * (WeightAuto + WeightPairs + WeightManager)
		s.ScoreGlobal = &score
	}

	s.DerniereMaj = time.Now()
}

// IsComplete checks if all required scores are present
func (s *ScoreUtilisateur) IsComplete() bool {
	return s.ScoreManager != nil
}

// GetEvolution calculates score evolution vs previous period
func (s *ScoreUtilisateur) GetEvolution(previousScore *float64) {
	if s.ScoreGlobal != nil && previousScore != nil {
		evolution := *s.ScoreGlobal - *previousScore
		s.ProgressionVsPrecedente = &evolution
	}
}

// ScoreAggregation holds intermediate score calculations
type ScoreAggregation struct {
	TypeEvaluation TypeEvaluation
	TotalScore     float64
	Count          int
}

// GetAverage returns the average score for an aggregation
func (a *ScoreAggregation) GetAverage() float64 {
	if a.Count == 0 {
		return 0
	}
	return a.TotalScore / float64(a.Count)
}

// ScoreCalculator handles score aggregation logic
type ScoreCalculator struct {
	aggregations map[TypeEvaluation]*ScoreAggregation
}

// NewScoreCalculator creates a new score calculator
func NewScoreCalculator() *ScoreCalculator {
	return &ScoreCalculator{
		aggregations: make(map[TypeEvaluation]*ScoreAggregation),
	}
}

// AddEvaluation adds an evaluation score to the calculator
func (c *ScoreCalculator) AddEvaluation(eval *Evaluation) {
	if eval.ScoreGlobal == nil || eval.Statut != StatutValide {
		return
	}

	agg, exists := c.aggregations[eval.TypeEvaluation]
	if !exists {
		agg = &ScoreAggregation{TypeEvaluation: eval.TypeEvaluation}
		c.aggregations[eval.TypeEvaluation] = agg
	}

	agg.TotalScore += *eval.ScoreGlobal
	agg.Count++
}

// CalculateUserScore computes the final user score
func (c *ScoreCalculator) CalculateUserScore(matricule string, idPeriode uuid.UUID) *ScoreUtilisateur {
	score := &ScoreUtilisateur{
		Matricule: matricule,
		IDPeriode: idPeriode,
	}

	// Auto-evaluation score
	if agg, exists := c.aggregations[TypeAuto]; exists && agg.Count > 0 {
		avg := agg.GetAverage()
		score.ScoreAuto = &avg
		score.ScoreAutoEvaluation = &avg
	}

	// Peer scores (average of all peer evaluations)
	if agg, exists := c.aggregations[TypePairs]; exists && agg.Count > 0 {
		avg := agg.GetAverage()
		score.ScorePairs = &avg
	}

	// Manager score (descendante evaluation)
	if agg, exists := c.aggregations[TypeDescendante]; exists && agg.Count > 0 {
		avg := agg.GetAverage()
		score.ScoreManager = &avg
	}

	// Count total evaluations received
	for _, agg := range c.aggregations {
		score.NbEvaluationsRecues += agg.Count
	}

	// Calculate global score
	score.CalculateGlobalScore()

	return score
}
