package domain

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Statut represents the evaluation status
type Statut string

const (
	StatutBrouillon Statut = "brouillon"
	StatutSoumis    Statut = "soumis"
	StatutValide    Statut = "valide"
	StatutRejete    Statut = "rejete"
)

// TypeEvaluation represents the type of evaluation
type TypeEvaluation string

const (
	TypeAuto        TypeEvaluation = "auto"
	TypeDescendante TypeEvaluation = "descendante"
	TypePairs       TypeEvaluation = "pairs"
	TypeAscendante  TypeEvaluation = "ascendante"
	TypeAutre       TypeEvaluation = "autre"
)

// Note represents a single criterion score
type Note struct {
	CodeCritere   string  `json:"code_critere"`
	NomCritere    string  `json:"nom_critere"`
	Note          float64 `json:"note"`
	Ponderation   float64 `json:"ponderation"`
	Commentaire   string  `json:"commentaire,omitempty"`
	NoteMaximale  float64 `json:"note_maximale"`
}

// NotesJSON represents the complete evaluation scores
type NotesJSON struct {
	Criteres        []Note  `json:"criteres"`
	NoteMoyenne     float64 `json:"note_moyenne"`
	NoteGlobale     float64 `json:"note_globale"`
	DateCalcul      string  `json:"date_calcul"`
}

// Evaluation represents the core evaluation entity
type Evaluation struct {
	ID                   uuid.UUID       `json:"id_evaluation"`
	EvaluateurMatricule  string          `json:"evaluateur_matricule"`
	EvalueMatricule      string          `json:"evalue_matricule"`
	IDPeriode            uuid.UUID       `json:"id_periode"`
	IDRegle              uuid.UUID       `json:"id_regle"`
	DateEvaluation       time.Time       `json:"date_evaluation"`
	DateSoumission       *time.Time      `json:"date_soumission,omitempty"`
	DateValidation       *time.Time      `json:"date_validation,omitempty"`
	Statut               Statut          `json:"statut"`
	Notes                NotesJSON       `json:"notes_json"`
	CommentaireGeneral   string          `json:"commentaire_general"`
	CommentaireValidation string         `json:"commentaire_validation,omitempty"`
	ValidateurMatricule  *string         `json:"validateur_matricule,omitempty"`
	ScoreGlobal          *float64        `json:"score_global,omitempty"`
	TypeEvaluation       TypeEvaluation  `json:"type_evaluation"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

// NewEvaluation creates a new evaluation in draft status
func NewEvaluation(
	evaluateurMatricule string,
	evalueMatricule string,
	idPeriode uuid.UUID,
	idRegle uuid.UUID,
	typeEval TypeEvaluation,
) *Evaluation {
	now := time.Now()
	return &Evaluation{
		ID:                  uuid.New(),
		EvaluateurMatricule: evaluateurMatricule,
		EvalueMatricule:     evalueMatricule,
		IDPeriode:           idPeriode,
		IDRegle:             idRegle,
		DateEvaluation:      now,
		Statut:              StatutBrouillon,
		TypeEvaluation:      typeEval,
		Notes:               NotesJSON{Criteres: []Note{}},
		CreatedAt:           now,
		UpdatedAt:           now,
	}
}

// Validation errors
var (
	ErrEvaluationNotDraft     = errors.New("evaluation must be in draft status")
	ErrEvaluationNotSubmitted = errors.New("evaluation must be in submitted status")
	ErrIncompleteNotes        = errors.New("all criteria must be scored between 1 and 5")
	ErrMissingComment         = errors.New("comment required for scores below 3")
	ErrInvalidValidator       = errors.New("validator must be different from evaluator")
	ErrEvaluationTooOld       = errors.New("evaluation cannot be submitted after 30 days")
)

// CanBeSubmitted checks if the evaluation can be submitted
func (e *Evaluation) CanBeSubmitted() error {
	if e.Statut != StatutBrouillon {
		return ErrEvaluationNotDraft
	}

	// Check if within 30 days
	if time.Since(e.DateEvaluation) > 30*24*time.Hour {
		return ErrEvaluationTooOld
	}

	// Validate all criteria are scored
	for _, note := range e.Notes.Criteres {
		if note.Note < 1 || note.Note > 5 {
			return ErrIncompleteNotes
		}
		// Comment required for low scores
		if note.Note < 3 && note.Commentaire == "" {
			return ErrMissingComment
		}
	}

	return nil
}

// Submit transitions the evaluation to submitted status
func (e *Evaluation) Submit() error {
	if err := e.CanBeSubmitted(); err != nil {
		return err
	}

	now := time.Now()
	e.Statut = StatutSoumis
	e.DateSoumission = &now
	e.UpdatedAt = now
	e.calculateGlobalScore()
	return nil
}

// CanBeValidated checks if the evaluation can be validated
func (e *Evaluation) CanBeValidated(validateurMatricule string) error {
	if e.Statut != StatutSoumis {
		return ErrEvaluationNotSubmitted
	}

	if validateurMatricule == e.EvaluateurMatricule {
		return ErrInvalidValidator
	}

	return nil
}

// Validate approves the evaluation
func (e *Evaluation) Validate(validateurMatricule string, commentaire string) error {
	if err := e.CanBeValidated(validateurMatricule); err != nil {
		return err
	}

	now := time.Now()
	e.Statut = StatutValide
	e.DateValidation = &now
	e.ValidateurMatricule = &validateurMatricule
	e.CommentaireValidation = commentaire
	e.UpdatedAt = now
	return nil
}

// Reject returns the evaluation for corrections
func (e *Evaluation) Reject(validateurMatricule string, commentaire string) error {
	if err := e.CanBeValidated(validateurMatricule); err != nil {
		return err
	}

	now := time.Now()
	e.Statut = StatutRejete
	e.ValidateurMatricule = &validateurMatricule
	e.CommentaireValidation = commentaire
	e.UpdatedAt = now
	return nil
}

// UpdateNotes updates the evaluation notes
func (e *Evaluation) UpdateNotes(notes NotesJSON, commentaireGeneral string) error {
	if e.Statut != StatutBrouillon {
		return ErrEvaluationNotDraft
	}

	e.Notes = notes
	e.CommentaireGeneral = commentaireGeneral
	e.UpdatedAt = time.Now()
	e.calculateGlobalScore()
	return nil
}

// calculateGlobalScore computes the weighted average score
func (e *Evaluation) calculateGlobalScore() {
	if len(e.Notes.Criteres) == 0 {
		return
	}

	var totalPonderation float64
	var totalScore float64

	for _, note := range e.Notes.Criteres {
		totalPonderation += note.Ponderation
		totalScore += note.Note * note.Ponderation
	}

	if totalPonderation > 0 {
		moyenne := totalScore / totalPonderation
		e.Notes.NoteMoyenne = moyenne
		e.Notes.NoteGlobale = moyenne
		e.ScoreGlobal = &moyenne
	}

	e.Notes.DateCalcul = time.Now().Format(time.RFC3339)
}

// ToJSON converts notes to JSON bytes
func (n *NotesJSON) ToJSON() ([]byte, error) {
	return json.Marshal(n)
}

// FromJSON parses JSON bytes to notes
func (n *NotesJSON) FromJSON(data []byte) error {
	return json.Unmarshal(data, n)
}
