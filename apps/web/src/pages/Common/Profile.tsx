import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CommonProfileRedirect() {
  return <Navigate to="/settings/profile" replace />;
}
