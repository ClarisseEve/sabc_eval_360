import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/Services/api';
import { useAdminAnomaliesTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { AnomaliesTableSection, AnomalySummarySection } from '@/Components/Dashboard/Admin/Sections/AnomaliesSections';

const AnomaliesTab: React.FC = () => {
  const { data, refetch, isFetching } = useAdminAnomaliesTabData();
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const filteredRows = React.useMemo(() => {
    if (activeFilter === 'all') return data.rows;
    return data.rows.filter((row: any) => row.severite === activeFilter);
  }, [activeFilter, data.rows]);

  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => analyticsApi.acknowledgeAnomalie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'tab', 'anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'anomalies', 'badge'] });
    },
  });

  const runDetectionMutation = useMutation({
    mutationFn: () => analyticsApi.runAnomalyDetection(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'tab', 'anomalies'] });
    },
  });

  return (
    <div className="space-y-6">
      <AnomalySummarySection
        total={data.total}
        severityStats={data.severityStats}
        rows={data.rows}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <AnomaliesTableSection
        rows={filteredRows}
        totalRows={data.rows}
        activeFilter={activeFilter}
        onRefresh={refetch}
        isFetching={isFetching}
        onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
        acknowledgeLoading={acknowledgeMutation.isPending ? acknowledgeMutation.variables ?? null : null}
        onRunDetection={() => runDetectionMutation.mutate()}
        isRunningDetection={runDetectionMutation.isPending}
      />
    </div>
  );
};

export default AnomaliesTab;
