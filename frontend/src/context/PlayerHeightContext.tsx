'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PlayerHeightContextType {
  playerHeight: number;
  setPlayerHeight: (height: number) => void;
}

const PlayerHeightContext = createContext<PlayerHeightContextType | undefined>(undefined);

export const PlayerHeightProvider = ({ children }: { children: ReactNode }) => {
  const [playerHeight, setPlayerHeight] = useState(0);

  return (
    <PlayerHeightContext.Provider value={{ playerHeight, setPlayerHeight }}>
      {children}
    </PlayerHeightContext.Provider>
  );
};

export const usePlayerHeight = () => {
  const context = useContext(PlayerHeightContext);
  if (context === undefined) {
    throw new Error('usePlayerHeight must be used within a PlayerHeightProvider');
  }
  return context;
};