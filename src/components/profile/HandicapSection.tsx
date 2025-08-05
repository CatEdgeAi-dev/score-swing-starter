import React from 'react';
import { HandicapStatusDashboard } from '@/components/handicap/HandicapStatusDashboard';

interface HandicapSectionProps {
  userProfile?: {
    whs_index?: number;
    handicap_proof_url?: string;
    handicap_status?: string;
    handicap_submitted_at?: string;
    handicap_reviewed_at?: string;
    handicap_rejection_reason?: string;
    display_name?: string;
  };
  onUpdate?: () => void;
}

export const HandicapSection: React.FC<HandicapSectionProps> = ({ userProfile, onUpdate }) => {
  return (
    <HandicapStatusDashboard
      userProfile={userProfile}
      onUpdate={onUpdate}
    />
  );
};