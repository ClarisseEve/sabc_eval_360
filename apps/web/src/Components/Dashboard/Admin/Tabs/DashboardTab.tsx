import React from 'react';
import { useAdminOverviewTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import {
  AdminOverviewMetricsSection,
  ChannelBreakdownSection,
  PerformanceTrendSection,
  RegionalActivitySection,
  StatusDistributionSection,
  TopRolesSection,
} from '@/Components/Dashboard/Admin/Sections/OverviewSections';

export default function DashboardTab({ dateRange }: { dateRange?: { start_date?: string; end_date?: string } }) {
  const { data } = useAdminOverviewTabData(dateRange);

  return (
    <div className="space-y-6">
      <div data-dashboard-export-section>
      <AdminOverviewMetricsSection
        totalEvaluations={data.totalEvaluations}
        uniqueUsers={data.uniqueUsers}
        averageScore={data.averageScore}
        completionRate={data.completionRate}
        validatedEvaluations={data.validatedEvaluations}
      />
      </div>

      <div data-dashboard-export-section className="grid gap-5 xl:grid-cols-3">
        <PerformanceTrendSection trendData={data.trendData} />
        <StatusDistributionSection statusData={data.statusData} />
      </div>

      <div data-dashboard-export-section className="grid gap-5 xl:grid-cols-2">
        <ChannelBreakdownSection channelData={data.channelData} />
        <RegionalActivitySection regionData={data.regionData} />
      </div>

      <div data-dashboard-export-section>
        <TopRolesSection topRoles={data.topRoles} dateRange={dateRange} />
      </div>
    </div>
  );
}
