import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Clock, Users, Shield, Lock } from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useHandicapValidation } from '@/hooks/useHandicapValidation';
import { supabase } from '@/integrations/supabase/client';
/**
 * FlightHandicapValidation Component
 * 
 * Handles the peer validation phase where players validate each other's
 * claimed handicap indexes. Features:
 * - Real-time validation status updates
 * - Notes for questioned handicaps
 * - Validation summary tracking
 * - Prevents self-validation
 */
export const FlightHandicapValidation: React.FC = () => {
  const { currentFlight } = useFlightContext();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selfHandicap, setSelfHandicap] = useState<string>('');
  const [isSavingSelf, setIsSavingSelf] = useState(false);
  
  const {
    validations,
    isLoading,
    isSubmitting,
    submitValidation,
    getValidationStatus,
    getPlayerValidationSummary
  } = useHandicapValidation({
    ...(currentFlight?.id ? { flightId: currentFlight.id } : {}),
    ...(user?.id ? { currentUserId: user.id } : {}),
  });

  /**
   * Handle validation submission with proper error handling
   */
  const handleValidationSubmit = async (
    player: any, 
    status: 'approved' | 'questioned'
  ) => {
    if (player.handicap === null || player.handicap === undefined || Number.isNaN(Number(player.handicap))) {
      toast({
        variant: "destructive",
        title: "Cannot Validate",
        description: "Player must set their handicap before validation.",
      });
      return;
    }

    const success = await submitValidation(
      player.userId || player.id,
      parseFloat(player.handicap),
      status,
      notes[player.id]
    );

    if (success) {
      // Clear notes after successful submission
      setNotes(prev => ({ ...prev, [player.id]: '' }));
      
      toast({
        title: "Validation Submitted",
        description: `You ${status} ${player.name}'s handicap.`,
      });
    }
  };

  const handleSelfHandicapSave = async () => {
    if (!currentFlight || !user) return;
    const me = currentFlight.players.find(p => p.userId === user.id);
    if (!me) return;

    const value = parseFloat(selfHandicap);
    if (Number.isNaN(value)) {
      toast({
        variant: "destructive",
        title: "Invalid handicap",
        description: "Please enter a valid number (e.g., 0.0, 12.3).",
      });
      return;
    }

    try {
      setIsSavingSelf(true);
      const { error } = await supabase
        .from('flight_players')
        .update({ handicap: value, handicap_locked: true })
        .eq('id', me.id);
      if (error) throw error;

      toast({
        title: "Handicap saved",
        description: "Your handicap was set and locked for this flight.",
      });
      setSelfHandicap('');
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save your handicap. Please try again.",
      });
    } finally {
      setIsSavingSelf(false);
    }
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
            <Shield className="h-5 w-5" />
            Peer Handicap Validation
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

          {currentUserPlayer && currentUserPlayer.handicap == null && (
            <div className="p-4 border rounded-lg bg-background/50">
              <Label htmlFor="self-handicap" className="text-sm mb-2 inline-block">
                Set your handicap for this flight
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="self-handicap"
                  type="text"
                  placeholder="0.0"
                  inputMode="decimal"
                  value={selfHandicap}
                  onChange={(e) => setSelfHandicap(e.target.value)}
                  className="w-24 text-center"
                />
                <Button
                  size="sm"
                  onClick={handleSelfHandicapSave}
                  disabled={isSavingSelf || selfHandicap.trim() === '' || Number.isNaN(parseFloat(selfHandicap))}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Save & Lock
                </Button>
              </div>
            </div>
          )}

           <div className="space-y-4">
            <h3 className="font-semibold">Validate Other Players</h3>
            {otherPlayers.map((player) => {
              const targetId = player.userId || player.id;
              const validation = getValidationStatus(targetId);
              const summary = getPlayerValidationSummary(
                targetId, 
                currentFlight.players.length
              );
              
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

                    {!validation && player.handicap != null && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add notes about this handicap (optional)"
                          value={notes[player.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [player.id]: e.target.value })}
                          className="min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleValidationSubmit(player, 'approved')}
                            disabled={isSubmitting || isLoading}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleValidationSubmit(player, 'questioned')}
                            disabled={isSubmitting || isLoading}
                            className="flex-1"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Question
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

                    {player.handicap == null && (
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