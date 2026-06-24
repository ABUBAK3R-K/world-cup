/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { MatchResult, DraftedPlayer } from '@/types/game';
import { getRoleLabel } from '@/lib/teamStrength';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight, Share2, Shield } from 'lucide-react';

type MatchDisplay = MatchResult & { stageLabel: string };

const teamThemes: Record<string, { bg: string, text: string, muted: string }> = {
  'India': { bg: 'bg-[#00529B]', text: 'text-white', muted: 'text-white/70' },
  'Australia': { bg: 'bg-[#FDB913]', text: 'text-[#1a1a1a]', muted: 'text-[#1a1a1a]/70' },
  'South Africa': { bg: 'bg-[#007749]', text: 'text-white', muted: 'text-white/70' },
  'Pakistan': { bg: 'bg-[#006600]', text: 'text-white', muted: 'text-white/70' },
  'England': { bg: 'bg-[#CE1126]', text: 'text-white', muted: 'text-white/70' },
  'New Zealand': { bg: 'bg-[#1a1a1a]', text: 'text-white', muted: 'text-white/70' },
  'Sri Lanka': { bg: 'bg-[#002366]', text: 'text-white', muted: 'text-white/70' },
  'West Indies': { bg: 'bg-[#7A003C]', text: 'text-white', muted: 'text-white/70' },
  'Bangladesh': { bg: 'bg-[#006A4E]', text: 'text-white', muted: 'text-white/70' },
  'Zimbabwe': { bg: 'bg-[#DA291C]', text: 'text-white', muted: 'text-white/70' },
  'Netherlands': { bg: 'bg-[#FF4F00]', text: 'text-white', muted: 'text-white/70' },
  'Ireland': { bg: 'bg-[#009A44]', text: 'text-white', muted: 'text-white/70' },
  'Afghanistan': { bg: 'bg-[#0033A0]', text: 'text-white', muted: 'text-white/70' },
  'Scotland': { bg: 'bg-[#002B5C]', text: 'text-white', muted: 'text-white/70' },
  'Kenya': { bg: 'bg-[#008000]', text: 'text-white', muted: 'text-white/70' },
  'Canada': { bg: 'bg-[#FF0000]', text: 'text-white', muted: 'text-white/70' },
  'default': { bg: 'bg-white', text: 'text-[#1a1a1a]', muted: 'text-[#1a1a1a]/70' }
};

function getTeamTheme(teamName: string) {
  return teamThemes[teamName] || teamThemes['default'];
}

