package service

import (
	"context"
	"math"
	"strings"
	"time"

	"github.com/sabc/analytics-service/internal/domain"
	chrepo "github.com/sabc/analytics-service/internal/repository/clickhouse"
	"go.uber.org/zap"
)

type AnalyticsService struct {
	repo   *chrepo.Repository
	logger *zap.Logger
}

// Filters represents query filters for analytics.
type Filters struct {
	Period    string
	StartDate *time.Time
	EndDate   *time.Time
}

// NewAnalyticsService creates a new AnalyticsService.
func NewAnalyticsService(repo *chrepo.Repository, logger *zap.Logger) *AnalyticsService {
	return &AnalyticsService{repo: repo, logger: logger}
}

// GetDataset builds the analytics dataset.
func (s *AnalyticsService) GetDataset(ctx context.Context, filters Filters) (domain.AnalyticsDataset, error) {
	startDate, endDate := resolveDateRange(filters)

	globalStats, err := s.repo.FetchGlobalStats(ctx, startDate, endDate)
	if err != nil {
		return domain.AnalyticsDataset{}, err
	}

	channelStats, err := s.repo.FetchChannelStats(ctx, startDate, endDate)
	if err != nil {
		return domain.AnalyticsDataset{}, err
	}

	trendPoints, err := s.repo.FetchTrend(ctx, startDate, endDate)
	if err != nil {
		return domain.AnalyticsDataset{}, err
	}

	alerts, err := s.repo.FetchAlerts(ctx, 5)
	if err != nil {
		s.logger.Warn("alerts query failed", zap.Error(err))
	}

	kpis := buildKpis(globalStats)
	channelDistribution, biasIndicators := buildChannelInsights(channelStats, globalStats.AverageScore)
	performanceTrend := buildPerformanceTrend(trendPoints)
	alertInsights := buildAlertInsights(alerts)

	return domain.AnalyticsDataset{
		KPIs:                          kpis,
		CompetencyHeatmap:             []domain.CompetencyHeatmapCell{},
		CompetencyFamilies:            []string{},
		Roles:                         []string{},
		DemographicBySexe:             []domain.DemographicBreakdown{},
		DemographicByAge:              []domain.DemographicBreakdown{},
		DemographicByAnciennete:       []domain.DemographicBreakdown{},
		PerformanceTrend:              performanceTrend,
		CohortTrend:                   []domain.PerformanceTrendPoint{},
		RolePerformance:               []domain.RolePerformancePoint{},
		EvaluationChannelDistribution: channelDistribution,
		EvaluationStatusDistribution:  []domain.EvaluationStatusDistribution{},
		BiasIndicators:                biasIndicators,
		ScoreBySeniority:              []domain.ScoreSeniorityPoint{},
		Alerts:                        alertInsights,
		TopUsers:                      []domain.UserAnalyticsSummary{},
		RoleCompetencyInsights:        []domain.RoleCompetencyInsight{},
	}, nil
}

func resolveDateRange(filters Filters) (time.Time, time.Time) {
	now := time.Now()
	endDate := now
	if filters.EndDate != nil {
		endDate = *filters.EndDate
	}

	if filters.StartDate != nil {
		return *filters.StartDate, endDate
	}

	switch filters.Period {
	case "last_3_months":
		return now.AddDate(0, -3, 0), endDate
	case "last_6_months", "":
		return now.AddDate(0, -6, 0), endDate
	case "last_12_months":
		return now.AddDate(0, -12, 0), endDate
	case "year_to_date":
		start := time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, now.Location())
		return start, endDate
	default:
		return now.AddDate(0, -6, 0), endDate
	}
}

func buildKpis(stats chrepo.GlobalStats) []domain.KpiMetric {
	return []domain.KpiMetric{
		{
			ID:          "avg_score",
			Label:       "Score moyen",
			Value:       roundFloat(stats.AverageScore, 2),
			Unit:        "/5",
			Description: "Score moyen calcule sur la periode",
		},
		{
			ID:    "total_evaluations",
			Label: "Evaluations",
			Value: float64(stats.TotalEvaluations),
		},
		{
			ID:    "unique_users",
			Label: "Collaborateurs evalues",
			Value: float64(stats.UniqueUsers),
		},
	}
}

