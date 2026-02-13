package domain

import "time"

// AnalyticsDataset mirrors the front-end AnalyticsDataset shape.
type AnalyticsDataset struct {
	KPIs                         []KpiMetric                 `json:"kpis"`
	CompetencyHeatmap            []CompetencyHeatmapCell     `json:"competencyHeatmap"`
	CompetencyFamilies           []string                    `json:"competencyFamilies"`
	Roles                        []string                    `json:"roles"`
	DemographicBySexe            []DemographicBreakdown      `json:"demographicBySexe"`
	DemographicByAge             []DemographicBreakdown      `json:"demographicByAge"`
	DemographicByAnciennete      []DemographicBreakdown      `json:"demographicByAnciennete"`
	PerformanceTrend             []PerformanceTrendPoint     `json:"performanceTrend"`
	CohortTrend                  []PerformanceTrendPoint     `json:"cohortTrend"`
	RolePerformance              []RolePerformancePoint      `json:"rolePerformance"`
	EvaluationChannelDistribution []ChannelDistribution      `json:"evaluationChannelDistribution"`
	EvaluationStatusDistribution []EvaluationStatusDistribution `json:"evaluationStatusDistribution"`
	BiasIndicators               []BiasIndicator             `json:"biasIndicators"`
	ScoreBySeniority             []ScoreSeniorityPoint       `json:"scoreBySeniority"`
	Alerts                       []AlertInsight              `json:"alerts"`
	TopUsers                     []UserAnalyticsSummary      `json:"topUsers"`
	RoleCompetencyInsights       []RoleCompetencyInsight     `json:"roleCompetencyInsights"`
}

// KpiMetric represents a KPI tile.
type KpiMetric struct {
	ID          string   `json:"id"`
	Label       string   `json:"label"`
	Value       float64  `json:"value"`
	Unit        string   `json:"unit,omitempty"`
	GlobalValue *float64 `json:"globalValue,omitempty"`
	Variation   *float64 `json:"variation,omitempty"`
	Description string   `json:"description,omitempty"`
}

// CompetencyHeatmapCell represents a competency gap cell.
type CompetencyHeatmapCell struct {
	Role   string  `json:"role"`
	Family string  `json:"family"`
	Score  float64 `json:"score"`
	Target float64 `json:"target"`
}

// DemographicBreakdown represents a demographic breakdown.
type DemographicBreakdown struct {
	Label      string  `json:"label"`
	Value      float64 `json:"value"`
	Comparison *float64 `json:"comparison,omitempty"`
}

// PerformanceTrendPoint represents a time series point.
type PerformanceTrendPoint struct {
	Period        string   `json:"period"`
	Score         float64  `json:"score"`
	Participation *float64 `json:"participation,omitempty"`
}

// AlertInsight represents an alert item.
type AlertInsight struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	Severity           string   `json:"severity"`
	Description        string   `json:"description"`
	ImpactedPopulation int      `json:"impactedPopulation"`
	SuggestedActions   []string `json:"suggestedActions"`
}

// RolePerformancePoint represents performance by role.
type RolePerformancePoint struct {
	Role          string   `json:"role"`
	Score         float64  `json:"score"`
	Participation *float64 `json:"participation,omitempty"`
}

// ChannelDistribution represents evaluation channel mix.
type ChannelDistribution struct {
	Channel string  `json:"channel"`
	Label   string  `json:"label"`
	Value   float64 `json:"value"`
}

// EvaluationStatusDistribution represents evaluation status mix.
type EvaluationStatusDistribution struct {
	Status       string  `json:"status"`
	Label        string  `json:"label"`
	FilteredCount float64 `json:"filteredCount"`
	GlobalCount  *float64 `json:"globalCount,omitempty"`
}

// BiasIndicator represents channel bias.
type BiasIndicator struct {
	Channel       string  `json:"channel"`
	AverageScore  float64 `json:"averageScore"`
	DeltaVsGlobal float64 `json:"deltaVsGlobal"`
}

// ScoreSeniorityPoint represents score by seniority bucket.
type ScoreSeniorityPoint struct {
	Bucket     string  `json:"bucket"`
	Score      float64 `json:"score"`
	Population int     `json:"population"`
}

// UserAnalyticsSummary represents a user summary.
type UserAnalyticsSummary struct {
	Matricule          string                         `json:"matricule"`
	Name               string                         `json:"name"`
	Role               string                         `json:"role"`
	Region             string                         `json:"region"`
	Sexe               string                         `json:"sexe,omitempty"`
	Age                *int                           `json:"age,omitempty"`
	Anciennete         *int                           `json:"anciennete,omitempty"`
	LatestScore        float64                        `json:"latestScore"`
	ScoreTrend         []float64                      `json:"scoreTrend"`
	Competencies       []UserCompetencySummary        `json:"competencies"`
	EvaluationBreakdown map[string]float64            `json:"evaluationBreakdown"`
	Recommendations    []string                       `json:"recommendations"`
}

// UserCompetencySummary represents a competency summary for a user.
type UserCompetencySummary struct {
	Family string  `json:"family"`
	Score  float64 `json:"score"`
	Target float64 `json:"target"`
}

