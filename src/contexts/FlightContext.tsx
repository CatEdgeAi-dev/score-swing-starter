import { useState, createContext, useContext, ReactNode } from 'react';

interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
}

interface Flight {
  id: string;
  name: string;
  courseName: string;
  datePlayedInfo: string;
  weather: string;
  players: Player[];
  createdBy: string;
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
  }) => Flight;
  leaveFlight: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const FlightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const isFlightMode = currentFlight !== null;

  const switchToPlayer = (player: Player) => {
    setCurrentPlayer(player);
  };

  const createFlight = (flightData: {
    name: string;
    courseName: string;
    players: Player[];
  }): Flight => {
    const newFlight: Flight = {
      id: `flight-${Date.now()}`,
      name: flightData.name,
      courseName: flightData.courseName,
      datePlayedInfo: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      weather: 'sunny',
      players: flightData.players,
      createdBy: flightData.players[0].userId || flightData.players[0].id
    };

    setCurrentFlight(newFlight);
    setCurrentPlayer(flightData.players[0]); // Start with the first player

    return newFlight;
  };

  const leaveFlight = () => {
    setCurrentFlight(null);
    setCurrentPlayer(null);
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