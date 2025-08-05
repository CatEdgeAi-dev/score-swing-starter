import { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
  handicap?: number;
  displayName?: string;
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
  datePlayedInfo: string;
  weather: string;
  players: Player[];
  createdBy: string;
  datePlayedDate?: string;
  status?: 'waiting' | 'handicap_setup' | 'validation' | 'ready' | 'started';
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
  }) => Promise<Flight>;
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

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const FlightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [validationStatuses, setValidationStatuses] = useState<ValidationStatus[]>([]);
  const [needsValidation, setNeedsValidation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableFlights, setAvailableFlights] = useState<Flight[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const isFlightMode = currentFlight !== null;

  // Load flight data from database
  const loadFlightData = useCallback(async (flightId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch flight details
      const { data: flightData, error: flightError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single();

      if (flightError) throw flightError;

      // Fetch flight players with profile data
      const { data: playersData, error: playersError } = await supabase
        .from('flight_players')
        .select(`
          id,
          user_id,
          guest_name,
          player_order,
          flight_id
        `)
        .eq('flight_id', flightId)
        .order('player_order');

      if (playersError) throw playersError;

      // Fetch profiles for registered players
      const userIds = playersData.filter(p => p.user_id).map(p => p.user_id);
      let profilesData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, whs_index')
          .in('id', userIds);
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      if (playersError) throw playersError;

      // Transform to Flight interface
      const players: Player[] = playersData.map(player => {
        const profile = profilesData.find(p => p.id === player.user_id);
        return {
          id: player.user_id || player.id,
          name: player.guest_name || profile?.display_name || 'Unknown Player',
          isRegistered: !!player.user_id,
          userId: player.user_id || undefined,
          handicap: profile?.whs_index || undefined,
          displayName: profile?.display_name
        };
      });

      const flight: Flight = {
        id: flightData.id,
        name: flightData.name,
        courseName: flightData.course_name || '',
        datePlayedInfo: new Date(flightData.date_played).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        datePlayedDate: flightData.date_played,
        weather: flightData.weather || 'sunny',
        players,
        createdBy: flightData.created_by,
        status: 'handicap_setup' // Default status
      };

      setCurrentFlight(flight);
      
      // Set current player if user is in the flight
      const currentUserPlayer = players.find(p => p.userId === user?.id);
      if (currentUserPlayer) {
        setCurrentPlayer(currentUserPlayer);
      }

    } catch (error) {
      console.error('Error loading flight data:', error);
      toast({
        title: "Error",
        description: "Failed to load flight data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Create flight with database persistence
  const createFlight = useCallback(async (flightData: {
    name: string;
    courseName: string;
    players: Player[];
  }): Promise<Flight> => {
    if (!user) throw new Error('User must be logged in to create a flight');

    try {
      setIsLoading(true);

      // Create flight in database
      const { data: newFlight, error: flightError } = await supabase
        .from('flights')
        .insert({
          name: flightData.name,
          course_name: flightData.courseName,
          created_by: user.id,
          weather: 'sunny'
        })
        .select()
        .single();

      if (flightError) throw flightError;

      // Add flight players
      const playersToInsert = flightData.players.map((player, index) => ({
        flight_id: newFlight.id,
        user_id: player.userId || null,
        guest_name: player.userId ? null : player.name,
        player_order: index + 1
      }));

      const { error: playersError } = await supabase
        .from('flight_players')
        .insert(playersToInsert);

      if (playersError) throw playersError;

      // Load the complete flight data
      await loadFlightData(newFlight.id);
      
      toast({
        title: "Flight Created",
        description: `${flightData.name} is ready for players to join!`
      });

      return currentFlight!; // Will be set by loadFlightData
    } catch (error) {
      console.error('Error creating flight:', error);
      toast({
        title: "Error",
        description: "Failed to create flight",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, loadFlightData, currentFlight]);

  // Join an existing flight
  const joinFlight = useCallback(async (flightId: string) => {
    if (!user) throw new Error('User must be logged in to join a flight');

    try {
      setIsLoading(true);

      // Check if user is already in the flight
      const { data: existingPlayer } = await supabase
        .from('flight_players')
        .select('id')
        .eq('flight_id', flightId)
        .eq('user_id', user.id)
        .single();

      if (!existingPlayer) {
        // Add user to flight
        const { error: joinError } = await supabase
          .from('flight_players')
          .insert({
            flight_id: flightId,
            user_id: user.id,
            player_order: 999 // Will be updated by flight creator if needed
          });

        if (joinError) throw joinError;
      }

      // Load flight data
      await loadFlightData(flightId);
      
      toast({
        title: "Joined Flight",
        description: "Welcome to the flight!"
      });
    } catch (error) {
      console.error('Error joining flight:', error);
      toast({
        title: "Error", 
        description: "Failed to join flight",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, loadFlightData]);

  // Leave flight
  const leaveFlight = useCallback(async () => {
    if (!user || !currentFlight) return;

    try {
      setIsLoading(true);

      // Remove user from flight players
      const { error } = await supabase
        .from('flight_players')
        .delete()
        .eq('flight_id', currentFlight.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentFlight(null);
      setCurrentPlayer(null);
      setValidationStatuses([]);
      setNeedsValidation(false);

      toast({
        title: "Left Flight",
        description: "You have left the flight"
      });
    } catch (error) {
      console.error('Error leaving flight:', error);
      toast({
        title: "Error",
        description: "Failed to leave flight",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentFlight, toast]);

  // Refresh available flights
  const refreshFlights = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch flights for today
      const { data: flights, error } = await supabase
        .from('flights')
        .select('*')
        .eq('date_played', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all flight players
      const flightIds = flights.map(f => f.id);
      let allPlayersData: any[] = [];
      let allProfilesData: any[] = [];
      
      if (flightIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from('flight_players')
          .select('*')
          .in('flight_id', flightIds);

        if (!playersError && playersData) {
          allPlayersData = playersData;
          
          // Get all unique user IDs
          const userIds = [...new Set(playersData.filter(p => p.user_id).map(p => p.user_id))];
          
          if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', userIds);
            
            if (!profilesError && profiles) {
              allProfilesData = profiles;
            }
          }
        }
      }

      const transformedFlights: Flight[] = flights.map(flight => {
        const flightPlayers = allPlayersData.filter(p => p.flight_id === flight.id);
        
        const players: Player[] = flightPlayers.map(player => {
          const profile = allProfilesData.find(p => p.id === player.user_id);
          return {
            id: player.user_id || player.id,
            name: player.guest_name || profile?.display_name || 'Unknown Player',
            isRegistered: !!player.user_id,
            userId: player.user_id || undefined,
            displayName: profile?.display_name
          };
        });

        return {
          id: flight.id,
          name: flight.name,
          courseName: flight.course_name || '',
          datePlayedInfo: new Date(flight.date_played).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric', 
            month: 'short',
            day: 'numeric'
          }),
          weather: flight.weather || 'sunny',
          players,
          createdBy: flight.created_by,
          status: 'waiting'
        };
      });

      setAvailableFlights(transformedFlights);
    } catch (error) {
      console.error('Error refreshing flights:', error);
      toast({
        title: "Error",
        description: "Failed to load available flights",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete flight (only for flight creators)
  const deleteFlight = useCallback(async (flightId: string) => {
    if (!user) throw new Error('User must be logged in to delete a flight');

    try {
      setIsLoading(true);

      // Check if user is the flight creator
      const { data: flight, error: flightError } = await supabase
        .from('flights')
        .select('created_by')
        .eq('id', flightId)
        .single();

      if (flightError) throw flightError;

      if (flight.created_by !== user.id) {
        throw new Error('Only flight creators can delete flights');
      }

      // Delete flight players first (due to foreign key constraint)
      const { error: playersError } = await supabase
        .from('flight_players')
        .delete()
        .eq('flight_id', flightId);

      if (playersError) throw playersError;

      // Delete the flight
      const { error: deleteError } = await supabase
        .from('flights')
        .delete()
        .eq('id', flightId);

      if (deleteError) throw deleteError;

      // Clear current flight if it was the deleted one
      if (currentFlight?.id === flightId) {
        setCurrentFlight(null);
        setCurrentPlayer(null);
        setValidationStatuses([]);
        setNeedsValidation(false);
      }

      toast({
        title: "Flight Deleted",
        description: "The flight has been successfully deleted"
      });

      // Refresh flights list
      await refreshFlights();
    } catch (error) {
      console.error('Error deleting flight:', error);
      toast({
        title: "Error",
        description: "Failed to delete flight",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentFlight, toast, refreshFlights]);


  // Set up realtime subscriptions
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
        () => {
          if (currentFlight) {
            loadFlightData(currentFlight.id);
          }
          refreshFlights();
        }
      )
      .subscribe();

    // Initial load
    refreshFlights();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshFlights, loadFlightData, currentFlight]);

  const switchToPlayer = (player: Player) => {
    setCurrentPlayer(player);
  };

  const startValidation = () => {
    if (currentFlight) {
      const statuses: ValidationStatus[] = currentFlight.players.map(player => ({
        playerId: player.id,
        validationsReceived: 0,
        validationsNeeded: currentFlight.players.length - 1,
        status: 'pending' as const
      }));
      setValidationStatuses(statuses);
      setNeedsValidation(true);
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
  if (context === undefined) {
    throw new Error('useFlightContext must be used within a FlightProvider');
  }
  return context;
};