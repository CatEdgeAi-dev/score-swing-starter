import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users, Target, Lock, Edit3, RefreshCw } from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type HandicapStatus = 'editing' | 'ready' | 'syncing';

export const FlightHandicapSetup: React.FC = () => {
  const { currentFlight, setCurrentFlight, startValidation, leaveFlight } = useFlightContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [handicaps, setHandicaps] = useState<{ [playerId: string]: string }>({});
  const [handicapStatuses, setHandicapStatuses] = useState<{ [playerId: string]: HandicapStatus }>({});
  const [playerProfiles, setPlayerProfiles] = useState<{ [userId: string]: { whs_index: number | null } }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentFlight && user && currentFlight.players && currentFlight.players.length > 0) {
      console.log('🚨 LOADING HANDICAPS: Players are ready, loading handicaps for', currentFlight.players.length, 'players');
      loadFlightHandicaps();
      loadPlayerProfiles();
      
      // Initialize all players to 'editing' status
      const initialStatuses: { [playerId: string]: HandicapStatus } = {};
      currentFlight.players.forEach(player => {
        initialStatuses[player.id] = 'editing';
      });
      setHandicapStatuses(initialStatuses);
    } else if (currentFlight && user) {
      console.log('🚨 WAITING: Flight exists but players not ready yet');
    }
  }, [currentFlight?.id, currentFlight?.players?.length, user?.id]);

  // Periodic refresh to ensure real-time sync
  useEffect(() => {
    if (!currentFlight) return;
    
    const interval = setInterval(() => {
      loadFlightHandicaps();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [currentFlight?.id]);

  // Set up real-time subscription for handicap updates
  useEffect(() => {
    if (!currentFlight) return;

    console.log('🔄 Setting up real-time subscription for flight:', currentFlight.id);

    const channel = supabase
      .channel(`flight-handicaps-${currentFlight.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_players',
          filter: `flight_id=eq.${currentFlight.id}`,
        },
        (payload) => {
          console.log('🔄 Real-time update:', payload.eventType, payload.new);
          // Reload handicaps when any player updates theirs
          setTimeout(() => loadFlightHandicaps(), 100);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔄 Cleaning up real-time subscription for flight:', currentFlight.id);
      supabase.removeChannel(channel);
    };
  }, [currentFlight?.id]);

  const loadFlightHandicaps = async () => {
    if (!currentFlight) return;

    try {
      const { data: players, error } = await supabase
        .from('flight_players')
        .select('id, user_id, guest_name, handicap, player_order')
        .eq('flight_id', currentFlight.id)
        .order('player_order');

      if (error) {
        console.error('❌ Database query failed:', error);
        throw error;
      }

      const handicapData: { [playerId: string]: string } = {};
      
      // Map database records to player IDs correctly
      players?.forEach((dbPlayer, index) => {
        // Find the player in currentFlight that corresponds to this database record
        const player = currentFlight.players.find(p => {
          // For registered players, match by userId
          if (dbPlayer.user_id && p.userId) {
            return p.userId === dbPlayer.user_id;
          }
          // For guest players, match by name or guest_name
          if (!dbPlayer.user_id && !p.userId) {
            return p.name === dbPlayer.guest_name || 
                   (p.name && dbPlayer.guest_name && p.name.toLowerCase() === dbPlayer.guest_name.toLowerCase());
          }
          return false;
        });
        
        if (player && dbPlayer.handicap !== null) {
          handicapData[player.id] = dbPlayer.handicap.toString();
        }
      });
      
      console.log('📊 Final handicap data loaded:', handicapData);
      setHandicaps(handicapData);
    } catch (error) {
      console.error('❌ Error loading flight handicaps:', error);
    }
  };

  const loadPlayerProfiles = async () => {
    if (!currentFlight) return;

    try {
      // Get all registered players' user IDs
      const registeredPlayerIds = currentFlight.players
        .filter(p => p.userId)
        .map(p => p.userId!)
        .filter(Boolean);

      if (registeredPlayerIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, whs_index')
        .in('id', registeredPlayerIds);

      if (error) throw error;

      // Map profiles to userId for easy lookup
      const profileMap: { [userId: string]: { whs_index: number | null } } = {};
      data?.forEach(profile => {
        profileMap[profile.id] = { whs_index: profile.whs_index };
      });

      setPlayerProfiles(profileMap);

      // Auto-fill handicaps from WHS index if not already set
      const updatedHandicaps: { [playerId: string]: string } = { ...handicaps };
      currentFlight.players.forEach(player => {
        if (player.userId && profileMap[player.userId]?.whs_index && !updatedHandicaps[player.id]) {
          updatedHandicaps[player.id] = profileMap[player.userId].whs_index!.toString();
        }
      });
      
      setHandicaps(updatedHandicaps);
    } catch (error) {
      console.error('Error loading player profiles:', error);
    }
  };

  const handleHandicapChange = async (playerId: string, handicap: string) => {
    // Only allow current user to edit their own handicap
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player || (player.userId !== user?.id && player.userId)) return;
    
    // Allow only valid handicap values (0-54 with up to 1 decimal place)
    if (handicap === '' || /^\d{0,2}(\.\d{0,1})?$/.test(handicap)) {
      setHandicaps(prev => ({ ...prev, [playerId]: handicap }));
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
      
      console.log('💾 Saving handicap for player:', player.name, 'userId:', player.userId, 'value:', handicap);
      
      // Save to database immediately using the correct user_id
      try {
        setHandicapStatuses(prev => ({ ...prev, [playerId]: 'syncing' }));
        
        const handicapValue = handicap === '' ? null : parseFloat(handicap);
        
        // For registered players, use user_id. For guests, use the player ID directly
        const updateQuery = player.userId 
          ? supabase
              .from('flight_players')
              .update({ handicap: handicapValue })
              .eq('flight_id', currentFlight.id)
              .eq('user_id', player.userId)
          : supabase
              .from('flight_players')
              .update({ handicap: handicapValue })
              .eq('id', playerId);

        const { error } = await updateQuery;

        if (error) throw error;
        console.log('✅ Handicap saved successfully for', player.name);
        
        setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
        
        // Force reload after save to ensure all players see the update
        setTimeout(() => loadFlightHandicaps(), 50);
      } catch (error) {
        console.error('Error saving handicap:', error);
        setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save handicap. Please try again.",
        });
      }
    }
  };

  const handleLockInHandicap = async (playerId: string) => {
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player || !handicaps[playerId]?.trim()) return;
    
    setHandicapStatuses(prev => ({ ...prev, [playerId]: 'ready' }));
    
    toast({
      title: "Handicap Locked In",
      description: `${player.name}'s handicap is confirmed and ready for validation.`,
    });
  };

  const handleUnlockHandicap = (playerId: string) => {
    setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
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

  const allPlayersReady = currentFlight.players.every(
    player => handicapStatuses[player.id] === 'ready'
  );
  
  const allHandicapsSet = currentFlight.players.every(
    player => {
      const hasHandicap = handicaps[player.id] && handicaps[player.id].trim() !== '';
      console.log(`Button enable check - Player ${player.name} (${player.id}): handicap="${handicaps[player.id]}", hasHandicap=${hasHandicap}`);
      return hasHandicap;
    }
  );
  
  console.log('allHandicapsSet:', allHandicapsSet, 'allPlayersReady:', allPlayersReady, 'button disabled:', !allPlayersReady || isSubmitting);

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
              const status = handicapStatuses[player.id] || 'editing';
              const isReady = status === 'ready';
              const isSyncing = status === 'syncing';

              const getStatusIcon = () => {
                switch (status) {
                  case 'ready':
                    return <Lock className="h-4 w-4 text-green-500" />;
                  case 'syncing':
                    return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
                  default:
                    return <Edit3 className="h-4 w-4 text-gray-400" />;
                }
              };

              const getStatusBadge = () => {
                switch (status) {
                  case 'ready':
                    return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>;
                  case 'syncing':
                    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Syncing...</Badge>;
                  default:
                    return hasHandicap ? 
                      <Badge variant="outline" className="text-orange-600 border-orange-200">Editing</Badge> :
                      <Badge variant="outline" className="text-gray-500">Not Set</Badge>;
                }
              };

              return (
                <Card key={player.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {player.name}
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {!player.isRegistered && (
                              <Badge variant="secondary" className="text-xs">Guest</Badge>
                            )}
                            {getStatusBadge()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {player.isRegistered ? 'Registered Player' : 'Guest Player'}
                            {player.userId && playerProfiles[player.userId] && (
                              <span className="ml-2 text-xs">
                                WHS: {playerProfiles[player.userId].whs_index ?? 'Not set'}
                              </span>
                            )}
                          </p>
                        </div>
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
                            disabled={!isCurrentUser || isReady || isSyncing}
                          />
                          {isCurrentUser && hasHandicap && !isReady && !isSyncing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLockInHandicap(player.id)}
                              className="text-xs px-2 py-1 h-8"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Lock In
                            </Button>
                          )}
                          {isCurrentUser && isReady && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnlockHandicap(player.id)}
                              className="text-xs px-2 py-1 h-8"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isCurrentUser && !hasHandicap && !isReady && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Please enter your current WHS handicap index. If you don't have one, enter 0.0.
                      </p>
                    </div>
                  )}

                  {isCurrentUser && hasHandicap && !isReady && !isSyncing && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Click "Lock In" when you're satisfied with your handicap. Once locked, all players can see it's confirmed.
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Handicaps set:</span>
                <span className="ml-2 font-medium">
                  {currentFlight.players.filter(p => handicaps[p.id]?.trim()).length} / {currentFlight.players.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Players ready:</span>
                <span className="ml-2 font-medium">
                  {currentFlight.players.filter(p => handicapStatuses[p.id] === 'ready').length} / {currentFlight.players.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Next step:</span>
                <span className="ml-2 font-medium">
                  {allPlayersReady ? 'Peer validation' : 'Lock in handicaps'}
                </span>
              </div>
            </div>
          </div>

          {!allPlayersReady && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Ready to proceed?</strong> Each player must lock in their handicap before validation can begin. 
                This ensures everyone sees the final, confirmed handicaps for peer review.
              </p>
            </div>
          )}

          <Button
            onClick={handleSetHandicaps}
            disabled={!allPlayersReady || isSubmitting}
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