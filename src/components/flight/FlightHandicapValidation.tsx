import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ValidationData {
  validatorUserId: string;
  validatedUserId: string;
  claimedHandicap?: number;
  validationStatus: 'pending' | 'approved' | 'questioned';
  validationNotes?: string;
}

export const FlightHandicapValidation: React.FC = () => {
  const { currentFlight, validationStatuses } = useFlightContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [validations, setValidations] = useState<ValidationData[]>([]);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentFlight && user) {
      loadExistingValidations();
    }
  }, [currentFlight, user]);

  const loadExistingValidations = async () => {
    if (!currentFlight || !user) return;

    try {
      const { data, error } = await supabase
        .from('flight_handicap_validations')
        .select('*')
        .eq('flight_id', currentFlight.id);

      if (error) throw error;

      const validationData: ValidationData[] = data.map(v => ({
        validatorUserId: v.validator_user_id,
        validatedUserId: v.validated_user_id,
        claimedHandicap: v.claimed_handicap,
        validationStatus: v.validation_status as 'pending' | 'approved' | 'questioned',
        validationNotes: v.validation_notes
      }));

      setValidations(validationData);
    } catch (error) {
      console.error('Error loading validations:', error);
    }
  };

  const submitValidation = async (validatedPlayer: any, status: 'approved' | 'questioned') => {
    if (!currentFlight || !user) return;

    setIsSubmitting(true);
    try {
      const validationData = {
        flight_id: currentFlight.id,
        validator_user_id: user.id,
        validated_user_id: validatedPlayer.userId || validatedPlayer.id,
        claimed_handicap: validatedPlayer.handicap,
        validation_status: status,
        validation_notes: notes[validatedPlayer.id] || null
      };

      const { error } = await supabase
        .from('flight_handicap_validations')
        .upsert(validationData, {
          onConflict: 'flight_id,validator_user_id,validated_user_id'
        });

      if (error) throw error;

      toast({
        title: "Validation submitted",
        description: `You ${status} ${validatedPlayer.name}'s handicap.`,
      });

      await loadExistingValidations();
    } catch (error) {
      console.error('Error submitting validation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit validation. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationStatus = (playerId: string) => {
    if (!user) return null;
    return validations.find(v => 
      v.validatorUserId === user.id && 
      v.validatedUserId === (currentFlight?.players.find(p => p.id === playerId)?.userId || playerId)
    );
  };

  const getPlayerValidationSummary = (player: any) => {
    const receivedValidations = validations.filter(v => 
      v.validatedUserId === (player.userId || player.id)
    );
    const approved = receivedValidations.filter(v => v.validationStatus === 'approved').length;
    const questioned = receivedValidations.filter(v => v.validationStatus === 'questioned').length;
    const total = currentFlight ? currentFlight.players.length - 1 : 0; // Exclude self

    return { approved, questioned, total, receivedValidations };
  };

  if (!currentFlight || !user) {
    return null;
  }

  const currentUserPlayer = currentFlight.players.find(p => p.userId === user.id);
  const otherPlayers = currentFlight.players.filter(p => p.userId !== user.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Handicap Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Before starting your round, please validate each player's claimed handicap index. 
            This helps ensure fair play for everyone.
          </p>

          {currentUserPlayer && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="font-medium">Your Handicap: {currentUserPlayer.handicap ?? 'Not set'}</p>
              <p className="text-sm text-muted-foreground">
                Other players will validate your handicap
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Validate Other Players</h3>
            {otherPlayers.map((player) => {
              const validation = getValidationStatus(player.id);
              const summary = getPlayerValidationSummary(player);
              
              return (
                <Card key={player.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Claimed Handicap: {player.handicap ?? 'Not provided'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {summary.approved}/{summary.total} validated
                        </Badge>
                        {validation && (
                          <Badge 
                            variant={validation.validationStatus === 'approved' ? 'default' : 'destructive'}
                          >
                            {validation.validationStatus === 'approved' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {validation.validationStatus}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!validation && player.handicap !== undefined && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add notes about this handicap (optional)"
                          value={notes[player.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [player.id]: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => submitValidation(player, 'approved')}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Looks Good
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => submitValidation(player, 'questioned')}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Question This
                          </Button>
                        </div>
                      </div>
                    )}

                    {validation && validation.validationNotes && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm font-medium">Your notes:</p>
                        <p className="text-sm">{validation.validationNotes}</p>
                      </div>
                    )}

                    {player.handicap === undefined && (
                      <div className="text-center py-4">
                        <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Waiting for {player.name} to set their handicap
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};