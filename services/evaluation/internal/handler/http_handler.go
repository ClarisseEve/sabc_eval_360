package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sabc/evaluation-service/internal/domain"
	"github.com/sabc/evaluation-service/internal/repository"
	"github.com/sabc/evaluation-service/internal/service"
	"go.uber.org/zap"
)

// HTTPHandler handles HTTP REST API requests
type HTTPHandler struct {
	evalService *service.EvaluationService
	logger      *zap.Logger
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(evalService *service.EvaluationService, logger *zap.Logger) *HTTPHandler {
	return &HTTPHandler{
		evalService: evalService,
		logger:      logger,
	}
}

// RegisterRoutes registers all HTTP routes
func (h *HTTPHandler) RegisterRoutes(r *gin.Engine) {
	// Health check
	r.GET("/health", h.Health)

	// API v2 routes
	v2 := r.Group("/api/v2")
	{
		// Evaluations
		evaluations := v2.Group("/evaluations")
		{
			evaluations.GET("", h.ListEvaluations)
			evaluations.POST("", h.CreateEvaluation)
			evaluations.GET("/pending", h.GetPendingEvaluations)
			evaluations.GET("/to-validate", h.GetEvaluationsToValidate)
			evaluations.GET("/:id", h.GetEvaluation)
			evaluations.PUT("/:id", h.UpdateNotes)
			evaluations.POST("/:id/submit", h.SubmitEvaluation)
			evaluations.POST("/:id/validate", h.ValidateEvaluation)
		}

		// Periods
		periodes := v2.Group("/periodes")
		{
			periodes.GET("", h.ListPeriodes)
			periodes.GET("/:id", h.GetPeriode)
		}

		// Scores
		scores := v2.Group("/scores")
		{
			scores.GET("/:matricule", h.GetUserScore)
		}
	}
}

// =============================================================================
// Response Helpers
// =============================================================================

type response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
}

