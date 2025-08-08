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
  const [isRefreshingProfiles, setIsRefreshingProfiles] = useState(false);
  const [whsRefreshed, setWhsRefreshed] = useState(false);
  const [draftHandicaps, setDraftHandicaps] = useState<Record<string, string>>({});
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  
  // Refs for cleanup and debouncing
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const realtimeChannel = useRef<any>(null);

  // Load current user's display name for smarter player matching (handles guest additions)
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        setMyDisplayName(data?.display_name || null);
      } catch (e) {
        // ignore
      }
    })();
  }, [user?.id]);

  // Find the player's row that belongs to the current user
  const findMyPlayer = useCallback(() => {
    if (!currentFlight?.players || !user) return null;

    // Prefer strict match by userId
    const byUserId = currentFlight.players.find(p => p.userId === user.id);
    if (byUserId) return byUserId;

    // Build fallback candidate names for guest matching
    const emailLocal = user.email ? user.email.split('@')[0] : null;
    const candidates = [myDisplayName, emailLocal, user.email]
      .filter(Boolean)
      .map(s => String(s).trim().toLowerCase());

    // Fallback: match by any candidate name if user was added as a guest
    const byName = currentFlight.players.find(
      p => !p.userId && p.name && candidates.includes(p.name.trim().toLowerCase())
    );
    if (byName) return byName;

    return null;
  }, [currentFlight?.players, user?.id, user?.email, myDisplayName]);

  /**
   * Load current handicap data from database with enhanced cross-player visibility
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
      logger.debug('Loading flight handicaps for ALL players', { 
        flightId: currentFlight.id, 
        currentUser: user?.id,
        playersCount: currentFlight.players.length,
        players: currentFlight.players.map(p => ({ id: p.id, name: p.name, userId: p.userId }))
      });

      const { data: dbPlayers, error } = await supabase
        .from('flight_players')
        .select('id, user_id, guest_name, handicap, handicap_locked, player_order')
        .eq('flight_id', currentFlight.id)
        .order('player_order');

      if (error) throw error;

      logger.info('Database players loaded:', { 
        dbPlayersCount: dbPlayers?.length,
        dbPlayers: dbPlayers?.map(p => ({
          id: p.id,
          userId: p.user_id,
          guestName: p.guest_name,
          handicap: p.handicap,
          locked: p.handicap_locked
        }))
      });

      const handicapData: Record<string, string> = {};
      const statusData: Record<string, HandicapStatus> = {};
      
      // Enhanced player matching with better debugging
      currentFlight.players.forEach((flightPlayer, index) => {
        logger.debug(`Matching flight player ${index}:`, {
          flightPlayer: { id: flightPlayer.id, name: flightPlayer.name, userId: flightPlayer.userId },
          searchingInDB: dbPlayers?.map(p => ({ id: p.id, userId: p.user_id, guestName: p.guest_name }))
        });
        
        const matchedDbPlayer = dbPlayers?.find(dbPlayer => {
          // Match by database ID first (most reliable)
          if (flightPlayer.id === dbPlayer.id) {
            logger.debug('Matched by database ID', { flightPlayerId: flightPlayer.id, dbPlayerId: dbPlayer.id });
            return true;
          }
          
          // Match registered players by userId
          if (flightPlayer.userId && dbPlayer.user_id && flightPlayer.userId === dbPlayer.user_id) {
            logger.debug('Matched by userId', { 
              flightPlayerUserId: flightPlayer.userId, 
              dbPlayerUserId: dbPlayer.user_id 
            });
            return true;
          }
          
          // Match guest players by name
          if (!flightPlayer.userId && !dbPlayer.user_id && dbPlayer.guest_name) {
            const nameMatch = flightPlayer.name.toLowerCase() === dbPlayer.guest_name.toLowerCase();
            logger.debug('Matching guest by name', { 
              flightPlayerName: flightPlayer.name, 
              dbGuestName: dbPlayer.guest_name,
              match: nameMatch
            });
            return nameMatch;
          }
          
          return false;
        });
        
        if (matchedDbPlayer) {
          logger.info(`✅ Matched player ${flightPlayer.name}:`, {
            flightPlayerId: flightPlayer.id,
            dbPlayerId: matchedDbPlayer.id,
            handicap: matchedDbPlayer.handicap,
            locked: matchedDbPlayer.handicap_locked
          });
          
          // Set handicap data for ALL players to see
          if (matchedDbPlayer.handicap !== null) {
            handicapData[flightPlayer.id] = matchedDbPlayer.handicap.toString();
          }
          statusData[flightPlayer.id] = matchedDbPlayer.handicap_locked ? 'ready' : 'editing';
        } else {
          logger.warn(`❌ No match found for flight player ${flightPlayer.name}`, {
            flightPlayer: { id: flightPlayer.id, name: flightPlayer.name, userId: flightPlayer.userId },
            availableDbPlayers: dbPlayers?.map(p => ({ id: p.id, userId: p.user_id, guestName: p.guest_name }))
          });
        }
      });
      
      logger.info('Cross-player handicap sync completed', { 
        loadedHandicaps: Object.keys(handicapData).length,
        loadedStatuses: Object.keys(statusData).length,
        totalPlayers: currentFlight.players.length,
        handicapData,
        statusData
      });
      
      // Update state to show all players' data
      setHandicaps(handicapData);
      setHandicapStatuses(statusData);
    } catch (error) {
      logger.error('Failed to load flight handicaps', error);
    }
  }, [currentFlight?.id, currentFlight?.players, user?.id]);

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

      // Only auto-fill if handicaps state is empty to prevent infinite loops
      setHandicaps(prev => {
        const updatedHandicaps = { ...prev };
        let hasChanges = false;
        
        currentFlight.players.forEach(player => {
          if (player.userId && 
              profileMap[player.userId]?.whsIndex !== null && 
              !updatedHandicaps[player.id]) {
            updatedHandicaps[player.id] = profileMap[player.userId].whsIndex!.toString();
            hasChanges = true;
          }
        });
        
        return hasChanges ? updatedHandicaps : prev;
      });
    } catch (error) {
      logger.error('Failed to load player profiles', error);
    }
  }, [currentFlight?.players]);

  const handleRefreshWHS = useCallback(async () => {
    try {
      setIsRefreshingProfiles(true);
      await loadPlayerProfiles();
      setWhsRefreshed(true);
      toast({
        title: "WHS indexes refreshed",
        description: "Latest WHS indexes loaded from player profiles.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh WHS indexes. Please try again.",
      });
    } finally {
      setIsRefreshingProfiles(false);
    }
  }, [loadPlayerProfiles, toast]);

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
  }, [currentFlight?.id, currentFlight?.players?.length, user?.id, loadFlightHandicaps, loadPlayerProfiles, initializePlayerStatuses]);

  /**
   * Enhanced real-time subscription for cross-player handicap synchronization
   */
  useEffect(() => {
    if (!currentFlight?.id || !user?.id) return;

    logger.info('🔗 Setting up enhanced real-time handicap subscription', { 
      flightId: currentFlight.id,
      userId: user.id
    });

    realtimeChannel.current = supabase
      .channel(`flight-handicaps-${currentFlight.id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_players',
          filter: `flight_id=eq.${currentFlight.id}`,
        },
        (payload) => {
          const eventType = payload.eventType;
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          logger.info('📡 Real-time handicap update received', { 
            event: eventType,
            playerId: newData?.id || oldData?.id,
            userId: newData?.user_id || oldData?.user_id,
            guestName: newData?.guest_name || oldData?.guest_name,
            handicap: newData?.handicap,
            locked: newData?.handicap_locked,
            currentUser: user.id
          });
          
          // Immediate reload for all connected players to see changes
          setTimeout(() => {
            logger.debug('🔄 Cross-player sync: Reloading handicap data');
            loadFlightHandicaps();
          }, 100);
        }
      )
      .subscribe((status) => {
        logger.info('Real-time subscription status:', { 
          status, 
          flightId: currentFlight.id,
          userId: user.id
        });
      });

    return () => {
      if (realtimeChannel.current) {
        logger.info('🔌 Cleaning up real-time handicap subscription');
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [currentFlight?.id, user?.id, loadFlightHandicaps]);


  // Remove the complex findPlayerInFlight function - no longer needed with simplified approach

  /**
   * Simplified debounced save using player database IDs directly
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
        logger.info('💾 Saving handicap using direct ID', { 
          player: player.name,
          playerId: playerId, // This is now the database UUID
          value: handicapValue
        });
        
        // Update using the player's database ID directly
        const { data, error } = await supabase
          .from('flight_players')
          .update({ handicap: handicapValue })
          .eq('id', playerId) // Use database UUID directly
          .select();
        
        if (error) {
          logger.error('Database update failed', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No records updated - player ID may be invalid');
        }
        
        logger.info('✅ Handicap saved successfully', { 
          player: player.name,
          playerId: playerId,
          handicapValue,
          updatedRecords: data.length
        });
        
        // The real-time subscription will handle cross-player sync automatically
        
      } catch (error) {
        logger.error('❌ Failed to save handicap', error);
        toast({
          variant: "destructive",
          title: "Sync Error",
          description: `Failed to save ${player.name}'s handicap. Please try again.`,
        });
      }
      
      // Clean up timeout reference
      delete debounceTimeouts.current[playerId];
    }, 300);
  }, [toast]);

  /**
   * Handle handicap input changes locally without committing to DB
   * Allows free typing and only commits on explicit "Lock In"
   */
  const handleHandicapChange = useCallback((playerId: string, handicap: string) => {
    const player = currentFlight?.players.find(p => p.id === playerId);
    if (!player || !user) return;

    // Only allow the row that belongs to the current user (supports guest fallback)
    const mine = findMyPlayer();
    if (!mine || mine.id !== playerId) return;

    // Validate format (0-54 with up to 1 decimal) while allowing interim states like "5."
    const handicapRegex = /^\d{0,2}(\.?\d{0,1})?$/;
    if (handicap !== '' && !handicapRegex.test(handicap)) return;

    // Update draft value only (do NOT write to DB here)
    setDraftHandicaps(prev => ({ ...prev, [playerId]: handicap }));

    // Keep status as editing unless already locked
    setHandicapStatuses(prev => ({
      ...prev,
      [playerId]: prev[playerId] === 'ready' ? 'ready' : 'editing',
    }));
  }, [currentFlight?.players, user, findMyPlayer]);

  const handleLockInHandicap = async (playerId: string) => {
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player) return;

    // Prefer draft value; fall back to saved value if present
    const draftStr = (draftHandicaps[playerId] ?? '').trim();
    const savedStr = (handicaps[playerId] ?? '').trim();
    const effectiveStr = draftStr || savedStr;

    if (!effectiveStr) return;

    const value = parseFloat(effectiveStr);
    if (Number.isNaN(value) || value < 0 || value > 54) {
      toast({
        variant: 'destructive',
        title: 'Invalid handicap',
        description: 'Please enter a number between 0.0 and 54.0',
      });
      return;
    }

    try {
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'syncing' }));

      logger.info('🔒 Locking in handicap (commit to DB now)', {
        player: player.name,
        playerId,
        value,
        userId: player.userId,
      });

      // Commit handicap and lock in a single update using the DB row id
      const { data, error } = await supabase
        .from('flight_players')
        .update({ handicap: value, handicap_locked: true })
        .eq('id', playerId)
        .select();

      if (error) throw error;

      logger.info('✅ Handicap saved and locked successfully', {
        player: player.name,
        updatedRecords: data?.length || 0,
      });

      // Clear draft and mark ready
      setDraftHandicaps(prev => ({ ...prev, [playerId]: '' }));
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'ready' }));

      toast({
        title: 'Handicap Locked In',
        description: `${player.name}'s handicap is confirmed and visible to all players.`,
      });

      // Reload to sync across players
      setTimeout(() => loadFlightHandicaps(), 100);
    } catch (error) {
      logger.error('❌ Error locking handicap', error);
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
      toast({
        variant: 'destructive',
        title: 'Lock Failed',
        description: 'Failed to lock handicap. Please try again.',
      });
    }
  };

  const handleUnlockHandicap = async (playerId: string) => {
    const player = currentFlight.players.find(p => p.id === playerId);
    if (!player) return;
    
    try {
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'syncing' }));
      
      logger.info('🔓 Unlocking handicap for editing', {
        player: player.name,
        playerId,
        userId: player.userId
      });
      
      // Enhanced unlock with better targeting
      const updateQuery = player.userId 
        ? supabase
            .from('flight_players')
            .update({ handicap_locked: false })
            .eq('flight_id', currentFlight.id)
            .eq('user_id', player.userId)
        : supabase
            .from('flight_players')
            .update({ handicap_locked: false })
            .eq('flight_id', currentFlight.id)
            .eq('guest_name', player.name);

      const { data, error } = await updateQuery.select();

      if (error) throw error;
      
      logger.info('✅ Handicap unlocked successfully', {
        player: player.name,
        updatedRecords: data?.length || 0
      });
      
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'editing' }));
      
      // Force reload to sync across all players
      setTimeout(() => loadFlightHandicaps(), 100);
      
    } catch (error) {
      logger.error('❌ Error unlocking handicap', error);
      setHandicapStatuses(prev => ({ ...prev, [playerId]: 'ready' }));
      toast({
        variant: "destructive",
        title: "Unlock Failed", 
        description: "Failed to unlock handicap. Please try again.",
      });
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Player Handicaps
          </CardTitle>
          {currentFlight.createdBy === user?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshWHS}
              disabled={isRefreshingProfiles}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingProfiles ? 'animate-spin' : ''}`} />
              {isRefreshingProfiles ? 'Refreshing...' : 'Refresh WHS'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Each player needs to set their current WHS handicap index before the round can begin.
          </p>

          {/* Self handicap input: always available when you're in editing state */}
          {(() => {
            const myPlayer = findMyPlayer();
            if (!myPlayer) return null;
            const mySavedValue = (handicaps[myPlayer.id] || '').trim();
            const myDraftValue = (draftHandicaps[myPlayer.id] ?? '').trim();
            const myStatus = handicapStatuses[myPlayer.id] || 'editing';
            const showSelfInput = myStatus !== 'syncing' && myStatus !== 'ready';
            if (!showSelfInput) return null;

            const effectiveStr = myDraftValue || mySavedValue;

            return (
              <div className="p-4 border rounded-lg bg-background/50">
                <Label htmlFor={`self-handicap-${myPlayer.id}`} className="text-sm mb-2 inline-block">
                  Set your handicap for this flight
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`self-handicap-${myPlayer.id}`}
                    type="text"
                    placeholder="0.0"
                    value={effectiveStr}
                    onChange={(e) => handleHandicapChange(myPlayer.id, e.target.value)}
                    className="w-24 text-center"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleLockInHandicap(myPlayer.id)}
                    disabled={!effectiveStr}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Lock In
                  </Button>
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {currentFlight.players.map((player) => {
              const myPlayerRef = findMyPlayer();
              const isCurrentUser = myPlayerRef?.id === player.id;
              const savedValue = handicaps[player.id] || '';
              const draftValue = draftHandicaps[player.id] ?? '';
              const displayValue = isCurrentUser && draftValue !== '' ? draftValue : savedValue;
              const hasValueForLock = (isCurrentUser ? (draftValue || savedValue) : savedValue).trim() !== '';
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
                    return hasValueForLock ? 
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
                            value={displayValue}
                            readOnly
                            disabled
                            aria-label="WHS index (display only)"
                            className="w-20 text-center"
                          />
                          {isCurrentUser && hasValueForLock && !isReady && !isSyncing && (
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

                  {isCurrentUser && !hasValueForLock && !isReady && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Please enter your current WHS handicap index. If you don't have one, enter 0.0.
                      </p>
                    </div>
                  )}

                  {isCurrentUser && hasValueForLock && !isReady && !isSyncing && (
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

          {currentFlight.createdBy === user?.id && !whsRefreshed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                Please refresh WHS indexes before proceeding. Use the "Refresh WHS" button above.
              </p>
            </div>
          )}

          <Button
            onClick={handleSetHandicaps}
            disabled={!allPlayersReady || isSubmitting || (currentFlight.createdBy === user?.id && !whsRefreshed)}
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