func buildChannelInsights(stats []chrepo.ChannelStats, globalAvg float64) ([]domain.ChannelDistribution, []domain.BiasIndicator) {
	total := uint64(0)
	channelTotals := map[string]uint64{}
	channelScoreSum := map[string]float64{}

	for _, item := range stats {
		channel := normalizeChannel(item.Channel)
		if channel == "" {
			continue
		}
		channelTotals[channel] += item.Total
		channelScoreSum[channel] += item.AverageScore * float64(item.Total)
		total += item.Total
	}

	distribution := make([]domain.ChannelDistribution, 0)
	biasIndicators := make([]domain.BiasIndicator, 0)

	for _, channel := range []string{"auto", "pairs", "descendante"} {
		channelTotal := channelTotals[channel]
		if channelTotal == 0 {
			continue
		}
		percentage := 0.0
		if total > 0 {
			percentage = float64(channelTotal) / float64(total) * 100
		}
		distribution = append(distribution, domain.ChannelDistribution{
			Channel: channel,
			Label:   channelLabel(channel),
			Value:   roundFloat(percentage, 1),
		})

		avgScore := 0.0
		if channelTotal > 0 {
			avgScore = channelScoreSum[channel] / float64(channelTotal)
		}
		biasIndicators = append(biasIndicators, domain.BiasIndicator{
			Channel:       channel,
			AverageScore:  roundFloat(avgScore, 2),
			DeltaVsGlobal: roundFloat(avgScore-globalAvg, 2),
		})
	}

	return distribution, biasIndicators
}

func buildPerformanceTrend(points []chrepo.TrendPoint) []domain.PerformanceTrendPoint {
	if len(points) == 0 {
		return []domain.PerformanceTrendPoint{}
	}

	maxTotal := uint64(0)
	for _, point := range points {
		if point.TotalEvaluations > maxTotal {
			maxTotal = point.TotalEvaluations
		}
	}

	trend := make([]domain.PerformanceTrendPoint, 0, len(points))
	for _, point := range points {
		var participation *float64
		if maxTotal > 0 {
			value := float64(point.TotalEvaluations) / float64(maxTotal) * 100
			value = roundFloat(value, 1)
			participation = &value
		}

		trend = append(trend, domain.PerformanceTrendPoint{
			Period:        point.Period.Format("2006-01"),
			Score:         roundFloat(point.AverageScore, 2),
			Participation: participation,
		})
	}

	return trend
}

func buildAlertInsights(alerts []chrepo.AlertRecord) []domain.AlertInsight {
	if len(alerts) == 0 {
		return []domain.AlertInsight{}
	}

	insights := make([]domain.AlertInsight, 0, len(alerts))
	for _, alert := range alerts {
		severity := mapSeverity(alert.Severity)
		insights = append(insights, domain.AlertInsight{
			ID:                 alert.ID,
			Title:              alertTitle(alert.Type),
			Severity:           severity,
			Description:        alert.Description,
			ImpactedPopulation: 0,
			SuggestedActions:   suggestedActions(alert.Type),
		})
	}

	return insights
}

func normalizeChannel(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	switch value {
	case "auto", "pairs", "descendante":
		return value
	case "manager", "descendant", "desc":
		return "descendante"
	default:
		return ""
	}
}

func channelLabel(channel string) string {
	switch channel {
	case "auto":
		return "Auto-evaluations"
	case "pairs":
		return "Pairs"
	case "descendante":
		return "Descendantes"
	default:
		return channel
	}
}

func mapSeverity(score float64) string {
	switch {
	case score >= 7:
		return "high"
	case score >= 4:
		return "medium"
	default:
		return "low"
	}
}

func alertTitle(anomalyType string) string {
	switch anomalyType {
	case "divergence_auto_autres":
		return "Divergence auto vs pairs/descendante"
	case "baisse_performance":
		return "Baisse de performance"
	case "uniformite_evaluations":
		return "Uniformite des evaluations"
	case "biais_evaluateur":
		return "Biais evaluateur"
	case "evaluation_tardive":
		return "Evaluation tardive"
	case "score_incoherent":
		return "Score incoherent"
	default:
		return "Anomalie detectee"
	}
}

func suggestedActions(anomalyType string) []string {
	switch anomalyType {
	case "divergence_auto_autres":
		return []string{
			"Planifier un entretien de calibration",
			"Comparer les attentes par role",
		}
	case "baisse_performance":
		return []string{
			"Analyser les changements de contexte",
			"Proposer un accompagnement cible",
		}
	default:
		return []string{
			"Analyser les causes racines",
			"Partager les recommandations au manager",
		}
	}
}

func roundFloat(value float64, decimals int) float64 {
	factor := math.Pow(10, float64(decimals))
	return math.Round(value*factor) / factor
}