// RoleCompetencyInsight represents a competency insight by role.
type RoleCompetencyInsight struct {
	Role                     string                         `json:"role"`
	AcquisitionThresholdScore float64                       `json:"acquisitionThresholdScore"`
	Matrix                   RoleCompetencyMatrix           `json:"matrix"`
	Population               *int                           `json:"population,omitempty"`
	Competencies             []CompetencySummary            `json:"competencies,omitempty"`
	AcquisitionDistribution  []AcquisitionDistributionSegment `json:"acquisitionDistribution,omitempty"`
	TopCompetencies          []CompetencySummary            `json:"topCompetencies,omitempty"`
	BottomCompetencies       []CompetencySummary            `json:"bottomCompetencies,omitempty"`
	OverallAcquisitionRate   *float64                       `json:"overallAcquisitionRate,omitempty"`
	OverallAverageScore      *float64                       `json:"overallAverageScore,omitempty"`
}

// CompetencySummary represents a competency summary.
type CompetencySummary struct {
	ID             string  `json:"id"`
	Label          string  `json:"label"`
	AcquisitionRate float64 `json:"acquisitionRate"`
	AverageScore   float64 `json:"averageScore"`
}

// AcquisitionDistributionSegment represents acquisition distribution.
type AcquisitionDistributionSegment struct {
	Bracket    string  `json:"bracket"`
	Percentage float64 `json:"percentage"`
	Count      int     `json:"count"`
}

// RoleCompetencyMatrix holds matrix data.
type RoleCompetencyMatrix struct {
	Competencies []RoleCompetencyMatrixCompetency `json:"competencies"`
	Individuals  []RoleCompetencyMatrixIndividual `json:"individuals"`
}

// RoleCompetencyMatrixCompetency represents a competency inside a matrix.
type RoleCompetencyMatrixCompetency struct {
	ID            string   `json:"id"`
	Label         string   `json:"label"`
	RequiredLevel *float64 `json:"requiredLevel,omitempty"`
	Weight        *float64 `json:"weight,omitempty"`
}

// RoleCompetencyMatrixIndividual represents an individual row inside the matrix.
type RoleCompetencyMatrixIndividual struct {
	ID              string             `json:"id"`
	Name            string             `json:"name"`
	Region          string             `json:"region,omitempty"`
	Sexe            string             `json:"sexe,omitempty"`
	Age             *int               `json:"age,omitempty"`
	Anciennete      *int               `json:"anciennete,omitempty"`
	Scores          map[string]float64 `json:"scores"`
	AcquisitionRate *float64           `json:"acquisitionRate,omitempty"`
	AverageScore    *float64           `json:"averageScore,omitempty"`
}

// =============================================================================
// Additional types for extended API endpoints
// =============================================================================

// AnomalyDetail represents detailed anomaly data.
type AnomalyDetail struct {
	ID                string    `json:"id"`
	Type              string    `json:"type"`
	Title             string    `json:"title"`
	MatriculeConcerne string    `json:"matriculeConcerne"`
	Description       string    `json:"description"`
	Severity          string    `json:"severity"`
	Statut            string    `json:"statut"`
	ValeurDetectee    *float64  `json:"valeurDetectee,omitempty"`
	SeuilConfigure    *float64  `json:"seuilConfigure,omitempty"`
	EcartSeuil        *float64  `json:"ecartSeuil,omitempty"`
	SuggestedActions  []string  `json:"suggestedActions"`
	CreatedAt         time.Time `json:"createdAt"`
}

// UserScoreDetail represents detailed score data for a user.
type UserScoreDetail struct {
	Matricule     string   `json:"matricule"`
	Periode       string   `json:"periode"`
	ScoreGlobal   float64  `json:"scoreGlobal"`
	ScoreAuto     *float64 `json:"scoreAuto,omitempty"`
	ScorePairs    *float64 `json:"scorePairs,omitempty"`
	ScoreManager  *float64 `json:"scoreManager,omitempty"`
	Progression   *float64 `json:"progression,omitempty"`
	NbEvaluations uint32   `json:"nbEvaluations"`
	StatutCalcul  string   `json:"statutCalcul"`
}

// RecommendationDetail represents detailed recommendation data.
type RecommendationDetail struct {
	ID              string     `json:"id"`
	Type            string     `json:"type"`
	Titre           string     `json:"titre"`
	Description     string     `json:"description"`
	Priorite        string     `json:"priorite"`
	ScorePertinence float64    `json:"scorePertinence"`
	Statut          string     `json:"statut"`
	DateEcheance    *time.Time `json:"dateEcheance,omitempty"`
}

// RegionalPerformanceDetail represents regional performance data.
type RegionalPerformanceDetail struct {
	RegionID          string   `json:"regionId"`
	RegionNom         string   `json:"regionNom"`
	EstTaniere        bool     `json:"estTaniere"`
	ScoreMoyen        float64  `json:"scoreMoyen"`
	NombreEvaluations uint32   `json:"nombreEvaluations"`
	Progression       *float64 `json:"progression,omitempty"`
}

// ChannelsResponse wraps channel distribution with bias indicators.
type ChannelsResponse struct {
	Distribution   []ChannelDistribution `json:"distribution"`
	BiasIndicators []BiasIndicator       `json:"biasIndicators"`
}
