import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CommonSettingsRedirect() {
  return <Navigate to="/settings/profile" replace />;
}
