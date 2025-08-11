import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { validateFlightCreation, validateFlightDataConsistency, logValidationResults } from '@/utils/flight-data-validator';
import { handleSupabaseError } from '@/utils/error-handlers';

// Interfaces
interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
  handicap?: number;
}

interface ValidationStatus {
  playerId: string;
  validationsReceived: number;
  validationsNeeded: number;
  status: 'pending' | 'validated' | 'questioned';
}

interface Flight {
  id: string;
  name: string;
  courseName: string;
  dateCreated: string;
  players: Player[];
  createdBy: string;
  weather?: string;
  datePlayedInfo?: string;
  status?: string;
}

interface FlightContextType {
  currentFlight: Flight | null;
  setCurrentFlight: (flight: Flight | null) => void;
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
  isFlightMode: boolean;
  switchToPlayer: (player: Player) => void;
  createFlight: (flightData: {
    name: string;
    courseName: string;
    players: Player[];
  }) => Promise<void>;
  leaveFlight: () => Promise<void>;
  joinFlight: (flightId: string) => Promise<void>;
  deleteFlight: (flightId: string) => Promise<void>;
  validationStatuses: ValidationStatus[];
  needsValidation: boolean;
  startValidation: () => void;
  isLoading: boolean;
  availableFlights: Flight[];
  refreshFlights: () => Promise<void>;
}

const FlightContext = createContext<FlightContextType | null>(null);

