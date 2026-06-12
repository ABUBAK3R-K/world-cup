"use client";

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Difficulty } from '@/types/game';
import { motion } from 'framer-motion';
import { Dices, UserCircle, Activity, ArrowRight } from 'lucide-react';

export function HomeScreen() {
  const { startGame } = useGameState();
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');

  const handleStart = () => {
    startGame(difficulty);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col pt-8 pb-16 px-4">
      
      {/* Top Split Section */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-20">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-ink)]/50 mb-6">
            DREAM WORLD CUP · 1975 — 2023
          </p>

          <div className="relative w-fit mb-8 select-none whitespace-nowrap">
            {/* Shadow layer */}
            <span className="text-[140px] sm:text-[180px] lg:text-[220px] leading-none font-black absolute top-2 left-4 text-[var(--theme-accent)] whitespace-nowrap">
              8-0
            </span>
            {/* Main layer */}
            <span className="text-[140px] sm:text-[180px] lg:text-[220px] leading-none font-black relative text-[var(--theme-ink)] whitespace-nowrap">
              8-0
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--theme-ink)] uppercase tracking-tighter leading-[0.9] mb-6">
            Roll the dice.<br />
            Build your dream<br />
            national team
          </h1>

          <p className="text-lg text-[var(--theme-ink)]/70 font-medium max-w-md mb-10 leading-snug">
            Roll the dice: you get a national team and a World Cup. Pick a star who was actually there, fill all 11 and simulate — does your team win 8-0?
          </p>

          {/* Action Area */}
          <div className="flex flex-col gap-4 max-w-sm">
            <button
              onClick={handleStart}
              className="w-full py-5 text-2xl font-black flex items-center justify-center gap-3 bg-[var(--theme-accent)] text-[#1a1a1a] border-2 border-[var(--theme-ink)] shadow-[6px_6px_0px_var(--theme-ink)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_var(--theme-ink)] active:translate-y-[6px] active:translate-x-[6px] active:shadow-[0px_0px_0px_var(--theme-ink)] transition-all uppercase tracking-tight"
            >
              PLAY NOW <ArrowRight className="w-6 h-6" />
            </button>

            <div className="flex gap-2">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-[var(--theme-ink)] transition-colors rounded-sm
                    ${difficulty === d ? 'bg-[var(--theme-ink)] text-[var(--theme-paper)]' : 'bg-transparent text-[var(--theme-ink)]/50 hover:bg-[var(--theme-ink)]/5'}
                  `}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cards Visual */}
        <div className="flex-1 relative min-h-[400px] lg:min-h-full flex items-center justify-center mt-12 lg:mt-0">
          <div className="relative w-full max-w-[320px] aspect-[4/5]">
            {/* Card 1 (Back left) */}
            <motion.div 
              initial={{ rotate: -15, x: -60, y: 40, opacity: 0 }}
              animate={{ rotate: -12, x: -40, y: 20, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute inset-0 m-auto w-48 h-72 border-4 border-[var(--theme-ink)] bg-[#FDB913] rounded-sm shadow-[8px_8px_0px_var(--theme-ink)] p-4 flex flex-col"
            >
              <div className="w-10 h-10 bg-[var(--theme-ink)] text-[var(--theme-paper)] flex items-center justify-center font-black rounded-sm self-end">92</div>
              <div className="mt-4 font-black text-2xl uppercase leading-none text-[#1a1a1a]">Ricky<br/>Ponting</div>
              <div className="mt-auto flex justify-between text-xs font-bold uppercase text-[#1a1a1a] border-t-2 border-[#1a1a1a]/20 pt-2">
                <span>BAT</span><span>95</span>
              </div>
            </motion.div>

            {/* Card 2 (Back right) */}
            <motion.div 
              initial={{ rotate: 15, x: 60, y: 40, opacity: 0 }}
              animate={{ rotate: 12, x: 40, y: 20, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 m-auto w-48 h-72 border-4 border-[var(--theme-ink)] bg-[#006600] rounded-sm shadow-[8px_8px_0px_var(--theme-ink)] p-4 flex flex-col"
            >
              <div className="w-10 h-10 bg-[var(--theme-ink)] text-[var(--theme-paper)] flex items-center justify-center font-black rounded-sm self-end">94</div>
              <div className="mt-4 font-black text-2xl uppercase leading-none text-white">Wasim<br/>Akram</div>
              <div className="mt-auto flex justify-between text-xs font-bold uppercase text-white border-t-2 border-white/20 pt-2">
                <span>BOWL</span><span>98</span>
              </div>
            </motion.div>

            {/* Card 3 (Center front) */}
            <motion.div 
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute inset-0 m-auto w-56 h-80 border-4 border-[var(--theme-ink)] bg-[#00529B] rounded-sm shadow-[12px_12px_0px_var(--theme-ink)] p-4 flex flex-col z-10"
            >
              <div className="w-12 h-12 bg-[var(--theme-ink)] text-[var(--theme-paper)] flex items-center justify-center font-black text-lg rounded-sm self-end">98</div>
              <div className="mt-4 font-black text-3xl uppercase leading-none text-white">Sachin<br/>Tendulkar</div>
              <div className="mt-auto space-y-2">
                 <div className="flex justify-between text-xs font-bold uppercase text-white border-t-2 border-white/20 pt-2">
                  <span>BAT</span><span>99</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase text-white border-t-2 border-white/20 pt-2">
                  <span>BOWL</span><span>70</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Steps Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-[var(--theme-paper)] border-y-2 md:border-2 border-[var(--theme-ink)] divide-y-2 md:divide-y-0 md:divide-x-2 divide-[var(--theme-ink)] mb-12 shadow-[0px_8px_0px_var(--theme-ink)]">
        <div className="p-6 sm:p-8 flex items-start gap-4">
          <span className="text-3xl sm:text-4xl font-black text-[var(--theme-accent)]">01</span>
          <div className="w-12 h-12 border-2 border-[var(--theme-ink)] bg-white dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <Dices className="w-6 h-6 text-[var(--theme-ink)]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--theme-ink)] uppercase tracking-tight">ROLL</h3>
            <p className="text-xs text-[var(--theme-ink)]/60 font-bold mt-1 leading-snug">Draws a national team and a World Cup</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex items-start gap-4">
          <span className="text-3xl sm:text-4xl font-black text-[var(--theme-accent)]">02</span>
          <div className="w-12 h-12 border-2 border-[var(--theme-ink)] bg-white dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <UserCircle className="w-6 h-6 text-[var(--theme-ink)]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--theme-ink)] uppercase tracking-tight">BUILD</h3>
            <p className="text-xs text-[var(--theme-ink)]/60 font-bold mt-1 leading-snug">Pick a star who played there</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex items-start gap-4">
          <span className="text-3xl sm:text-4xl font-black text-[var(--theme-accent)]">03</span>
          <div className="w-12 h-12 border-2 border-[var(--theme-ink)] bg-white dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-[var(--theme-ink)]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--theme-ink)] uppercase tracking-tight">SIMULATE</h3>
            <p className="text-xs text-[var(--theme-ink)]/60 font-bold mt-1 leading-snug">See if your team wins 8-0</p>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 border-t-2 border-[var(--theme-ink)]/10 text-[10px] sm:text-xs">
        <span className="font-bold text-[var(--theme-ink)]/60"><strong className="font-black text-[var(--theme-ink)] text-sm">18</strong> national teams</span>
        <span className="hidden sm:inline text-[var(--theme-ink)]/20">•</span>
        <span className="font-bold text-[var(--theme-ink)]/60"><strong className="font-black text-[var(--theme-ink)] text-sm">75</strong> squads</span>
        <span className="hidden sm:inline text-[var(--theme-ink)]/20">•</span>
        <span className="font-bold text-[var(--theme-ink)]/60"><strong className="font-black text-[var(--theme-ink)] text-sm">1,065</strong> player versions</span>
      </div>
      
    </div>
  );
}
