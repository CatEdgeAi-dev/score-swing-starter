import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useFlightContext } from '@/contexts/FlightContext';

export interface HoleData {
  strokes: number;
  putts: number;
  fairwayHit: boolean;
  greenInRegulation: boolean;
  upAndDown: boolean;
  notes: string;
  par: number;
}

interface ScorecardContextType {
  holes: Record<number, HoleData>;
  updateHole: (holeNumber: number, data: Partial<HoleData>) => void;
  resetScorecard: () => void;
  getTotalScore: () => number;
  getAveragePutts: () => number;
  getGIRPercentage: () => number;
  getFairwayPercentage: () => number;
}

const ScorecardContext = createContext<ScorecardContextType | undefined>(undefined);

const defaultPars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4];

const createEmptyScorecard = (): Record<number, HoleData> => {
  const holes: Record<number, HoleData> = {};
  for (let i = 1; i <= 18; i++) {
    holes[i] = {
      strokes: 0,
      putts: 0,
      fairwayHit: false,
      greenInRegulation: false,
      upAndDown: false,
      notes: '',
      par: defaultPars[i - 1],
    };
  }
  return holes;
};

export const ScorecardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentPlayer, isFlightMode } = useFlightContext();
  
  // Store scorecards for each player (or solo play)
  const [playerScorecards, setPlayerScorecards] = useState<Record<string, Record<number, HoleData>>>(() => {
    return { 'solo': createEmptyScorecard() };
  });

  // Current active scorecard
  const [holes, setHoles] = useState<Record<number, HoleData>>(createEmptyScorecard());

  // Effect to switch between player scorecards
  useEffect(() => {
    const playerId = isFlightMode && currentPlayer ? currentPlayer.id : 'solo';
    
    // Save current scorecard to the current player
    const currentPlayerId = Object.keys(playerScorecards).find(id => 
      JSON.stringify(playerScorecards[id]) === JSON.stringify(holes)
    );
    
    // Load or create scorecard for the new player
    if (!playerScorecards[playerId]) {
      setPlayerScorecards(prev => ({
        ...prev,
        [playerId]: createEmptyScorecard()
      }));
      setHoles(createEmptyScorecard());
    } else {
      setHoles(playerScorecards[playerId]);
    }
  }, [currentPlayer, isFlightMode]);

  const resetScorecard = () => {
    const emptyScorecard = createEmptyScorecard();
    const playerId = isFlightMode && currentPlayer ? currentPlayer.id : 'solo';
    
    setHoles(emptyScorecard);
    setPlayerScorecards(prev => ({
      ...prev,
      [playerId]: emptyScorecard
    }));
  };

  const updateHole = (holeNumber: number, data: Partial<HoleData>) => {
    const playerId = isFlightMode && currentPlayer ? currentPlayer.id : 'solo';
    
    const updatedHoles = {
      ...holes,
      [holeNumber]: { ...holes[holeNumber], ...data }
    };
    
    setHoles(updatedHoles);
    setPlayerScorecards(prev => ({
      ...prev,
      [playerId]: updatedHoles
    }));
  };

  const getTotalScore = () => {
    return Object.values(holes).reduce((total, hole) => total + hole.strokes, 0);
  };

  const getAveragePutts = () => {
    const totalPutts = Object.values(holes).reduce((total, hole) => total + hole.putts, 0);
    const holesPlayed = Object.values(holes).filter(hole => hole.strokes > 0).length;
    return holesPlayed > 0 ? totalPutts / holesPlayed : 0;
  };

  const getGIRPercentage = () => {
    const holesPlayed = Object.values(holes).filter(hole => hole.strokes > 0);
    const girsHit = holesPlayed.filter(hole => hole.greenInRegulation).length;
    return holesPlayed.length > 0 ? (girsHit / holesPlayed.length) * 100 : 0;
  };

  const getFairwayPercentage = () => {
    const drivingHoles = Object.values(holes).filter(hole => hole.par > 3 && hole.strokes > 0);
    const fairwaysHit = drivingHoles.filter(hole => hole.fairwayHit).length;
    return drivingHoles.length > 0 ? (fairwaysHit / drivingHoles.length) * 100 : 0;
  };

  return (
    <ScorecardContext.Provider value={{
      holes,
      updateHole,
      resetScorecard,
      getTotalScore,
      getAveragePutts,
      getGIRPercentage,
      getFairwayPercentage
    }}>
      {children}
    </ScorecardContext.Provider>
  );
};

export const useScorecardContext = () => {
  const context = useContext(ScorecardContext);
  if (context === undefined) {
    throw new Error('useScorecardContext must be used within a ScorecardProvider');
  }
  return context;
};