type errorResponse struct {
	Success bool `json:"success"`
	Error   struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func successResponse(c *gin.Context, status int, data interface{}) {
	c.JSON(status, response{
		Success: true,
		Data:    data,
	})
}

func successResponseWithMeta(c *gin.Context, data interface{}, meta interface{}) {
	c.JSON(http.StatusOK, response{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

func errorResponseJSON(c *gin.Context, status int, code, message string) {
	resp := errorResponse{Success: false}
	resp.Error.Code = code
	resp.Error.Message = message
	c.JSON(status, resp)
}

// =============================================================================
// Health Check
// =============================================================================

// Health godoc
// @Summary Health check
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func (h *HTTPHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "evaluation-service",
		"version": "2.0.0",
	})
}

// =============================================================================
// Evaluations
// =============================================================================

// CreateEvaluationRequest represents the create evaluation request body
type CreateEvaluationRequest struct {
	EvalueMatricule string `json:"evalue_matricule" binding:"required"`
	IDPeriode       string `json:"id_periode" binding:"required,uuid"`
	IDRegle         string `json:"id_regle" binding:"required,uuid"`
}

// CreateEvaluation godoc
// @Summary Create a new evaluation
// @Tags evaluations
// @Accept json
// @Produce json
// @Param body body CreateEvaluationRequest true "Create evaluation request"
// @Success 201 {object} response
// @Failure 400 {object} errorResponse
// @Failure 403 {object} errorResponse
// @Router /api/v2/evaluations [post]
func (h *HTTPHandler) CreateEvaluation(c *gin.Context) {
	var req CreateEvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	// Get user from context (set by auth middleware)
	userMatricule := c.GetString("user_matricule")
	userRole := c.GetString("user_role")
	evalueRole := c.GetString("evalue_role") // This would need to be fetched

	idPeriode, _ := uuid.Parse(req.IDPeriode)
	idRegle, _ := uuid.Parse(req.IDRegle)

	input := service.CreateEvaluationInput{
		EvaluateurMatricule: userMatricule,
		EvalueMatricule:     req.EvalueMatricule,
		RoleEvaluateur:      userRole,
		RoleEvalue:          evalueRole,
		IDPeriode:           idPeriode,
		IDRegle:             idRegle,
	}

	eval, err := h.evalService.CreateEvaluation(c.Request.Context(), input)
	if err != nil {
		switch err {
		case service.ErrPeriodeNotActive:
			errorResponseJSON(c, http.StatusBadRequest, "PERIODE_NOT_ACTIVE", "La période d'évaluation n'est pas active")
		case service.ErrPermissionDenied:
			errorResponseJSON(c, http.StatusForbidden, "PERMISSION_DENIED", "Vous n'êtes pas autorisé à créer cette évaluation")
		default:
			h.logger.Error("create evaluation failed", zap.Error(err))
			errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur lors de la création")
		}
		return
	}

	successResponse(c, http.StatusCreated, eval)
}

// GetEvaluation godoc
// @Summary Get evaluation by ID
// @Tags evaluations
// @Produce json
// @Param id path string true "Evaluation ID"
// @Success 200 {object} response
// @Failure 404 {object} errorResponse
// @Router /api/v2/evaluations/{id} [get]
func (h *HTTPHandler) GetEvaluation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_ID", "ID invalide")
		return
	}

	eval, err := h.evalService.GetEvaluation(c.Request.Context(), id)
	if err != nil {
		if err == service.ErrEvaluationNotFound {
			errorResponseJSON(c, http.StatusNotFound, "NOT_FOUND", "Évaluation non trouvée")
			return
		}
		h.logger.Error("get evaluation failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	successResponse(c, http.StatusOK, eval)
}

// ListEvaluations godoc
// @Summary List evaluations
// @Tags evaluations
// @Produce json
// @Param statut query string false "Filter by status"
// @Param type_evaluation query string false "Filter by type"
// @Param id_periode query string false "Filter by period"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} response
// @Router /api/v2/evaluations [get]
func (h *HTTPHandler) ListEvaluations(c *gin.Context) {
	userMatricule := c.GetString("user_matricule")

	filters := repository.EvaluationFilters{
		Limit:  20,
		Offset: 0,
	}

	if statut := c.Query("statut"); statut != "" {
		s := domain.Statut(statut)
		filters.Statut = &s
	}

	if typeEval := c.Query("type_evaluation"); typeEval != "" {
		t := domain.TypeEvaluation(typeEval)
		filters.TypeEvaluation = &t
	}

	if idPeriode := c.Query("id_periode"); idPeriode != "" {
		if id, err := uuid.Parse(idPeriode); err == nil {
			filters.IDPeriode = &id
		}
	}

	evaluations, err := h.evalService.GetUserEvaluations(c.Request.Context(), userMatricule, filters)
	if err != nil {
		h.logger.Error("list evaluations failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	meta := map[string]interface{}{
		"total":    len(evaluations),
		"limit":    filters.Limit,
		"offset":   filters.Offset,
		"has_more": len(evaluations) >= filters.Limit,
	}

	successResponseWithMeta(c, evaluations, meta)
}

// UpdateNotesRequest represents the update notes request body
type UpdateNotesRequest struct {
	Notes              domain.NotesJSON `json:"notes" binding:"required"`
	CommentaireGeneral string           `json:"commentaire_general"`
}

// UpdateNotes godoc
// @Summary Update evaluation notes
// @Tags evaluations
// @Accept json
// @Produce json
// @Param id path string true "Evaluation ID"
// @Param body body UpdateNotesRequest true "Update notes request"
// @Success 200 {object} response
// @Failure 400 {object} errorResponse
// @Failure 403 {object} errorResponse
// @Router /api/v2/evaluations/{id} [put]
func (h *HTTPHandler) UpdateNotes(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_ID", "ID invalide")
		return
	}

	var req UpdateNotesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	userMatricule := c.GetString("user_matricule")

	input := service.UpdateNotesInput{
		ID:                 id,
		Notes:              req.Notes,
		CommentaireGeneral: req.CommentaireGeneral,
		UserMatricule:      userMatricule,
	}

	eval, err := h.evalService.UpdateNotes(c.Request.Context(), input)
	if err != nil {
		switch err {
		case service.ErrEvaluationNotFound:
			errorResponseJSON(c, http.StatusNotFound, "NOT_FOUND", "Évaluation non trouvée")
		case service.ErrPermissionDenied:
			errorResponseJSON(c, http.StatusForbidden, "PERMISSION_DENIED", "Vous n'êtes pas autorisé à modifier cette évaluation")
		case domain.ErrEvaluationNotDraft:
			errorResponseJSON(c, http.StatusBadRequest, "NOT_DRAFT", "Seules les évaluations en brouillon peuvent être modifiées")
		default:
			h.logger.Error("update notes failed", zap.Error(err))
			errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		}
		return
	}

	successResponse(c, http.StatusOK, eval)
}

// SubmitEvaluation godoc
// @Summary Submit evaluation for validation
// @Tags evaluations
// @Produce json
// @Param id path string true "Evaluation ID"
// @Success 200 {object} response
// @Failure 400 {object} errorResponse
// @Failure 403 {object} errorResponse
// @Router /api/v2/evaluations/{id}/submit [post]
func (h *HTTPHandler) SubmitEvaluation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_ID", "ID invalide")
		return
	}

	userMatricule := c.GetString("user_matricule")

	eval, err := h.evalService.SubmitEvaluation(c.Request.Context(), id, userMatricule)
	if err != nil {
		switch err {
		case service.ErrEvaluationNotFound:
			errorResponseJSON(c, http.StatusNotFound, "NOT_FOUND", "Évaluation non trouvée")
		case service.ErrPermissionDenied:
			errorResponseJSON(c, http.StatusForbidden, "PERMISSION_DENIED", "Vous n'êtes pas autorisé à soumettre cette évaluation")
		case domain.ErrEvaluationNotDraft:
			errorResponseJSON(c, http.StatusBadRequest, "NOT_DRAFT", "L'évaluation n'est pas en brouillon")
		case domain.ErrIncompleteNotes:
			errorResponseJSON(c, http.StatusBadRequest, "INCOMPLETE_NOTES", "Tous les critères doivent être notés entre 1 et 5")
		case domain.ErrMissingComment:
			errorResponseJSON(c, http.StatusBadRequest, "MISSING_COMMENT", "Un commentaire est requis pour les notes inférieures à 3")
		case domain.ErrEvaluationTooOld:
			errorResponseJSON(c, http.StatusBadRequest, "TOO_OLD", "L'évaluation ne peut plus être soumise après 30 jours")
		default:
			h.logger.Error("submit evaluation failed", zap.Error(err))
			errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		}
		return
	}

	successResponse(c, http.StatusOK, eval)
}

