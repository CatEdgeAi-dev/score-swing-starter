import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { logger } from '@/utils/logger';

/** Status of a player's handicap input */
type HandicapStatus = 'editing' | 'ready' | 'syncing';

/** Player handicap data structure */
interface PlayerHandicapData {
  id: string;
  userId?: string;
  guestName?: string;
  handicap: number | null;
  handicapLocked: boolean;
  playerOrder: number;
}

/** Player profile data from the profiles table */
interface PlayerProfile {
  id: string;
  whsIndex: number | null;
}

/**
 * FlightHandicapSetup Component
 * 
 * Manages the handicap setup phase of a flight where players:
 * 1. Set their WHS handicap index
 * 2. Lock in their handicap when ready
 * 3. Proceed to validation once all handicaps are confirmed
 * 
 * Features:
 * - Real-time synchronization across all players
 * - Debounced database saves to prevent excessive API calls
 * - Auto-fill from player profiles where available
 * - Input validation for WHS handicap ranges (0-54.0)
 */
export const FlightHandicapSetup: React.FC = () => {
  const { currentFlight, startValidation, leaveFlight } = useFlightContext();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [handicaps, setHandicaps] = useState<Record<string, string>>({});
  const [handicapStatuses, setHandicapStatuses] = useState<Record<string, HandicapStatus>>({});
  const [playerProfiles, setPlayerProfiles] = useState<Record<string, PlayerProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for cleanup and debouncing
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const realtimeChannel = useRef<any>(null);

  /**
   * Initialize handicap data when flight and players are ready
   */
  useEffect(() => {
    if (currentFlight?.players?.length && user) {
      logger.info('Initializing handicap setup', { 
        flightId: currentFlight.id, 
        playerCount: currentFlight.players.length 
      });
      
      loadFlightHandicaps();
      loadPlayerProfiles();
      initializePlayerStatuses();
    }
  }, [currentFlight?.id, currentFlight?.players?.length, user?.id]);

  /**
   * Set up real-time subscription for handicap updates
   */
  useEffect(() => {
    if (!currentFlight?.id) return;

    logger.info('Setting up real-time handicap subscription', { flightId: currentFlight.id });

    realtimeChannel.current = supabase
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
          logger.debug('Real-time handicap update', { 
            event: payload.eventType, 
            playerId: payload.new ? (payload.new as any).id : null
          });
          
          // Debounced reload to prevent excessive updates
          setTimeout(() => loadFlightHandicaps(), 50);
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel.current) {
        logger.info('Cleaning up real-time handicap subscription');
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [currentFlight?.id]);

  /**
   * Initialize player status tracking
   */
  const initializePlayerStatuses = useCallback(() => {
    if (!currentFlight?.players) return;
    
    const initialStatuses: Record<string, HandicapStatus> = {};
    currentFlight.players.forEach(player => {
      initialStatuses[player.id] = 'editing';
    });
    setHandicapStatuses(initialStatuses);
  }, [currentFlight?.players]);

  /**
   * Load current handicap data from database
   */
  const loadFlightHandicaps = useCallback(async () => {
    if (!currentFlight?.id) {
      logger.debug('No flight ID available for loading handicaps');
      return;
    }

    if (!currentFlight?.players?.length) {
      logger.debug('No players available yet, skipping handicap load');
      return;
    }

    try {
      logger.debug('Loading flight handicaps', { 
        flightId: currentFlight.id, 
        playersCount: currentFlight.players.length,
        players: currentFlight.players.map(p => ({ id: p.id, name: p.name, userId: p.userId }))
      });

      const { data: players, error } = await supabase
        .from('flight_players')
        .select('id, user_id, guest_name, handicap, handicap_locked, player_order')
        .eq('flight_id', currentFlight.id)
        .order('player_order');

      if (error) throw error;

      logger.debug('Raw database data:', players);

      const handicapData: Record<string, string> = {};
      const statusData: Record<string, HandicapStatus> = {};
      
      // Map database records to current flight players
      players?.forEach((dbPlayer) => {
        logger.debug('Processing DB player:', {
          dbPlayer,
          searchingIn: currentFlight.players.map(p => ({ id: p.id, name: p.name, userId: p.userId }))
        });
        
        const player = findPlayerInFlight(dbPlayer, currentFlight.players);
        
        logger.debug('Player match result:', { 
          dbPlayerId: dbPlayer.id,
          dbPlayerUserId: dbPlayer.user_id,
          dbPlayerGuest: dbPlayer.guest_name,
          matchedPlayer: player ? { id: player.id, name: player.name, userId: player.userId } : null
        });
        
        if (player) {
          if (dbPlayer.handicap !== null) {
            handicapData[player.id] = dbPlayer.handicap.toString();
          }
          statusData[player.id] = dbPlayer.handicap_locked ? 'ready' : 'editing';
        } else {
          logger.warn('Could not match DB player to flight player', { dbPlayer });
        }
      });
      
      logger.info('Final handicap data loaded', { 
        handicapData, 
        statusData,
        playersProcessed: players?.length,
        matchedPlayers: Object.keys(handicapData).length
      });
      
      setHandicaps(handicapData);
      setHandicapStatuses(statusData);
    } catch (error) {
      logger.error('Failed to load flight handicaps', error);
    }
  }, [currentFlight?.id]);

  /**
   * Load player profiles to auto-fill handicap data
   */
  const loadPlayerProfiles = useCallback(async () => {
    if (!currentFlight?.players) return;

    try {
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

      const profileMap: Record<string, PlayerProfile> = {};
      data?.forEach(profile => {
        profileMap[profile.id] = { 
          id: profile.id, 
          whsIndex: profile.whs_index 
        };
      });

      setPlayerProfiles(profileMap);

      // Auto-fill handicaps from WHS index if not already set
      const updatedHandicaps = { ...handicaps };
      currentFlight.players.forEach(player => {
        if (player.userId && 
            profileMap[player.userId]?.whsIndex !== null && 
            !updatedHandicaps[player.id]) {
          updatedHandicaps[player.id] = profileMap[player.userId].whsIndex!.toString();
        }
      });
      
      setHandicaps(updatedHandicaps);
    } catch (error) {
      logger.error('Failed to load player profiles', error);
    }
  }, [currentFlight?.players, handicaps]);

  /**
   * Helper function to find a player in the flight based on database record
   */
  const findPlayerInFlight = useCallback((dbPlayer: any, players: any[]) => {
    if (!players || !Array.isArray(players)) {
      logger.warn('Invalid players array provided to findPlayerInFlight', { players });
      return null;
    }

    const result = players.find(p => {
      // For registered players, match by userId
      if (dbPlayer.user_id && p.userId) {
        const match = p.userId === dbPlayer.user_id;
        logger.debug('Matching by userId', { 
          dbUserId: dbPlayer.user_id, 
          playerUserId: p.userId, 
          match 
        });
        return match;
      }
      // For guest players, match by name
      if (!dbPlayer.user_id && !p.userId) {
        const exactMatch = p.name === dbPlayer.guest_name;
        const caseInsensitiveMatch = p.name && dbPlayer.guest_name && 
               p.name.toLowerCase() === dbPlayer.guest_name.toLowerCase();
        const match = exactMatch || caseInsensitiveMatch;
        logger.debug('Matching by guest name', { 
          playerName: p.name, 
          dbGuestName: dbPlayer.guest_name, 
          exactMatch, 
          caseInsensitiveMatch, 
          match 
        });
        return match;
      }
      return false;
    });

    if (!result) {
      logger.warn('No matching player found', { 
        dbPlayer: { 
          id: dbPlayer.id, 
          user_id: dbPlayer.user_id, 
          guest_name: dbPlayer.guest_name 
        },
        availablePlayers: players.map(p => ({ 
          id: p.id, 
          name: p.name, 
          userId: p.userId 
        }))
      });
    }

    return result;
  }, []);

  /**
   * Debounced save function to prevent excessive database calls
   */
  const debouncedSaveHandicap = useCallback((
    playerId: string, 
    handicapValue: number | null, 
    player: any
  ) => {
    // Clear existing timeout for this player
    if (debounceTimeouts.current[playerId]) {
      clearTimeout(debounceTimeouts.current[playerId]);
    }

    debounceTimeouts.current[playerId] = setTimeout(async () => {
      try {
        logger.debug('Saving handicap', { 
          player: player.name, 
          value: handicapValue 
        });
        
        const updateQuery = player.userId 
          ? supabase
              .from('flight_players')
              .update({ handicap: handicapValue })
              .eq('flight_id', currentFlight!.id)
              .eq('user_id', player.userId)
          : supabase
              .from('flight_players')
              .update({ handicap: handicapValue })
              .eq('id', playerId);

        const { error } = await updateQuery;
        if (error) throw error;
        
        logger.info('Handicap saved successfully', { player: player.name });
      } catch (error) {
        logger.error('Failed to save handicap', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save handicap. Please try again.",
        });
      }
      
      // Clean up timeout reference
      delete debounceTimeouts.current[playerId];
    }, 500);
  }, [currentFlight, toast]);

  /**
   * Handle handicap input changes with validation and debounced saving
   */
  const handleHandicapChange = useCallback((playerId: string, handicap: string) => {
    const player = currentFlight?.players.find(p => p.id === playerId);
    if (!player || !user) return;
    
    // Only allow current user to edit their own handicap or guest handicaps
    if (player.userId && player.userId !== user.id) return;
    
    // Validate handicap format (0-54 with up to 1 decimal place)
    const handicapRegex = /^\d{0,2}(\.\d{0,1})?$/;
    if (handicap !== '' && !handicapRegex.test(handicap)) return;
    
    // Update local state immediately for responsive UI
    setHandicaps(prev => ({ ...prev, [playerId]: handicap }));
    
    // Don't change status if already locked
    setHandicapStatuses(prev => ({ 
      ...prev, 
      [playerId]: prev[playerId] === 'ready' ? 'ready' : 'editing' 
    }));
    
    // Debounced save to database
    const handicapValue = handicap === '' ? null : parseFloat(handicap);
    debouncedSaveHandicap(playerId, handicapValue, player);
  }, [currentFlight?.players, user, debouncedSaveHandicap]);

  const handleLockInHandicap = async (playerId: string) => {
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player || !handicaps[playerId]?.trim()) return;
    
    try {
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'syncing' }));
      
      // Save the "ready" status to the database so all players can see it
      const updateQuery = player.userId 
        ? supabase
            .from('flight_players')
            .update({ handicap_locked: true } as any)
            .eq('flight_id', currentFlight.id)
            .eq('user_id', player.userId)
        : supabase
            .from('flight_players')
            .update({ handicap_locked: true } as any)
            .eq('id', playerId);

      const { error } = await updateQuery;

      if (error) throw error;
      
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'ready' }));
      
      toast({
        title: "Handicap Locked In",
        description: `${player.name}'s handicap is confirmed and ready for validation.`,
      });
    } catch (error) {
      console.error('Error locking handicap:', error);
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lock handicap. Please try again.",
      });
    }
  };

  const handleUnlockHandicap = async (playerId: string) => {
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player) return;
    
    try {
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'syncing' }));
      
      // Remove the "ready" status from the database
      const updateQuery = player.userId 
        ? supabase
            .from('flight_players')
            .update({ handicap_locked: false } as any)
            .eq('flight_id', currentFlight.id)
            .eq('user_id', player.userId)
        : supabase
            .from('flight_players')
            .update({ handicap_locked: false } as any)
            .eq('id', playerId);

      const { error } = await updateQuery;

      if (error) throw error;
      
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
    } catch (error) {
      console.error('Error unlocking handicap:', error);
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'ready' }));
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
      {/* Temporary Debug Panel */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">Debug Panel (Temporary)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div><strong>Current User:</strong> {user?.id}</div>
          <div><strong>Flight ID:</strong> {currentFlight?.id}</div>
          <div><strong>Players in Flight:</strong> {JSON.stringify(currentFlight?.players?.map(p => ({ id: p.id, name: p.name, userId: p.userId })))}</div>
          <div><strong>Handicaps State:</strong> {JSON.stringify(handicaps)}</div>
          <div><strong>Status State:</strong> {JSON.stringify(handicapStatuses)}</div>
          <div><strong>Real-time Channel:</strong> {realtimeChannel.current ? 'Connected' : 'Disconnected'}</div>
        </CardContent>
      </Card>
      
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
                                WHS: {playerProfiles[player.userId].whsIndex ?? 'Not set'}
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