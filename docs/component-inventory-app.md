# Component Inventory — App (UI)

## Overview

React/Inertia UI components are organized under `resources/js/Components` with supporting layout and pages.

## Component Categories

- **UI (core)**: 46 components (Button, Card, Badge, Table, Inputs, Charts, etc.)
- **Dashboard**: 14 components (role dashboards, stats, lists)
- **Analytics**: 9 components (filters, heatmaps, insights)
- **Evaluation**: 4 components (admin comparison, charts, editors)
- **Forms**: 2 components (EvaluationForm, RoleEvaluationForm)
- **Layout**: 7 components (AppLayout, Sidebar, Header, Auth layouts)
- **Auth**: 2 components (redirect, role guard)
- **Charts**: 3 components (performance line/bar, skills radar)

## Key Components

- **UI**: `UI/Button`, `UI/Card`, `UI/DataTable`, `UI/Badge`, `UI/Progress`, `UI/Charts/*`
- **Dashboards**: `Dashboard/DirectorDashboard`, `Dashboard/ManagerDashboard`, `Dashboard/Admin/Tabs/*`
- **Analytics**: `Analytics/AnalyticsKpiOverview`, `Analytics/CompetencyHeatmapSection`, `Analytics/AlertsRecommendationsSection`
- **Evaluation**: `Evaluation/Admin/SectionsCompetencesEditor`, `Evaluation/EvaluationModal`

## Supporting Layers

- **Contexts**: `AuthContext`, `NotificationContext`, `ThemeContext`
- **Hooks**: `useAuth`, `useDashboard`, `useEvaluations`, `useAnalytics`, `usePermissions`
- **Services (API)**: `resources/js/Services/{api}/*`

