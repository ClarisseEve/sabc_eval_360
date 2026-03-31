import React from 'react';

interface ProgressBarProps {
  value: number;
  min?: number;
  max?: number;
  className?: string;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  value,
  min = 0,
  max = 100,
  className = '',
  label,
  color = 'primary',
}: ProgressBarProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  // Utilisation des variables CSS SABC définies dans sabc-colors.css
  const colors = {
    primary: 'bg-sabc-primary',      // Rouge SABC principal
    success: 'bg-sabc-success',      // Vert succès
    warning: 'bg-sabc-warning',      // Jaune attention
    danger: 'bg-sabc-error',         // Rouge erreur
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="text-sm font-medium text-sabc-gray-800 mb-1">{label}</div>
      )}
      <div className="w-full bg-sabc-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-sabc-gray-400 mt-1">{Math.round(percentage)}%</div>
    </div>
  );
}
