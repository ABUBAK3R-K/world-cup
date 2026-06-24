"use client";

import { useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { motion } from 'framer-motion';

export function SimulationScreen() {
  const { state, setTournamentResults } = useGameState();
  const [status, setStatus] = useState("Initializing Simulation Engine...");

  useEffect(() => {
    let isMounted = true;
    const runSim = async () => {
      setTimeout(() => { if (isMounted) setStatus("Simulating Group Stage...") }, 1000);
      setTimeout(() => { if (isMounted) setStatus("Calculating Knockouts...") }, 2500);
      
      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ squad: state.squad, battingOrder: state.battingOrder })
        });
        const data = await res.json();
        
        setTimeout(() => {
          if (isMounted) setTournamentResults(data);
        }, 4000);
      } catch (err) {
        console.error(err);
      }
    };

    runSim();
    return () => { isMounted = false; };
  }, [state.squad, state.battingOrder, setTournamentResults]);

  return (
    <div className="flex flex-col items-center justify-center space-y-10">
      {/* Spinning loader */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 border-t-4 border-[var(--theme-accent)] rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-4 border-b-4 border-[var(--theme-ink)] rounded-full"
        />
        <div className="text-3xl font-black text-[var(--theme-ink)]">XI</div>
      </div>
      <motion.h2 
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-[var(--theme-ink)] uppercase tracking-wider"
      >
        {status}
      </motion.h2>
    </div>
  );
}
