import React from 'react';
import type { ExerciseTypeId } from '@/types/wellness';
import { KinematicHuman3D } from './KinematicHuman3D';

interface AnatomicalAthleteVisualProps {
  exerciseType: ExerciseTypeId;
  isActive: boolean;
  className?: string;
}

export const AnatomicalAthleteVisual: React.FC<AnatomicalAthleteVisualProps> = ({
  exerciseType,
  isActive,
  className = '',
}) => {
  return (
    <KinematicHuman3D
      exerciseType={exerciseType}
      isActive={isActive}
      className={className}
    />
  );
};
