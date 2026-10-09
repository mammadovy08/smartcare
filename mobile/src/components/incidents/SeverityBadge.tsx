import React from 'react';
import { Badge } from '../common/Badge';
import { Severity } from '@/types';
import { getSeverityColor, getSeverityLabel } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';

export interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  variant?: 'solid' | 'subtle' | 'outline';
  showIcon?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  variant = 'subtle',
  showIcon = true,
}) => {
  const color = getSeverityColor(severity);
  const label = getSeverityLabel(severity);

  const getIcon = () => {
    if (!showIcon) return undefined;
    switch (severity) {
      case 'high':
        return <Ionicons name="alert-circle" size={size === 'sm' ? 12 : 14} color={variant === 'solid' ? '#FFFFFF' : color} />;
      case 'medium':
        return <Ionicons name="warning" size={size === 'sm' ? 12 : 14} color={variant === 'solid' ? '#FFFFFF' : color} />;
      case 'device-warning':
        return <Ionicons name="hardware-chip-outline" size={size === 'sm' ? 12 : 14} color={variant === 'solid' ? '#FFFFFF' : color} />;
      default:
        return <Ionicons name="information-circle" size={size === 'sm' ? 12 : 14} color={variant === 'solid' ? '#FFFFFF' : color} />;
    }
  };

  return (
    <Badge
      label={label}
      color={color}
      size={size}
      variant={variant}
      icon={getIcon()}
    />
  );
};