// ValidateEvaluationRequest represents the validate request body
type ValidateEvaluationRequest struct {
	EstValide   bool   `json:"est_valide"`
	Commentaire string `json:"commentaire"`
}

// ValidateEvaluation godoc
// @Summary Validate or reject evaluation
// @Tags evaluations
// @Accept json
// @Produce json
// @Param id path string true "Evaluation ID"
// @Param body body ValidateEvaluationRequest true "Validate request"
// @Success 200 {object} response
// @Failure 400 {object} errorResponse
// @Failure 403 {object} errorResponse
// @Router /api/v2/evaluations/{id}/validate [post]
func (h *HTTPHandler) ValidateEvaluation(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_ID", "ID invalide")
		return
	}

	var req ValidateEvaluationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_REQUEST", err.Error())
		return
	}

	validateurMatricule := c.GetString("user_matricule")

	input := service.ValidateEvaluationInput{
		ID:                  id,
		ValidateurMatricule: validateurMatricule,
		EstValide:           req.EstValide,
		Commentaire:         req.Commentaire,
	}

	eval, err := h.evalService.ValidateEvaluation(c.Request.Context(), input)
	if err != nil {
		switch err {
		case service.ErrEvaluationNotFound:
			errorResponseJSON(c, http.StatusNotFound, "NOT_FOUND", "Évaluation non trouvée")
		case domain.ErrEvaluationNotSubmitted:
			errorResponseJSON(c, http.StatusBadRequest, "NOT_SUBMITTED", "L'évaluation doit être soumise pour validation")
		case domain.ErrInvalidValidator:
			errorResponseJSON(c, http.StatusForbidden, "INVALID_VALIDATOR", "Vous ne pouvez pas valider votre propre évaluation")
		default:
			h.logger.Error("validate evaluation failed", zap.Error(err))
			errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		}
		return
	}

	successResponse(c, http.StatusOK, eval)
}

