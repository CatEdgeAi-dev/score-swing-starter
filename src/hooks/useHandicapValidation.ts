/**
 * Custom hook for managing handicap validation logic in flights
 * Handles peer validation, status tracking, and validation submissions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface ValidationData {
  validatorUserId: string;
  validatedUserId: string;
  claimedHandicap?: number;
  validationStatus: 'pending' | 'approved' | 'questioned';
  validationNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationSummary {
  approved: number;
  questioned: number;
  total: number;
  receivedValidations: ValidationData[];
}

interface UseHandicapValidationOptions {
  flightId?: string;
  currentUserId?: string;
}

export const useHandicapValidation = ({ 
  flightId, 
  currentUserId 
}: UseHandicapValidationOptions) => {
  const { toast } = useToast();
  const [validations, setValidations] = useState<ValidationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load existing validations for the flight
   */
  const loadValidations = useCallback(async () => {
    if (!flightId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('flight_handicap_validations')
        .select('*')
        .eq('flight_id', flightId);

      if (error) throw error;

      const validationData: ValidationData[] = data.map(v => ({
        validatorUserId: v.validator_user_id,
        validatedUserId: v.validated_user_id,
        ...(v.claimed_handicap !== null ? { claimedHandicap: v.claimed_handicap as number } : {}),
        validationStatus: v.validation_status as 'pending' | 'approved' | 'questioned',
        ...(v.validation_notes !== null ? { validationNotes: v.validation_notes as string } : {}),
        ...(v.created_at ? { createdAt: v.created_at as string } : {}),
        ...(v.updated_at ? { updatedAt: v.updated_at as string } : {}),
      }));

      setValidations(validationData);
      logger.debug('Loaded validations', { count: validationData.length });
    } catch (error) {
      logger.error('Failed to load validations', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load validation data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [flightId, toast]);

  /**
   * Submit a validation for a player's handicap
   */
  const submitValidation = useCallback(async (
    validatedUserId: string,
    claimedHandicap: number,
    status: 'approved' | 'questioned',
    notes?: string
  ) => {
    if (!flightId || !currentUserId) return false;

    setIsSubmitting(true);
    try {
      const validationData = {
        flight_id: flightId,
        validator_user_id: currentUserId,
        validated_user_id: validatedUserId,
        claimed_handicap: claimedHandicap,
        validation_status: status,
        validation_notes: notes || null
      };

      const { error } = await supabase
        .from('flight_handicap_validations')
        .upsert(validationData, {
          onConflict: 'flight_id,validator_user_id,validated_user_id'
        });

      if (error) throw error;

      logger.info('Validation submitted', { 
        validatedUserId, 
        status, 
        validatorId: currentUserId 
      });

      // Reload validations to get updated data
      await loadValidations();
      
      return true;
    } catch (error) {
      logger.error('Failed to submit validation', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit validation. Please try again.",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [flightId, currentUserId, loadValidations, toast]);

  /**
   * Get validation status for a specific player from current user's perspective
   */
  const getValidationStatus = useCallback((playerId: string): ValidationData | null => {
    if (!currentUserId) return null;
    
    return validations.find(v => 
      v.validatorUserId === currentUserId && 
      v.validatedUserId === playerId
    ) || null;
  }, [validations, currentUserId]);

  /**
   * Get validation summary for a player (how many validations they've received)
   */
  const getPlayerValidationSummary = useCallback((
    playerId: string, 
    totalPlayers: number
  ): ValidationSummary => {
    const receivedValidations = validations.filter(v => 
      v.validatedUserId === playerId
    );
    
    const approved = receivedValidations.filter(v => 
      v.validationStatus === 'approved'
    ).length;
    
    const questioned = receivedValidations.filter(v => 
      v.validationStatus === 'questioned'
    ).length;
    
    const total = Math.max(0, totalPlayers - 1); // Exclude self

    return { 
      approved, 
      questioned, 
      total, 
      receivedValidations 
    };
  }, [validations]);

  /**
   * Check if all players have received sufficient validations
   */
  const areAllPlayersValidated = useCallback((
    playerIds: string[], 
    requiredValidations: number = 1
  ): boolean => {
    return playerIds.every(playerId => {
      const summary = getPlayerValidationSummary(playerId, playerIds.length);
      return summary.approved >= requiredValidations;
    });
  }, [getPlayerValidationSummary]);

  /**
   * Set up real-time subscription for validation updates
   */
  useEffect(() => {
    if (!flightId) return;

    const channel = supabase
      .channel(`validations-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_handicap_validations',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          logger.debug('Real-time validation update', { 
            event: payload.eventType 
          });
          loadValidations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, loadValidations]);

  // Load validations on mount
  useEffect(() => {
    loadValidations();
  }, [loadValidations]);

  return {
    validations,
    isLoading,
    isSubmitting,
    submitValidation,
    getValidationStatus,
    getPlayerValidationSummary,
    areAllPlayersValidated,
    loadValidations
  };
};