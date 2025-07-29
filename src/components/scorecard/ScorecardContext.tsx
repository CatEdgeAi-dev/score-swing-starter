import React, { createContext, useContext, useState, ReactNode } from 'react';

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

export const ScorecardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [holes, setHoles] = useState<Record<number, HoleData>>(() => {
    const initialHoles: Record<number, HoleData> = {};
    for (let i = 1; i <= 18; i++) {
      initialHoles[i] = {
        strokes: 0,
        putts: 0,
        fairwayHit: false,
        greenInRegulation: false,
        upAndDown: false,
        notes: '',
        par: defaultPars[i - 1],
      };
    }
    return initialHoles;
  });

  const resetScorecard = () => {
    const initialHoles: Record<number, HoleData> = {};
    for (let i = 1; i <= 18; i++) {
      initialHoles[i] = {
        strokes: 0,
        putts: 0,
        fairwayHit: false,
        greenInRegulation: false,
        upAndDown: false,
        notes: '',
        par: defaultPars[i - 1],
      };
    }
    setHoles(initialHoles);
  };

  const updateHole = (holeNumber: number, data: Partial<HoleData>) => {
    setHoles(prev => ({
      ...prev,
      [holeNumber]: { ...prev[holeNumber], ...data }
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