// GetKpis returns only KPI metrics.
func (s *AnalyticsService) GetKpis(ctx context.Context, filters Filters) ([]domain.KpiMetric, error) {
	startDate, endDate := resolveDateRange(filters)

	globalStats, err := s.repo.FetchGlobalStats(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	return buildKpis(globalStats), nil
}

// GetChannels returns channel distribution data.
func (s *AnalyticsService) GetChannels(ctx context.Context, filters Filters) ([]domain.ChannelDistribution, []domain.BiasIndicator, error) {
	startDate, endDate := resolveDateRange(filters)

	globalStats, err := s.repo.FetchGlobalStats(ctx, startDate, endDate)
	if err != nil {
		return nil, nil, err
	}

	channelStats, err := s.repo.FetchChannelStats(ctx, startDate, endDate)
	if err != nil {
		return nil, nil, err
	}

	distribution, biasIndicators := buildChannelInsights(channelStats, globalStats.AverageScore)
	return distribution, biasIndicators, nil
}

// GetTrends returns performance trend data.
func (s *AnalyticsService) GetTrends(ctx context.Context, filters Filters) ([]domain.PerformanceTrendPoint, error) {
	startDate, endDate := resolveDateRange(filters)

	trendPoints, err := s.repo.FetchTrend(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	return buildPerformanceTrend(trendPoints), nil
}

// GetAnomalies returns detected anomalies.
func (s *AnalyticsService) GetAnomalies(ctx context.Context, filters Filters) ([]domain.AnomalyDetail, error) {
	startDate, endDate := resolveDateRange(filters)

	anomalies, err := s.repo.FetchAnomalies(ctx, startDate, endDate, 50)
	if err != nil {
		return nil, err
	}

	results := make([]domain.AnomalyDetail, 0, len(anomalies))
	for _, a := range anomalies {
		results = append(results, domain.AnomalyDetail{
			ID:                a.ID,
			Type:              a.Type,
			Title:             alertTitle(a.Type),
			MatriculeConcerne: a.MatriculeConcerne,
			Description:       a.Description,
			Severity:          mapSeverity(a.Severite),
			Statut:            a.Statut,
			ValeurDetectee:    a.ValeurDetectee,
			SeuilConfigure:    a.SeuilConfigure,
			EcartSeuil:        a.EcartSeuil,
			SuggestedActions:  suggestedActions(a.Type),
			CreatedAt:         a.CreatedAt,
		})
	}

	return results, nil
}

// GetUserScore returns score for a specific user.
func (s *AnalyticsService) GetUserScore(ctx context.Context, matricule string, periode *string) (*domain.UserScoreDetail, error) {
	score, err := s.repo.FetchUserScore(ctx, matricule, periode)
	if err != nil {
		return nil, err
	}

	return &domain.UserScoreDetail{
		Matricule:     score.Matricule,
		Periode:       score.Periode,
		ScoreGlobal:   roundFloat(score.ScoreGlobal, 2),
		ScoreAuto:     ptrRoundFloat(score.ScoreAuto, 2),
		ScorePairs:    ptrRoundFloat(score.ScorePairs, 2),
		ScoreManager:  ptrRoundFloat(score.ScoreManager, 2),
		Progression:   ptrRoundFloat(score.Progression, 2),
		NbEvaluations: score.NbEvaluations,
		StatutCalcul:  score.StatutCalcul,
	}, nil
}

// GetRecommendations returns recommendations for a user.
func (s *AnalyticsService) GetRecommendations(ctx context.Context, matricule string) ([]domain.RecommendationDetail, error) {
	recs, err := s.repo.FetchRecommendations(ctx, matricule, 10)
	if err != nil {
		return nil, err
	}

	results := make([]domain.RecommendationDetail, 0, len(recs))
	for _, r := range recs {
		results = append(results, domain.RecommendationDetail{
			ID:              r.ID,
			Type:            r.Type,
			Titre:           r.Titre,
			Description:     r.Description,
			Priorite:        r.Priorite,
			ScorePertinence: roundFloat(r.ScorePertinence, 2),
			Statut:          r.Statut,
			DateEcheance:    r.DateEcheance,
		})
	}

	return results, nil
}

// GetRegionalPerformance returns performance by region.
func (s *AnalyticsService) GetRegionalPerformance(ctx context.Context, filters Filters) ([]domain.RegionalPerformanceDetail, error) {
	startDate, endDate := resolveDateRange(filters)

	regions, err := s.repo.FetchRegionalPerformance(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	results := make([]domain.RegionalPerformanceDetail, 0, len(regions))
	for _, r := range regions {
		results = append(results, domain.RegionalPerformanceDetail{
			RegionID:          r.RegionID,
			RegionNom:         r.RegionNom,
			EstTaniere:        r.EstTaniere,
			ScoreMoyen:        roundFloat(r.ScoreMoyen, 2),
			NombreEvaluations: r.NombreEvaluations,
			Progression:       ptrRoundFloat(r.Progression, 2),
		})
	}

	return results, nil
}

func ptrRoundFloat(value *float64, decimals int) *float64 {
	if value == nil {
		return nil
	}
	v := roundFloat(*value, decimals)
	return &v
}
