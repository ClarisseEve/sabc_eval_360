package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// StatutPeriode represents the period status
type StatutPeriode string

const (
	StatutPeriodePlanifiee StatutPeriode = "planifiee"
	StatutPeriodeOuverte   StatutPeriode = "ouverte"
	StatutPeriodeFermee    StatutPeriode = "fermee"
	StatutPeriodeArchivee  StatutPeriode = "archivee"
)

// PeriodeEvaluation represents an evaluation period
type PeriodeEvaluation struct {
	ID                      uuid.UUID     `json:"id_periode"`
	CodePeriode             string        `json:"code_periode"`
	NomPeriode              string        `json:"nom_periode"`
	Titre                   string        `json:"titre"`
	Description             string        `json:"description"`
	DateDebut               time.Time     `json:"date_debut"`
	DateFin                 time.Time     `json:"date_fin"`
	Statut                  StatutPeriode `json:"statut"`
	IDRegle                 *uuid.UUID    `json:"id_regle,omitempty"`
	EstOuverte              bool          `json:"est_ouverte"`
	EstCloturee             bool          `json:"est_cloturee"`
	NbEvaluationsAttendues  int           `json:"nb_evaluations_attendues"`
	NbEvaluationsCompletees int           `json:"nb_evaluations_completees"`
	TauxCompletion          float64       `json:"taux_completion"`
	DureeRappelsJours       int           `json:"duree_rappels_jours"`
	NbMaxRappels            int           `json:"nb_max_rappels"`
	EscaladeAutomatique     bool          `json:"escalade_automatique"`
	CreatedAt               time.Time     `json:"created_at"`
	UpdatedAt               time.Time     `json:"updated_at"`
}

// Period errors
var (
	ErrPeriodNotActive   = errors.New("evaluation period is not active")
	ErrPeriodClosed      = errors.New("evaluation period is closed")
	ErrPeriodNotStarted  = errors.New("evaluation period has not started")
	ErrPeriodEnded       = errors.New("evaluation period has ended")
)

// IsActive checks if the period is currently active for evaluations
func (p *PeriodeEvaluation) IsActive() bool {
	now := time.Now()
	return p.Statut == StatutPeriodeOuverte &&
		p.EstOuverte &&
		!p.EstCloturee &&
		now.After(p.DateDebut) &&
		now.Before(p.DateFin)
}

// IsEnded checks if the period has ended
func (p *PeriodeEvaluation) IsEnded() bool {
	return p.EstCloturee || time.Now().After(p.DateFin)
}

// CanCreateEvaluation validates if a new evaluation can be created
func (p *PeriodeEvaluation) CanCreateEvaluation() error {
	now := time.Now()

	if p.Statut != StatutPeriodeOuverte {
		return ErrPeriodNotActive
	}

	if p.EstCloturee {
		return ErrPeriodClosed
	}

	if now.Before(p.DateDebut) {
		return ErrPeriodNotStarted
	}

	if now.After(p.DateFin) {
		return ErrPeriodEnded
	}

	return nil
}

// GetCompletionRate calculates the completion percentage
func (p *PeriodeEvaluation) GetCompletionRate() float64 {
	if p.NbEvaluationsAttendues == 0 {
		return 0
	}
	return float64(p.NbEvaluationsCompletees) / float64(p.NbEvaluationsAttendues) * 100
}

// DaysRemaining returns the number of days until the period ends
func (p *PeriodeEvaluation) DaysRemaining() int {
	remaining := time.Until(p.DateFin)
	if remaining < 0 {
		return 0
	}
	return int(remaining.Hours() / 24)
}

// ShouldSendReminder checks if a reminder should be sent
func (p *PeriodeEvaluation) ShouldSendReminder() bool {
	return p.IsActive() &&
		p.DaysRemaining() <= p.DureeRappelsJours &&
		p.GetCompletionRate() < 100
}
