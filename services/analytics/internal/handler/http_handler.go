package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sabc/analytics-service/internal/middleware"
	"github.com/sabc/analytics-service/internal/service"
	"go.uber.org/zap"
)

// HTTPHandler handles HTTP API requests.
type HTTPHandler struct {
	analyticsService *service.AnalyticsService
	logger           *zap.Logger
	serviceKey       string
}

// NewHTTPHandler creates a new HTTP handler.
func NewHTTPHandler(analyticsService *service.AnalyticsService, logger *zap.Logger, serviceKey string) *HTTPHandler {
	return &HTTPHandler{
		analyticsService: analyticsService,
		logger:           logger,
		serviceKey:       serviceKey,
	}
}

// RegisterRoutes registers HTTP routes.
func (h *HTTPHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/health", h.Health)

	v2 := r.Group("/api/v2")
	if h.serviceKey != "" {
		v2.Use(middleware.InternalServiceAuth(h.serviceKey))
	}

	analytics := v2.Group("/analytics")
	{
		analytics.GET("", h.GetDataset)
		analytics.GET("/kpis", h.GetKpis)
		analytics.GET("/channels", h.GetChannels)
		analytics.GET("/trends", h.GetTrends)
		analytics.GET("/anomalies", h.GetAnomalies)
		analytics.GET("/regional", h.GetRegionalPerformance)
		analytics.GET("/scores/:matricule", h.GetUserScore)
		analytics.GET("/recommendations/:matricule", h.GetRecommendations)
	}
}

// =============================================================================
// Response helpers
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
	c.JSON(status, response{Success: true, Data: data})
}

func errorResponseJSON(c *gin.Context, status int, code, message string) {
	resp := errorResponse{Success: false}
	resp.Error.Code = code
	resp.Error.Message = message
	c.JSON(status, resp)
}

// =============================================================================
// Health
// =============================================================================

// Health returns service status.
func (h *HTTPHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "analytics-service",
		"version": "2.0.0",
	})
}

// =============================================================================
// Analytics
// =============================================================================

// GetDataset returns the analytics dataset.
func (h *HTTPHandler) GetDataset(c *gin.Context) {
	period := c.DefaultQuery("period", "last_6_months")
	startDate, err := parseDate(c.Query("start_date"))
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_START_DATE", err.Error())
		return
	}

	endDate, err := parseDate(c.Query("end_date"))
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_END_DATE", err.Error())
		return
	}

	dataset, err := h.analyticsService.GetDataset(c.Request.Context(), service.Filters{
		Period:    period,
		StartDate: startDate,
		EndDate:   endDate,
	})
	if err != nil {
		h.logger.Error("failed to build analytics dataset", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to build analytics dataset")
		return
	}

	successResponse(c, http.StatusOK, dataset)
}

func parseDate(raw string) (*time.Time, error) {
	if raw == "" {
		return nil, nil
	}

	parsed, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return nil, err
	}

	return &parsed, nil
}

// parseFilters extracts common filters from the request.
func (h *HTTPHandler) parseFilters(c *gin.Context) (service.Filters, error) {
	period := c.DefaultQuery("period", "last_6_months")

	startDate, err := parseDate(c.Query("start_date"))
	if err != nil {
		return service.Filters{}, err
	}

	endDate, err := parseDate(c.Query("end_date"))
	if err != nil {
		return service.Filters{}, err
	}

	return service.Filters{
		Period:    period,
		StartDate: startDate,
		EndDate:   endDate,
	}, nil
}

// =============================================================================
// KPIs
// =============================================================================

// GetKpis returns KPI metrics only.
func (h *HTTPHandler) GetKpis(c *gin.Context) {
	filters, err := h.parseFilters(c)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_FILTERS", err.Error())
		return
	}

	kpis, err := h.analyticsService.GetKpis(c.Request.Context(), filters)
	if err != nil {
		h.logger.Error("failed to fetch KPIs", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch KPIs")
		return
	}

	successResponse(c, http.StatusOK, kpis)
}

