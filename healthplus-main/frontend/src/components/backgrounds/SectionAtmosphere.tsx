import React from 'react';
import {
  LivingAtmosphere,
  type LivingAtmosphereVariant,
} from './LivingAtmosphere';

export type AtmosphereVariant = LivingAtmosphereVariant;

export interface SectionAtmosphereProps {
  variant?: AtmosphereVariant;
  className?: string;
}

export const SectionAtmosphere: React.FC<SectionAtmosphereProps> = ({
  variant = 'default',
  className = '',
}) => {
  return <LivingAtmosphere variant={variant} fixed={false} className={className} />;
};
