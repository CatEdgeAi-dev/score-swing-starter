import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users, Target } from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const FlightHandicapSetup: React.FC = () => {
  const { currentFlight, setCurrentFlight, startValidation, leaveFlight } = useFlightContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [handicaps, setHandicaps] = useState<{ [playerId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentFlight && user) {
      // Load existing handicaps from database only once when flight changes
      loadFlightHandicaps();
      // Load user's current handicap from profile
      loadUserHandicap();
    }
  }, [currentFlight?.id, user?.id]); // Only depend on IDs to prevent infinite loops

  // Set up real-time subscription for handicap updates
  useEffect(() => {
    if (!currentFlight) return;

    const channel = supabase
      .channel('flight-handicaps')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flight_players',
          filter: `flight_id=eq.${currentFlight.id}`,
        },
        (payload) => {
          console.log('Real-time handicap update received:', payload);
          // Reload all handicaps to ensure all players see the latest state
          loadFlightHandicaps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentFlight]);

  const loadFlightHandicaps = async () => {
    if (!currentFlight) return;

    try {
      const { data: players, error } = await supabase
        .from('flight_players')
        .select('user_id, guest_name, handicap')
        .eq('flight_id', currentFlight.id);

      if (error) throw error;

      const handicapData: { [playerId: string]: string } = {};
      
      // Map database records to player IDs correctly
      // The players array comes from flight_players records, so we can match by the flight_players.id
      players.forEach(dbPlayer => {
        // Find the player in currentFlight that corresponds to this database record
        const player = currentFlight.players.find(p => p.userId === dbPlayer.user_id);
        
        if (player && dbPlayer.handicap !== null) {
          handicapData[player.id] = dbPlayer.handicap.toString();
        }
      });
      
      console.log('Loading handicaps from DB:', players);
      console.log('Mapped handicap data:', handicapData);
      console.log('Current flight players:', currentFlight.players);
      
      // Update state with database values - completely replace for consistency
      setHandicaps(handicapData);
    } catch (error) {
      console.error('Error loading flight handicaps:', error);
    }
  };

  const loadUserHandicap = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('whs_index')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.whs_index) {
        const currentUserPlayer = currentFlight?.players.find(p => p.userId === user.id);
        if (currentUserPlayer) {
          // Only set if not already set to avoid overwriting user input
          setHandicaps(prev => ({
            ...prev,
            [currentUserPlayer.id]: prev[currentUserPlayer.id] || data.whs_index.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user handicap:', error);
    }
  };

  const handleHandicapChange = async (playerId: string, handicap: string) => {
    // Allow only valid handicap values (0-54 with up to 1 decimal place)
    if (handicap === '' || /^\d{0,2}(\.\d{0,1})?$/.test(handicap)) {
      setHandicaps(prev => ({ ...prev, [playerId]: handicap }));
      
      // Find the player to get their userId
      const player = currentFlight.players.find(p => p.id === playerId);
      if (!player?.userId) {
        console.error('Player userId not found for player ID:', playerId);
        return;
      }
      
      console.log('Saving handicap for player:', player.name, 'userId:', player.userId, 'value:', handicap);
      
      // Save to database immediately using the correct user_id
      try {
        const handicapValue = handicap === '' ? null : parseFloat(handicap);
        
        const { error } = await supabase
          .from('flight_players')
          .update({ handicap: handicapValue })
          .eq('flight_id', currentFlight.id)
          .eq('user_id', player.userId); // Use the correct user_id

        if (error) throw error;
        console.log('Handicap saved successfully for', player.name);
      } catch (error) {
        console.error('Error saving handicap:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save handicap. Please try again.",
        });
      }
    }
  };

  const handleSetHandicaps = async () => {
    if (!currentFlight) return;

    console.log('handleSetHandicaps called with handicaps:', handicaps);

    // Validate all players have handicaps set
    const missingHandicaps = currentFlight.players.filter(
      player => !handicaps[player.id] || handicaps[player.id].trim() === ''
    );

    console.log('Missing handicaps check:', missingHandicaps);

    if (missingHandicaps.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Handicaps",
        description: `Please set handicaps for: ${missingHandicaps.map(p => p.name).join(', ')}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('All handicaps are set, starting validation...');
      
      // Start the validation process
      console.log('Calling startValidation()...');
      startValidation();
      console.log('startValidation() called successfully');

      toast({
        title: "Handicaps Set!",
        description: "Now validate each other's handicaps before starting the round.",
      });

    } catch (error) {
      console.error('Error setting handicaps:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set handicaps. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentFlight) {
    return null;
  }

  const allHandicapsSet = currentFlight.players.every(
    player => {
      const hasHandicap = handicaps[player.id] && handicaps[player.id].trim() !== '';
      console.log(`Button enable check - Player ${player.name} (${player.id}): handicap="${handicaps[player.id]}", hasHandicap=${hasHandicap}`);
      return hasHandicap;
    }
  );
  
  console.log('allHandicapsSet:', allHandicapsSet, 'button disabled:', !allHandicapsSet || isSubmitting);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Player Handicaps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Each player needs to set their current WHS handicap index before the round can begin.
          </p>

          <div className="space-y-4">
            {currentFlight.players.map((player) => {
              const isCurrentUser = player.userId === user?.id;
              const handicapValue = handicaps[player.id] || '';
              const hasHandicap = handicapValue.trim() !== '';

              return (
                <Card key={player.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {player.name}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                          {!player.isRegistered && (
                            <Badge variant="secondary" className="text-xs">Guest</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {player.isRegistered ? 'Registered Player' : 'Guest Player'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`handicap-${player.id}`} className="text-sm">
                          WHS Index
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`handicap-${player.id}`}
                            type="text"
                            placeholder="0.0"
                            value={handicapValue}
                            onChange={(e) => handleHandicapChange(player.id, e.target.value)}
                            className="w-20 text-center"
                            disabled={!isCurrentUser}
                          />
                          {hasHandicap && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {!hasHandicap && isCurrentUser && (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isCurrentUser && !hasHandicap && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Please enter your current WHS handicap index. If you don't have one, enter 0.0.
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" />
              <span className="font-medium text-sm">Flight Status</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Players ready:</span>
                <span className="ml-2 font-medium">
                  {currentFlight.players.filter(p => handicaps[p.id]?.trim()).length} / {currentFlight.players.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Next step:</span>
                <span className="ml-2 font-medium">
                  {allHandicapsSet ? 'Peer validation' : 'Set handicaps'}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSetHandicaps}
            disabled={!allHandicapsSet || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Setting up...' : 'Continue to Validation'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              leaveFlight();
            }}
            className="w-full"
          >
            Exit Flight
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};