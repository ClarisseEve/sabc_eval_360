import React from 'react';
import { useAdminRegionsTabData } from '@/Hooks/queries/useAdminDashboardTabs';
import {
  InterRegionComparisonSection,
  RegionSelectionSection,
  RegionalRankingSection,
} from '@/Components/Dashboard/Admin/Sections/RegionsSections';

export default function RegionsTab() {
  const [selectedRegion, setSelectedRegion] = React.useState('');
  const { regions, interRegionData, selectedRegionStats, regionClassement } = useAdminRegionsTabData(selectedRegion);

  React.useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      setSelectedRegion(String(regions[0].id_region));
    }
  }, [regions, selectedRegion]);
  const distribution = regionClassement?.distribution || {};

  return (
    <div className="space-y-6">
      <RegionSelectionSection
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        regions={regions}
        stats={selectedRegionStats}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <InterRegionComparisonSection data={interRegionData} />
        <RegionalRankingSection
          totalEvaluated={regionClassement?.total_evalues ?? 0}
          regionAverage={regionClassement?.moyenne_region}
          distribution={distribution}
        />
      </div>
    </div>
  );
}