export const FlightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [validationStatuses, setValidationStatuses] = useState<ValidationStatus[]>([]);
  const [needsValidation, setNeedsValidation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableFlights, setAvailableFlights] = useState<Flight[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const isFlightMode = currentFlight !== null;

  /**
   * ENHANCED FLIGHT CREATION with comprehensive validation and error handling
   */
  const createFlight = async (flightData: {
    name: string;
    courseName: string;
    players: Player[];
  }) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('User must be logged in to create a flight');
      }

      // Validate flight data before proceeding
      const validation = validateFlightCreation(flightData);
      logValidationResults('Flight Creation Input', validation);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      console.group('🏌️ ENHANCED FLIGHT CREATION PROCESS');
      console.log('📊 Starting flight creation with validated data:', {
        name: flightData.name,
        courseName: flightData.courseName,
        playerCount: flightData.players.length,
        players: flightData.players.map((p, i) => ({
          index: i + 1,
          name: p.name,
          isRegistered: p.isRegistered,
          formId: p.id,
          userId: p.userId || 'guest'
        }))
      });

      // Create the flight record
      console.log('🆕 Creating flight record...');
      const { data: flight, error: flightError } = await supabase
        .from('flights')
        .insert({
          name: flightData.name.trim(),
          course_name: flightData.courseName.trim(),
          created_by: user.id,
          date_played: new Date().toISOString().split('T')[0] as string,
        })
        .select()
        .single();

      if (flightError) {
        throw handleSupabaseError(flightError, 'flight creation', 'Failed to create flight');
      }

      console.log('✅ Flight created successfully:', {
        flightId: flight.id,
        name: flight.name,
        course: flight.course_name
      });

      // Create flight players with enhanced validation
      console.log('👥 Creating flight players...');
      const playerInserts = flightData.players.map((player, index) => {
        if (!player.name?.trim()) {
          throw new Error(`Player ${index + 1} must have a name`);
        }

        const playerData = {
          flight_id: flight.id,
          player_order: index + 1,
          ...(player.isRegistered && player.userId ? {
            user_id: player.userId,
            guest_name: null
          } : {
            user_id: null,
            guest_name: player.name.trim()
          })
        };

        console.log(`📝 Player ${index + 1} insert data:`, {
          name: player.name,
          isRegistered: player.isRegistered,
          formId: player.id,
          insertData: playerData
        });

        return playerData;
      });

      const { data: createdPlayers, error: playersError } = await supabase
        .from('flight_players')
        .insert(playerInserts)
        .select(`
          id,
          flight_id,
          user_id,
          guest_name,
          player_order,
          handicap,
          handicap_locked,
          created_at
        `);

      if (playersError) {
        console.error('❌ Failed to create flight players:', playersError);
        
        // Clean up the flight if player creation fails
        try {
          await supabase.from('flights').delete().eq('id', flight.id);
          console.log('🧹 Cleaned up flight due to player creation failure');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup flight:', cleanupError);
        }
        
        throw handleSupabaseError(playersError, 'flight players creation', 'Failed to create flight players');
      }

      if (!createdPlayers || createdPlayers.length !== flightData.players.length) {
        throw new Error(`Expected ${flightData.players.length} players, but only ${createdPlayers?.length || 0} were created`);
      }

      console.log('✅ Flight players created successfully:', {
        playerCount: createdPlayers.length,
        players: createdPlayers.map(p => ({
          dbId: p.id,
          userId: p.user_id || 'guest',
          guestName: p.guest_name,
          order: p.player_order,
          handicapLocked: p.handicap_locked
        }))
      });

      // Validate data consistency
      const consistencyValidation = validateFlightDataConsistency(
        flightData.players, 
        createdPlayers as any
      );
      logValidationResults('Flight Data Consistency', consistencyValidation);

      console.groupEnd();

      // Load the created flight and use returned data for validation
      console.log('🔄 Loading created flight to sync with database...');
      const loadedFlight = await loadFlightData(flight.id);
      
      // Verify using the returned flight data instead of state
      if (!loadedFlight || loadedFlight.id !== flight.id) {
        throw new Error('Failed to load the created flight - data consistency issue');
      }
      
      toast({
        title: "Flight Created Successfully",
        description: `${flightData.name} has been created with ${createdPlayers.length} players!`,
      });

    } catch (error) {
      console.error('❌ Flight creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        variant: "destructive",
        title: "Failed to Create Flight",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ENHANCED FLIGHT DATA LOADING with comprehensive validation
   */
  const loadFlightData = useCallback(async (flightId: string): Promise<Flight | null> => {
    try {
      setIsLoading(true);
      
      console.log('📡 Loading flight data for ID:', flightId);

      // Fetch flight with players and profile information
      const { data: flightData, error } = await supabase
        .from('flights')
        .select(`
          id,
          name,
          course_name,
          date_played,
          weather,
          created_by,
          created_at,
          updated_at,
          flight_players (
            id,
            flight_id,
            user_id,
            guest_name,
            player_order,
            handicap,
            handicap_locked,
            created_at
          )
        `)
        .eq('id', flightId)
        .single();

      if (error) {
        throw handleSupabaseError(error, 'flight data loading', 'Failed to load flight');
      }

      if (!flightData) {
        throw new Error('Flight not found');
      }

      console.log('📊 Raw flight data loaded:', {
        flightId: flightData.id,
        name: flightData.name,
        playerCount: flightData.flight_players?.length || 0,
        rawPlayers: flightData.flight_players?.map(fp => ({
          dbId: fp.id,
          userId: fp.user_id,
          guestName: fp.guest_name,
          order: fp.player_order,
          handicap: fp.handicap,
          locked: fp.handicap_locked
        }))
      });

      // Validate flight data integrity
      if (!flightData.flight_players || flightData.flight_players.length === 0) {
        throw new Error('Flight has no players - data integrity issue');
      }

      // Transform flight players data with enhanced validation
      const playerPromises = flightData.flight_players
        .sort((a, b) => a.player_order - b.player_order)
        .map(async (fp: any) => {
          // Validate database record
          if (!fp.id) {
            throw new Error('Player record missing database ID');
          }

          if (fp.user_id) {
            // Get profile for registered player
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', fp.user_id)
              .single();

            return {
              id: fp.id, // Use database-generated UUID
              name: profile?.display_name || 'Unknown User',
              isRegistered: true,
              userId: fp.user_id,
              handicap: fp.handicap ? Number(fp.handicap) : undefined
            };
          } else if (!fp.user_id && fp.guest_name) {
            // Guest player
            return {
              id: fp.id, // Use database-generated UUID
              name: fp.guest_name,
              isRegistered: false,
              handicap: fp.handicap ? Number(fp.handicap) : undefined
            };
          } else {
            throw new Error(`Invalid player record: ${JSON.stringify({
              id: fp.id,
              user_id: fp.user_id,
              guest_name: fp.guest_name
            })}`);
          }
        });

      const players: Player[] = await Promise.all(playerPromises).then(list => list.map((p: any) => {
        const base = {
          id: String(p.id),
          name: String(p.name),
          isRegistered: Boolean(p.userId)
        } as Player
        return {
          ...base,
          ...(p.userId ? { userId: String(p.userId) } : {}),
          ...(typeof p.handicap === 'number' ? { handicap: p.handicap as number } : {}),
        } as Player
      }))

      const flight: Flight = {
        id: String(flightData.id),
        name: String(flightData.name),
        courseName: flightData.course_name ?? '',
        dateCreated: String(flightData.created_at),
        players: players,
        createdBy: String(flightData.created_by),
        ...(flightData.weather ? { weather: String(flightData.weather) } : {}),
        ...(flightData.date_played ? { datePlayedInfo: String(flightData.date_played) } : {}),
        status: 'handicap_setup'
      };

      setCurrentFlight(flight);
      
      // Set current player (maintain current selection or default to first)
      const currentPlayerStillValid = currentPlayer && players.find(p => p.id === currentPlayer.id);
      if (!currentPlayerStillValid) {
        setCurrentPlayer(players[0] || null);
        console.log('🎯 Set current player to:', players[0]?.name);
      }

      console.log('🎯 Flight loaded successfully with database consistency:', {
        flightName: flight.name,
        playerCount: flight.players.length,
        allPlayersHaveDbIds: flight.players.every(p => p.id && p.id.length > 10),
        currentPlayer: currentPlayer?.name || players[0]?.name
      });

      return flight; // Return the loaded flight data

    } catch (error) {
      console.error('❌ Failed to load flight data:', error);
      
      // Clear invalid flight data
      setCurrentFlight(null);
      setCurrentPlayer(null);
      
      toast({
        variant: "destructive",
        title: "Flight Load Error",
        description: error instanceof Error ? error.message : 'Failed to load flight data',
      });
      
      return null; // Return null on error
    } finally {
      setIsLoading(false);
    }
  }, [currentPlayer, toast]);

  const deleteFlight = async (flightId: string) => {
    try {
      setIsLoading(true);
      
      console.log('🗑️ Deleting flight:', flightId);
      
      const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', flightId);

      if (error) {
        throw handleSupabaseError(error, 'flight deletion', 'Failed to delete flight');
      }

      // Clear current flight if it's the one being deleted
      if (currentFlight?.id === flightId) {
        setCurrentFlight(null);
        setCurrentPlayer(null);
        setValidationStatuses([]);
        setNeedsValidation(false);
      }

      await refreshFlights();
      
      toast({
        title: "Flight Deleted",
        description: "Flight has been successfully deleted.",
      });

    } catch (error) {
      console.error('❌ Failed to delete flight:', error);
      
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete flight',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const leaveFlight = async () => {
    if (!currentFlight || !user) return;

    try {
      setIsLoading(true);
      
      console.log('🚪 Leaving flight:', {
        flightId: currentFlight.id,
        userId: user.id,
        isCreator: currentFlight.createdBy === user.id
      });

      // If user is the creator and there are other players, transfer ownership
      if (currentFlight.createdBy === user.id && currentFlight.players.length > 1) {
        const nextOwner = currentFlight.players.find(p => p.userId && p.userId !== user.id);
        const nextOwnerId = nextOwner?.userId;
        if (nextOwnerId) {
          console.log('👑 Transferring ownership to:', nextOwner.name);
          await supabase
            .from('flights')
            .update({ created_by: nextOwnerId })
            .eq('id', currentFlight.id);
        }
      }

      // Remove player from flight
      const { error } = await supabase
        .from('flight_players')
        .delete()
        .eq('flight_id', currentFlight.id)
        .eq('user_id', user.id);

      if (error) {
        throw handleSupabaseError(error, 'leaving flight', 'Failed to leave flight');
      }

      // Clear current flight
      setCurrentFlight(null);
      setCurrentPlayer(null);
      setValidationStatuses([]);
      setNeedsValidation(false);

      await refreshFlights();
      
      toast({
        title: "Left Flight",
        description: "You have successfully left the flight.",
      });

    } catch (error) {
      console.error('❌ Failed to leave flight:', error);
      
      toast({
        variant: "destructive",
        title: "Leave Failed",
        description: error instanceof Error ? error.message : 'Failed to leave flight',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinFlight = async (flightId: string) => {
    try {
      setIsLoading(true);
      await loadFlightData(flightId);
      
      toast({
        title: "Joined Flight",
        description: "Successfully joined the flight!",
      });
    } catch (error) {
      console.error('❌ Failed to join flight:', error);
      
      toast({
        variant: "destructive",
        title: "Join Failed",
        description: error instanceof Error ? error.message : 'Failed to join flight',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFlights = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 Refreshing available flights for user:', user.id);

      const { data: flights, error } = await supabase
        .from('flights')
        .select(`
          id,
          name,
          course_name,
          date_played,
          created_by,
          created_at,
          flight_players (
            id,
            user_id,
            guest_name,
            player_order
          )
        `)
        .eq('date_played', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) {
        throw handleSupabaseError(error, 'flights refresh', 'Failed to load flights');
      }

      const transformedFlights: Flight[] = (flights || []).map(f => ({
        id: String(f.id),
        name: String(f.name),
        courseName: f.course_name ?? '',
        dateCreated: String(f.created_at),
        createdBy: String(f.created_by),
        players: (f.flight_players || [])
          .sort((a, b) => a.player_order - b.player_order)
          .map((fp: any) => ({
            id: String(fp.id),
            name: fp.user_id ? 'Unknown User' : String(fp.guest_name || 'Unknown Guest'),
            isRegistered: Boolean(fp.user_id),
            ...(fp.user_id ? { userId: String(fp.user_id) } : {}),
          }))
      }));

      setAvailableFlights(transformedFlights);
      console.log('✅ Flights refreshed:', transformedFlights.length);

    } catch (error) {
      console.error('❌ Failed to refresh flights:', error);
    }
  }, [user]);

  const loadCurrentUserFlight = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;

    try {
      console.log('🔍 Checking for current user flight:', uid);

      // Check if user is in any active flight
      const { data: userFlight, error } = await supabase
        .from('flight_players')
        .select(`
          flight_id,
          flights (
            id,
            name,
            course_name,
            date_played,
            weather,
            created_by
          )
        `)
        .eq('user_id', uid)
        .eq('flights.date_played', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error) {
        console.error('Error loading user flight:', error);
        return;
      }

      if (userFlight?.flights) {
        // Flight exists, load it
        if (userFlight.flight_id) {
          await loadFlightData(userFlight.flight_id);
        }
      } else if (userFlight && !userFlight.flights) {
        // User has flight_players record but flight doesn't exist (orphaned record)
        console.log('Found orphaned flight_players record, cleaning up...');
        await supabase
          .from('flight_players')
          .delete()
          .eq('user_id', uid)
          .eq('flight_id', userFlight.flight_id);
        
        toast({
          title: "Flight Cleaned Up",
          description: "Removed reference to deleted flight.",
        });
      }
    } catch (error) {
      // User not in any flight - this is normal
      console.log('User not in any current flight:', error);
    }
  }, [user, loadFlightData, toast]);

  // Set up realtime subscriptions (only when user changes)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('flight-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flights'
        },
        () => {
          refreshFlights();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_players'
        },
        (payload) => {
          try {
            const eventType = (payload as any).eventType as string;
            const newRec: any = (payload as any).new;
            const oldRec: any = (payload as any).old;

            // Auto-load when the current user is invited/added to a flight
            if (eventType === 'INSERT' && newRec?.user_id && user?.id && newRec.user_id === user.id) {
              loadFlightData(newRec.flight_id);
            }

            // If the change affects the current flight, refresh it
            const affectedFlightId = newRec?.flight_id || oldRec?.flight_id;
            if (affectedFlightId && currentFlight?.id === affectedFlightId) {
              loadFlightData(affectedFlightId);
            }

            // If current user was removed from their current flight, clear local state
            if (eventType === 'DELETE' && oldRec?.user_id && user?.id && oldRec.user_id === user.id && currentFlight?.id === oldRec.flight_id) {
              setCurrentFlight(null);
              setCurrentPlayer(null);
            }
          } catch (e) {
            console.error('Realtime flight_players handler error:', e);
          } finally {
            refreshFlights();
          }
        }
      )
      .subscribe();

    // Initial load
    refreshFlights();
    loadCurrentUserFlight();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Removed dependencies that cause loops

  const switchToPlayer = (player: Player) => {
    setCurrentPlayer(player);
  };

  const startValidation = () => {
    console.log('startValidation called, currentFlight:', currentFlight);
    if (currentFlight) {
      const statuses: ValidationStatus[] = currentFlight.players.map(player => ({
        playerId: player.id,
        validationsReceived: 0,
        validationsNeeded: currentFlight.players.length - 1,
        status: 'pending' as const
      }));
      console.log('Setting validation statuses:', statuses);
      setValidationStatuses(statuses);
      console.log('Setting needsValidation to true');
      setNeedsValidation(true);
      console.log('startValidation completed');
    } else {
      console.log('startValidation called but no currentFlight available');
    }
  };

  return (
    <FlightContext.Provider value={{
      currentFlight,
      setCurrentFlight,
      currentPlayer,
      setCurrentPlayer,
      isFlightMode,
      switchToPlayer,
      createFlight,
      leaveFlight,
      joinFlight,
      deleteFlight,
      validationStatuses,
      needsValidation,
      startValidation,
      isLoading,
      availableFlights,
      refreshFlights,
    }}>
      {children}
    </FlightContext.Provider>
  );
};

export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error('useFlightContext must be used within a FlightProvider');
  }
  return context;
};

export const useFlightContextSafe = () => {
  return useContext(FlightContext);
};