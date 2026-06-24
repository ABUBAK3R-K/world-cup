"use client";

import { useGameState } from '@/hooks/useGameState';
import { Header } from '@/components/Header';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { DraftScreen } from '@/components/screens/DraftScreen';
import { TeamBuilderScreen } from '@/components/screens/TeamBuilderScreen';
import { SimulationScreen } from '@/components/screens/SimulationScreen';
import { ResultsScreen } from '@/components/screens/ResultsScreen';

export default function App() {
  const { state } = useGameState();

  return (
    <main className="min-h-screen flex flex-col items-center pt-2 px-4 sm:px-8">
      <Header />
      {state.phase === 'HOME' && <HomeScreen />}
      {state.phase === 'DRAFTING' && <DraftScreen />}
      {state.phase === 'TEAM_BUILDING' && <TeamBuilderScreen />}
      {state.phase === 'SIMULATING' && <SimulationScreen />}
      {state.phase === 'RESULTS' && <ResultsScreen />}
    </main>
  );
}
