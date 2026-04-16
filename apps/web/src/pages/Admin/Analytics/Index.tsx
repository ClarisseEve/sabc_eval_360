import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function resolveLegacyTab(pathname: string) {
  if (pathname.includes('/analytics/regions')) return 'regions';
  if (pathname.includes('/analytics/anomalies')) return 'anomalies';
  return 'overview';
}

export default function AdminAnalyticsRedirectPage() {
  const location = useLocation();
  const tab = resolveLegacyTab(location.pathname);

  return <Navigate to={`/admin/dashboard?tab=${tab}`} replace />;
}
