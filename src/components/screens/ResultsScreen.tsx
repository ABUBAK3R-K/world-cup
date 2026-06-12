"use client";

import { useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { MatchResult } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';

type MatchDisplay = MatchResult & { stageLabel: string };

export function ResultsScreen() {
  const { state, setPhase, resetGame } = useGameState();
  const results = state.tournamentResults;
  
  const [revealedMatches, setRevealedMatches] = useState<MatchDisplay[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [mode, setMode] = useState<'MATCH' | 'AUTO'>('MATCH');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!results) return;

    const allMatches: MatchDisplay[] = [];
    results.groupStage.forEach(m => allMatches.push({ ...m, stageLabel: 'GROUPS' }));
    results.quarterFinals.forEach(m => allMatches.push({ ...m, stageLabel: 'QUARTERS' }));
    results.semiFinals.forEach(m => allMatches.push({ ...m, stageLabel: 'SEMIS' }));
    if (results.final.team1) {
      allMatches.push({ ...results.final, stageLabel: 'FINAL' });
    }

    if (mode === 'AUTO') {
      setRevealedMatches(allMatches);
      setShowSummary(true);
      return;
    }

    if (currentIndex === 0) {
      setRevealedMatches([]);
      setShowSummary(false);
    }

    if (currentIndex < allMatches.length) {
      const timer = setTimeout(() => {
        setRevealedMatches(prev => {
          const nextMatch = allMatches[currentIndex];
          // Prevent duplicates if React strict mode double-invokes
          if (!prev.find(m => m.team1 === nextMatch.team1 && m.team2 === nextMatch.team2 && m.stageLabel === nextMatch.stageLabel)) {
             return [...prev, nextMatch];
          }
          return prev;
        });
        setCurrentIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowSummary(true);
    }
  }, [results, mode, currentIndex]);

  // Reset animation if mode changes to MATCH while already auto
  useEffect(() => {
    if (mode === 'MATCH') {
      setCurrentIndex(0);
      setRevealedMatches([]);
      setShowSummary(false);
    }
  }, [mode]);

  if (!results) return null;

  const totalMatches = revealedMatches.length;
  const wins = revealedMatches.filter(m => m.winner === 'Your XI').length;
  const losses = totalMatches - wins;
  
  let totalRuns = 0;
  let totalWickets = 0;
  revealedMatches.forEach(m => {
    if (m.team1 === 'Your XI') {
      totalRuns += m.team1Score;
      totalWickets += m.team1Wickets;
    } else if (m.team2 === 'Your XI') {
      totalRuns += m.team2Score;
      totalWickets += m.team2Wickets;
    }
  });

  return (
    <div className="w-full max-w-4xl mx-auto pb-12 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-[var(--theme-ink)] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-ink)]/50 mb-1">
            THE RUN · SEED #{Math.floor(Math.random() * 100000).toString(16).toUpperCase()}
          </p>
          <h1 className="text-6xl sm:text-7xl font-black text-[var(--theme-ink)] tracking-tighter leading-none">The run</h1>
        </div>
        
        <div className="flex bg-[var(--theme-paper)] border-2 border-[var(--theme-ink)] p-0.5 w-full sm:w-auto">
          <button 
            onClick={() => setMode('MATCH')}
            className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors ${mode === 'MATCH' ? 'bg-[#f4f1ea] text-[var(--theme-ink)]' : 'bg-transparent text-[var(--theme-ink)]/50'}`}
          >
            Match by match
          </button>
          <button 
            onClick={() => setMode('AUTO')}
            className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors ${mode === 'AUTO' ? 'bg-[var(--theme-ink)] text-[var(--theme-paper)]' : 'bg-transparent text-[var(--theme-ink)]/50'}`}
          >
            Automatic
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        <AnimatePresence>
          {revealedMatches.map((match, idx) => {
            const isWin = match.winner === 'Your XI';
            const opponentName = match.team1 === 'Your XI' ? match.team2 : match.team1;
            const myScore = match.team1 === 'Your XI' ? match.team1Score : match.team2Score;
            const oppScore = match.team1 === 'Your XI' ? match.team2Score : match.team1Score;
            const myWkts = match.team1 === 'Your XI' ? match.team1Wickets : match.team2Wickets;
            const oppWkts = match.team1 === 'Your XI' ? match.team2Wickets : match.team1Wickets;

            // Determine innings order
            let iBatFirst = true;
            if (match.battingFirst) {
              iBatFirst = match.battingFirst === 'Your XI';
            }

            const firstInningsScore = iBatFirst ? myScore : oppScore;
            const firstInningsWkts = iBatFirst ? myWkts : oppWkts;
            const firstInningsName = iBatFirst ? 'YOUR XI' : opponentName;

            const secondInningsScore = iBatFirst ? oppScore : myScore;
            const secondInningsWkts = iBatFirst ? oppWkts : myWkts;
            const secondInningsName = !iBatFirst ? 'YOUR XI' : opponentName;

            return (
              <motion.div 
                key={`${idx}-${match.team1}-${match.team2}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--theme-paper)] border-2 border-[var(--theme-ink)] p-4 sm:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4"
              >
                <div className="w-full xl:w-32 shrink-0 border-b-2 xl:border-b-0 border-[var(--theme-ink)]/10 pb-2 xl:pb-0">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-ink)]/60">{match.stageLabel}</span>
                </div>
                
                <div className="flex-1 w-full xl:px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[var(--theme-ink)]/40">VS</span>
                    <span className="text-xl sm:text-2xl font-black text-[var(--theme-ink)] uppercase tracking-tight truncate">{opponentName}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-ink)]/40 mt-1 flex flex-wrap gap-2 items-center">
                    <span>MATCH SUMMARY</span>
                    {match.tossWinner && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--theme-ink)]/20"></span>
                        <span>
                          TOSS WON BY {match.tossWinner.toUpperCase()} (CHOSE TO {match.tossDecision})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className={`flex items-center justify-between w-full xl:w-auto gap-4 sm:gap-6 xl:pl-4 border-t-2 xl:border-t-0 border-[var(--theme-ink)]/10 pt-3 xl:pt-0 ${isWin ? 'text-[#2d6a4f]' : 'text-[#e64a33]'}`}>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{firstInningsName}</span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tighter flex items-baseline gap-1">
                      <span>{firstInningsScore}</span><span className="text-sm opacity-60">/{firstInningsWkts}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center px-1">
                    <span className="text-xs font-black opacity-30 tracking-widest uppercase">Target</span>
                    <span className="text-sm font-black opacity-50">{firstInningsScore + 1}</span>
                  </div>

                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate max-w-[100px] mb-1">{secondInningsName}</span>
                    <div className="text-2xl sm:text-3xl font-black tracking-tighter flex items-baseline gap-1">
                      <span>{secondInningsScore}</span><span className="text-sm opacity-60">/{secondInningsWkts}</span>
                    </div>
                  </div>
                  
                  <div className="w-6 flex justify-center ml-2">
                    {isWin ? <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={4} /> : <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={4} />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary Footer */}
      {showSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 space-y-6"
        >
          <div className="bg-[#1a1a1a] text-white p-6 sm:p-8 flex flex-col sm:flex-row gap-8 shadow-[8px_8px_0px_var(--theme-accent)]">
            <div className="flex flex-col items-center justify-center sm:border-r-2 border-white/10 sm:pr-8">
              <span className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2">{wins}-{losses}</span>
              <span className="text-8xl font-black leading-none tracking-tighter text-white drop-shadow-[4px_4px_0px_#e64a33]">
                {wins}<span className="text-6xl text-white/50">-</span>{losses}
              </span>
            </div>
            
            <div className="flex flex-col justify-center gap-6">
              <div>
                <h3 className="text-2xl font-black text-white/90 uppercase tracking-tight">{wins} WINS</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                <div>
                  <div className="text-5xl font-black text-[#FDB913] mb-1">{totalRuns}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">TOTAL RUNS SCORED</div>
                </div>
                <div>
                  <div className="text-5xl font-black text-[#FDB913] mb-1">{totalWickets}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">TOTAL WICKETS TAKEN</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={resetGame}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-[var(--theme-ink)] bg-[var(--theme-paper)] hover:bg-[var(--theme-ink)]/5 transition-colors text-[var(--theme-ink)] font-black text-sm uppercase tracking-wider shrink-0 shadow-[4px_4px_0px_var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)]"
            >
              <RotateCcw className="w-4 h-4" /> REPLAY
            </button>
            <button 
              onClick={() => setPhase('TEAM_BUILDING')}
              className="flex-1 flex items-center justify-center gap-3 bg-[#e64a33] hover:bg-[#d53e28] transition-colors text-white border-2 border-[var(--theme-ink)] shadow-[4px_4px_0px_var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)] py-4 text-xl sm:text-2xl font-black uppercase tracking-tight"
            >
              SEE MY CARD <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