export function ResultsScreen() {
  const { state, resetGame } = useGameState();
  const results = state.tournamentResults;
  
  const [seed, setSeed] = useState('');
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 100000).toString(16).toUpperCase());
  }, []);
  
  const [revealedMatches, setRevealedMatches] = useState<MatchDisplay[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [mode, setMode] = useState<'MATCH' | 'AUTO'>('MATCH');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'MATCHES' | 'MY_CARD'>('MATCHES');

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

  const orderedSquad = [...state.battingOrder]
    .sort((a, b) => a.position - b.position)
    .map(bo => state.squad.find(p => p.id === bo.playerVersionId))
    .filter(Boolean) as DraftedPlayer[];

  const handleShare = () => {
    const text = `I just built my World Cup XI and got ${wins} wins and ${losses} losses! Can you do better?`;
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: 'World Cup Draft XI',
        text,
        url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text} Play here: ${url}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-[var(--theme-ink)] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-ink)]/50 mb-1">
            {viewMode === 'MY_CARD' ? 'YOUR SQUAD' : `THE RUN · SEED #${seed}`}
          </p>
          <h1 className="text-6xl sm:text-7xl font-black text-[var(--theme-ink)] tracking-tighter leading-none">
            {viewMode === 'MY_CARD' ? 'My Cards' : 'The run'}
          </h1>
        </div>
        
        {viewMode === 'MATCHES' && (
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
        )}
      </div>

      {viewMode === 'MY_CARD' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {orderedSquad.map((option, idx) => {
              const roleLabel = getRoleLabel(option.battingRating, option.bowlingRating);
              const theme = getTeamTheme(option.team);
              const themeHex = theme.bg.startsWith('bg-[') ? theme.bg.slice(4, -1) : (theme.bg === 'bg-white' ? '#ffffff' : 'inherit');
              const isDarkCard = theme.text === 'text-white';
              const badgeBgClass = isDarkCard ? 'bg-white' : 'bg-[var(--theme-ink)]';

              return (
                <div
                  key={option.id}
                  className={`p-4 flex flex-col items-start relative overflow-hidden border-2 border-[var(--theme-ink)] rounded-sm ${theme.bg} shadow-[4px_4px_0px_var(--theme-ink)]`}
                >
                  <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[var(--theme-ink)] text-[var(--theme-paper)] font-black text-sm rounded-sm z-10">
                    {option.overallRating}
                  </div>

                  <div className="w-[calc(100%-2rem)] mb-3 z-10 min-h-[2.5rem] flex items-start">
                    <div className={`text-sm font-black leading-tight uppercase ${theme.text} line-clamp-2 break-words`}>
                      <span className="text-[10px] opacity-70 block mb-0.5">#{idx + 1}</span>
                      {option.player.name}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 w-full mb-3 z-10">
                    <span 
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${badgeBgClass}`}
                      style={{ color: themeHex }}
                    >
                      {option.battingOrderType}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm text-[var(--theme-ink)] bg-white border border-[var(--theme-ink)]/20">
                      {roleLabel}
                    </span>
                    {option.isWicketkeeper && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-300 text-amber-900 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 border border-amber-400">
                        <Shield className="w-2.5 h-2.5" /> WK
                      </span>
                    )}
                  </div>

                  <div className="w-full space-y-1.5 text-xs z-10 mt-auto">
                    <div className="flex justify-between border-b border-current opacity-80 pb-1">
                      <span className={`font-bold uppercase text-[10px] ${theme.text}`}>Bat</span>
                      <span className={`font-black ${theme.text}`}>{option.battingRating}</span>
                    </div>
                    <div className="flex justify-between border-b border-current opacity-80 pb-1">
                      <span className={`font-bold uppercase text-[10px] ${theme.text}`}>Bowl</span>
                      <span className={`font-black ${theme.text}`}>{option.bowlingRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-bold uppercase text-[10px] ${theme.text}`}>Field</span>
                      <span className={`font-black ${theme.text}`}>{option.fieldingRating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1a1a1a] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8 shadow-[8px_8px_0px_var(--theme-accent)]">
            <div className="flex flex-col items-center justify-center sm:border-r-2 border-white/10 sm:pr-8">
              <span className="text-xs font-black text-[var(--theme-accent)] uppercase tracking-widest mb-2">RESULTS</span>
              <span className="text-6xl font-black leading-none tracking-tighter text-white drop-shadow-[4px_4px_0px_#e64a33]">
                {wins}<span className="text-4xl text-white/50">-</span>{losses}
              </span>
            </div>
            
            <div className="flex flex-col justify-center gap-4 flex-1">
              <div>
                <h3 className="text-xl font-black text-white/90 uppercase tracking-tight">{wins >= 3 ? 'KNOCKOUTS REACHED' : 'ELIMINATED IN GROUPS'}</h3>
                <p className="text-sm font-medium text-white/50">{totalRuns} Runs · {totalWickets} Wickets</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
              <button 
                onClick={handleShare}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#e64a33] hover:bg-[#d53e28] transition-colors text-white font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_var(--theme-ink)] border-2 border-[var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)]"
              >
                <Share2 className="w-4 h-4" /> SHARE RESULTS
              </button>
              <button 
                onClick={resetGame}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-transparent hover:bg-white/5 transition-colors text-white font-black text-sm uppercase tracking-wider border-2 border-white/20"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN
              </button>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
             <button 
               onClick={() => setViewMode('MATCHES')}
               className="text-sm font-bold uppercase tracking-widest text-[var(--theme-ink)]/50 hover:text-[var(--theme-ink)] transition-colors underline underline-offset-4"
             >
               BACK TO MATCH LOG
             </button>
          </div>
        </div>
      ) : (
        <>
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
                  onClick={() => setViewMode('MY_CARD')}
                  className="flex-1 flex items-center justify-center gap-3 bg-[#e64a33] hover:bg-[#d53e28] transition-colors text-white border-2 border-[var(--theme-ink)] shadow-[4px_4px_0px_var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)] py-4 text-xl sm:text-2xl font-black uppercase tracking-tight"
                >
                  SEE MY CARD <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
