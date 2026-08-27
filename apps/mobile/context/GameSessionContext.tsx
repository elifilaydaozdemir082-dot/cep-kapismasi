import React, { createContext, useContext, useState, useEffect } from 'react';
import { mobileStorageService, MobilePlayer } from '../services/storage';

export type GameMode = 'single' | 'multiplayer';

export interface GameSession {
  mode: GameMode | null;
  players: MobilePlayer[];
  selectedGameId: string | null;
}

interface GameSessionContextType {
  session: GameSession;
  setMode: (mode: GameMode) => void;
  setPlayers: (players: MobilePlayer[]) => Promise<void>;
  setSelectedGameId: (id: string | null) => void;
  resetSession: () => void;
  isLoading: boolean;
}

const DEFAULT_SINGLE_PLAYER: MobilePlayer = {
  id: 'p1',
  name: 'Oyuncu 1',
  color: '#38BDF8',
};

const DEFAULT_MULTI_PLAYERS: MobilePlayer[] = [
  { id: 'p1', name: '1. Oyuncu', color: '#06B6D4' },
  { id: 'p2', name: '2. Oyuncu', color: '#EF4444' },
];

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export const GameSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<GameSession>({
    mode: null,
    players: [],
    selectedGameId: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedPlayers = await mobileStorageService.getPlayers();
      if (savedPlayers && savedPlayers.length > 0) {
        setSessionState((prev) => ({
          ...prev,
          players: savedPlayers,
        }));
      }
    } catch (e) {
      console.warn('Failed to load saved players:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = (mode: GameMode) => {
    setSessionState((prev) => {
      let initialPlayers = prev.players;
      if (mode === 'single') {
        if (!initialPlayers || initialPlayers.length === 0) {
          initialPlayers = [DEFAULT_SINGLE_PLAYER];
        } else {
          initialPlayers = [initialPlayers[0]];
        }
      } else if (mode === 'multiplayer') {
        if (!initialPlayers || initialPlayers.length < 2) {
          initialPlayers = DEFAULT_MULTI_PLAYERS;
        }
      }

      return {
        ...prev,
        mode,
        players: initialPlayers,
      };
    });
  };

  const setPlayers = async (newPlayers: MobilePlayer[]) => {
    setSessionState((prev) => ({
      ...prev,
      players: newPlayers,
    }));
    await mobileStorageService.savePlayers(newPlayers);
  };

  const setSelectedGameId = (id: string | null) => {
    setSessionState((prev) => ({
      ...prev,
      selectedGameId: id,
    }));
  };

  const resetSession = () => {
    setSessionState((prev) => ({
      ...prev,
      mode: null,
      selectedGameId: null,
    }));
  };

  return (
    <GameSessionContext.Provider
      value={{
        session,
        setMode,
        setPlayers,
        setSelectedGameId,
        resetSession,
        isLoading,
      }}
    >
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSession = () => {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
};