// =============================================================================
// Channels
// =============================================================================

// GetChannels returns channel distribution and bias indicators.
func (h *HTTPHandler) GetChannels(c *gin.Context) {
	filters, err := h.parseFilters(c)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_FILTERS", err.Error())
		return
	}

	distribution, biasIndicators, err := h.analyticsService.GetChannels(c.Request.Context(), filters)
	if err != nil {
		h.logger.Error("failed to fetch channels", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch channels")
		return
	}

	successResponse(c, http.StatusOK, gin.H{
		"distribution":   distribution,
		"biasIndicators": biasIndicators,
	})
}

// =============================================================================
// Trends
// =============================================================================

// GetTrends returns performance trends.
func (h *HTTPHandler) GetTrends(c *gin.Context) {
	filters, err := h.parseFilters(c)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_FILTERS", err.Error())
		return
	}

	trends, err := h.analyticsService.GetTrends(c.Request.Context(), filters)
	if err != nil {
		h.logger.Error("failed to fetch trends", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch trends")
		return
	}

	successResponse(c, http.StatusOK, trends)
}

// =============================================================================
// Anomalies
// =============================================================================

// GetAnomalies returns detected anomalies.
func (h *HTTPHandler) GetAnomalies(c *gin.Context) {
	filters, err := h.parseFilters(c)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_FILTERS", err.Error())
		return
	}

	anomalies, err := h.analyticsService.GetAnomalies(c.Request.Context(), filters)
	if err != nil {
		h.logger.Error("failed to fetch anomalies", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch anomalies")
		return
	}

	successResponse(c, http.StatusOK, anomalies)
}

// =============================================================================
// Regional Performance
// =============================================================================

// GetRegionalPerformance returns performance by region.
func (h *HTTPHandler) GetRegionalPerformance(c *gin.Context) {
	filters, err := h.parseFilters(c)
	if err != nil {
		errorResponseJSON(c, http.StatusBadRequest, "INVALID_FILTERS", err.Error())
		return
	}

	regions, err := h.analyticsService.GetRegionalPerformance(c.Request.Context(), filters)
	if err != nil {
		h.logger.Error("failed to fetch regional performance", zap.Error(err))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch regional performance")
		return
	}

	successResponse(c, http.StatusOK, regions)
}

// =============================================================================
// User Score
// =============================================================================

// GetUserScore returns score for a specific user.
func (h *HTTPHandler) GetUserScore(c *gin.Context) {
	matricule := c.Param("matricule")
	if matricule == "" {
		errorResponseJSON(c, http.StatusBadRequest, "MISSING_MATRICULE", "Matricule is required")
		return
	}

	periode := c.Query("periode")
	var periodePtr *string
	if periode != "" {
		periodePtr = &periode
	}

	score, err := h.analyticsService.GetUserScore(c.Request.Context(), matricule, periodePtr)
	if err != nil {
		h.logger.Error("failed to fetch user score", zap.Error(err), zap.String("matricule", matricule))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch user score")
		return
	}

	successResponse(c, http.StatusOK, score)
}

// =============================================================================
// Recommendations
// =============================================================================

// GetRecommendations returns recommendations for a user.
func (h *HTTPHandler) GetRecommendations(c *gin.Context) {
	matricule := c.Param("matricule")
	if matricule == "" {
		errorResponseJSON(c, http.StatusBadRequest, "MISSING_MATRICULE", "Matricule is required")
		return
	}

	recommendations, err := h.analyticsService.GetRecommendations(c.Request.Context(), matricule)
	if err != nil {
		h.logger.Error("failed to fetch recommendations", zap.Error(err), zap.String("matricule", matricule))
		errorResponseJSON(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch recommendations")
		return
	}

	successResponse(c, http.StatusOK, recommendations)
}
