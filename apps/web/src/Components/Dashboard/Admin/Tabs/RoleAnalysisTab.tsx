import React from 'react';
import { useAdminRoleAnalysisTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import {
  ChannelPerformanceSection,
  RoleAnalysisSummarySection,
  RoleCompletionChartSection,
  RoleDetailsTableSection,
  RoleScoreChartSection,
} from '@/Components/Dashboard/Admin/Sections/RoleAnalysisSections';

const RoleAnalysisTab: React.FC = () => {
  const { data } = useAdminRoleAnalysisTabData();

  return (
    <div className="space-y-6">
      <RoleAnalysisSummarySection
        roleCount={data.rolePerf.length}
        globalAverage={data.globalAvg}
        channelCount={data.channels.length}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <RoleScoreChartSection rows={data.sortedByScore} />
        <RoleCompletionChartSection rows={data.sortedByCompletion} />
      </div>

      <ChannelPerformanceSection channels={data.channels} />
      <RoleDetailsTableSection rows={data.sortedByScore} globalAverage={data.globalAvg} />
    </div>
  );
};

export default RoleAnalysisTab;