// GetPendingEvaluations godoc
// @Summary Get pending evaluations to complete
// @Tags evaluations
// @Produce json
// @Success 200 {object} response
// @Router /api/v2/evaluations/pending [get]
func (h *HTTPHandler) GetPendingEvaluations(c *gin.Context) {
	userMatricule := c.GetString("user_matricule")

	evaluations, err := h.evalService.GetEvaluationsToComplete(c.Request.Context(), userMatricule)
	if err != nil {
		h.logger.Error("get pending evaluations failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	successResponse(c, http.StatusOK, evaluations)
}

// GetEvaluationsToValidate godoc
// @Summary Get evaluations awaiting validation
// @Tags evaluations
// @Produce json
// @Success 200 {object} response
// @Router /api/v2/evaluations/to-validate [get]
func (h *HTTPHandler) GetEvaluationsToValidate(c *gin.Context) {
	managerMatricule := c.GetString("user_matricule")

	evaluations, err := h.evalService.GetEvaluationsToValidate(c.Request.Context(), managerMatricule)
	if err != nil {
		h.logger.Error("get evaluations to validate failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	successResponse(c, http.StatusOK, evaluations)
}

// =============================================================================
// Periods
// =============================================================================

// ListPeriodes godoc
// @Summary List evaluation periods
// @Tags periodes
// @Produce json
// @Param active_only query bool false "Filter active only" default(true)
// @Success 200 {object} response
// @Router /api/v2/periodes [get]
func (h *HTTPHandler) ListPeriodes(c *gin.Context) {
	periodes, err := h.evalService.GetActivePeriodes(c.Request.Context())
	if err != nil {
		h.logger.Error("list periodes failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	successResponse(c, http.StatusOK, periodes)
}

// GetPeriode godoc
// @Summary Get period by ID
// @Tags periodes
// @Produce json
// @Param id path string true "Period ID"
// @Success 200 {object} response
// @Failure 404 {object} errorResponse
// @Router /api/v2/periodes/{id} [get]
func (h *HTTPHandler) GetPeriode(c *gin.Context) {
	// Implementation would call periode service
	errorResponseJSON(c, http.StatusNotImplemented, "NOT_IMPLEMENTED", "À implémenter")
}

// =============================================================================
// Scores
// =============================================================================

// GetUserScore godoc
// @Summary Get user scores
// @Tags scores
// @Produce json
// @Param matricule path string true "User matricule"
// @Param id_periode query string false "Period ID"
// @Success 200 {object} response
// @Failure 404 {object} errorResponse
// @Router /api/v2/scores/{matricule} [get]
func (h *HTTPHandler) GetUserScore(c *gin.Context) {
	matricule := c.Param("matricule")
	idPeriodeStr := c.Query("id_periode")

	if idPeriodeStr == "" {
		errorResponseJSON(c, http.StatusBadRequest, "MISSING_PERIODE", "L'ID de période est requis")
		return
	}

	idPeriode, err := uuid.Parse(idPeriodeStr)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_PERIODE", "ID de période invalide")
		return
	}

	score, err := h.evalService.GetUserScore(c.Request.Context(), matricule, idPeriode)
	if err != nil {
		h.logger.Error("get user score failed", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Erreur interne")
		return
	}

	if score == nil {
		errorResponseJSON(c, http.StatusNotFound, "NOT_FOUND", "Score non trouvé")
		return
	}

	successResponse(c, http.StatusOK, score)
}
