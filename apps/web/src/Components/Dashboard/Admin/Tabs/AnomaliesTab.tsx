import React from 'react';
import { useAdminAnomaliesTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import { AnomaliesTableSection, AnomalySummarySection } from '@/Components/Dashboard/Admin/Sections/AnomaliesSections';

const AnomaliesTab: React.FC = () => {
  const { data, refetch, isFetching } = useAdminAnomaliesTabData();
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const filteredRows = React.useMemo(() => {
    if (activeFilter === 'all') return data.rows;
    return data.rows.filter((row: any) => row.severite === activeFilter);
  }, [activeFilter, data.rows]);

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
      />
    </div>
  );
};

export default AnomaliesTab;
