"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { GameState, GamePhase, Difficulty, DraftedPlayer, BattingOrder, TournamentResult } from '../types/game';

const initialState: GameState = {
  phase: 'HOME',
  difficulty: 'EASY',
  rerollsLeft: 0,
  currentSpin: null,
  draftRound: 1,
  squad: [],
  battingOrder: Array.from({ length: 11 }, (_, i) => ({ position: i + 1, playerVersionId: null })),
  tournamentResults: null,
};

export function useGameStateManager() {
  const [state, setState] = useState<GameState>(initialState);

  const setPhase = useCallback((phase: GamePhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const startGame = useCallback((difficulty: Difficulty) => {
    let rerollsLeft = 0;
    if (difficulty === 'EASY') rerollsLeft = 5;
    if (difficulty === 'MEDIUM') rerollsLeft = 3;
    if (difficulty === 'HARD') rerollsLeft = 1;
    
    setState((prev) => ({
      ...prev,
      phase: 'DRAFTING',
      difficulty,
      rerollsLeft,
      currentSpin: null,
      draftRound: 1,
      squad: [],
      battingOrder: Array.from({ length: 11 }, (_, i) => ({ position: i + 1, playerVersionId: null })),
    }));
  }, []);

  const setSpin = useCallback((spin: { team: string, year: number }) => {
    setState((prev) => ({ ...prev, currentSpin: spin }));
  }, []);

  const useReroll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rerollsLeft: Math.max(0, prev.rerollsLeft - 1),
      currentSpin: null
    }));
  }, []);

  const addDraftPick = useCallback((player: DraftedPlayer, position: number) => {
    setState((prev) => {
      const newSquad = [...prev.squad, player];
      
      const newBattingOrder = [...prev.battingOrder];
      const slotIndex = newBattingOrder.findIndex(s => s.position === position);
      if (slotIndex !== -1) {
        newBattingOrder[slotIndex] = { ...newBattingOrder[slotIndex], playerVersionId: player.id };
      }
      
      return {
        ...prev,
        squad: newSquad,
        battingOrder: newBattingOrder,
        draftRound: prev.draftRound + 1,
        currentSpin: null,
        phase: prev.draftRound === 11 ? 'TEAM_BUILDING' : 'DRAFTING'
      };
    });
  }, []);

  const updateBattingOrder = useCallback((battingOrder: BattingOrder[]) => {
    setState((prev) => ({ ...prev, battingOrder }));
  }, []);

  const setTournamentResults = useCallback((results: TournamentResult) => {
    setState((prev) => ({ ...prev, tournamentResults: results, phase: 'RESULTS' }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setPhase,
    startGame,
    setSpin,
    useReroll,
    addDraftPick,
    updateBattingOrder,
    setTournamentResults,
    resetGame,
  };
}

export const GameStateContext = createContext<ReturnType<typeof useGameStateManager> | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const value = useGameStateManager();
  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
