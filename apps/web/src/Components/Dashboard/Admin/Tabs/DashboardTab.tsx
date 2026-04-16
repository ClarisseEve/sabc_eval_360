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

export default function DashboardTab() {
  const { data } = useAdminOverviewTabData();

  return (
    <div className="space-y-6">
      <AdminOverviewMetricsSection
        totalEvaluations={data.totalEvaluations}
        uniqueUsers={data.uniqueUsers}
        averageScore={data.averageScore}
        completionRate={data.completionRate}
        validatedEvaluations={data.validatedEvaluations}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <PerformanceTrendSection trendData={data.trendData} />
        <StatusDistributionSection statusData={data.statusData} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChannelBreakdownSection channelData={data.channelData} />
        <RegionalActivitySection regionData={data.regionData} />
      </div>

      <TopRolesSection topRoles={data.topRoles} />
    </div>
  );
}
