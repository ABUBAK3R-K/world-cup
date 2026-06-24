/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { MatchResult, DraftedPlayer } from '@/types/game';
import { getRoleLabel } from '@/lib/teamStrength';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCcw, ArrowRight, Share2, Shield, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

type MatchDisplay = MatchResult & { stageLabel: string };

const teamThemes: Record<string, { bg: string, text: string, muted: string, hex: string }> = {
  'India': { bg: 'bg-[#00529B]', text: 'text-white', muted: 'text-white/70', hex: '#00529B' },
  'Australia': { bg: 'bg-[#FDB913]', text: 'text-[#1a1a1a]', muted: 'text-[#1a1a1a]/70', hex: '#FDB913' },
  'South Africa': { bg: 'bg-[#007749]', text: 'text-white', muted: 'text-white/70', hex: '#007749' },
  'Pakistan': { bg: 'bg-[#006600]', text: 'text-white', muted: 'text-white/70', hex: '#006600' },
  'England': { bg: 'bg-[#CE1126]', text: 'text-white', muted: 'text-white/70', hex: '#CE1126' },
  'New Zealand': { bg: 'bg-[#1a1a1a]', text: 'text-white', muted: 'text-white/70', hex: '#1a1a1a' },
  'Sri Lanka': { bg: 'bg-[#002366]', text: 'text-white', muted: 'text-white/70', hex: '#002366' },
  'West Indies': { bg: 'bg-[#7A003C]', text: 'text-white', muted: 'text-white/70', hex: '#7A003C' },
  'Bangladesh': { bg: 'bg-[#006A4E]', text: 'text-white', muted: 'text-white/70', hex: '#006A4E' },
  'Zimbabwe': { bg: 'bg-[#DA291C]', text: 'text-white', muted: 'text-white/70', hex: '#DA291C' },
  'Netherlands': { bg: 'bg-[#FF4F00]', text: 'text-white', muted: 'text-white/70', hex: '#FF4F00' },
  'Ireland': { bg: 'bg-[#009A44]', text: 'text-white', muted: 'text-white/70', hex: '#009A44' },
  'Afghanistan': { bg: 'bg-[#0033A0]', text: 'text-white', muted: 'text-white/70', hex: '#0033A0' },
  'Scotland': { bg: 'bg-[#002B5C]', text: 'text-white', muted: 'text-white/70', hex: '#002B5C' },
  'Kenya': { bg: 'bg-[#008000]', text: 'text-white', muted: 'text-white/70', hex: '#008000' },
  'Canada': { bg: 'bg-[#FF0000]', text: 'text-white', muted: 'text-white/70', hex: '#FF0000' },
  'default': { bg: 'bg-white', text: 'text-[#1a1a1a]', muted: 'text-[#1a1a1a]/70', hex: '#ffffff' }
};

function getTeamTheme(teamName: string) {
  return teamThemes[teamName] || teamThemes['default'];
}

export function ResultsScreen() {
  const { state, resetGame } = useGameState();
  const results = state.tournamentResults;
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const [seed, setSeed] = useState('');
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 100000).toString(16).toUpperCase());
  }, []);
  
  const [revealedMatches, setRevealedMatches] = useState<MatchDisplay[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [mode, setMode] = useState<'MATCH' | 'AUTO'>('MATCH');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'MATCHES' | 'MY_CARD'>('MATCHES');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  const generateShareImage = async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;
    
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#f4f1ea',
        scale: 2,
        useCORS: true,
        logging: false,
        width: shareCardRef.current.scrollWidth,
        height: shareCardRef.current.scrollHeight,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
      return null;
    }
  };

  const handleShare = async () => {
    setIsGeneratingImage(true);

    try {
      const blob = await generateShareImage();
      
      if (!blob) {
        // Fallback to text-only share
        const text = `I just built my World Cup XI and got ${wins} wins and ${losses} losses! Can you do better?`;
        const url = window.location.origin;
        if (navigator.share) {
          await navigator.share({ title: 'World Cup Draft XI', text, url });
        } else {
          await navigator.clipboard.writeText(`${text} Play here: ${url}`);
          alert('Link copied to clipboard!');
        }
        return;
      }

      const file = new File([blob], 'my-world-cup-xi.png', { type: 'image/png' });

      // Try native share with file first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My World Cup XI',
          text: `I just built my World Cup XI and got ${wins} wins and ${losses} losses! Can you do better?`,
          files: [file],
          url: window.location.origin,
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-world-cup-xi.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsGeneratingImage(false);
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
          {/* ====== SHAREABLE CARD AREA — captured by html2canvas ====== */}
          <div ref={shareCardRef} style={{ backgroundColor: '#f4f1ea', padding: '24px', borderRadius: '2px' }}>
            {/* Card Header */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#1a1a1a80', marginBottom: '4px' }}>YOUR SQUAD</div>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}>My Cards</div>
              <div style={{ height: '2px', backgroundColor: '#1a1a1a', marginTop: '12px' }} />
            </div>

            {/* Player Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {orderedSquad.map((option, idx) => {
                const roleLabel = getRoleLabel(option.battingRating, option.bowlingRating);
                const theme = getTeamTheme(option.team);
                const themeHex = theme.hex;
                const isDarkCard = theme.text === 'text-white';
                const badgeBg = isDarkCard ? '#ffffff' : '#1a1a1a';
                const badgeText = themeHex;
                const textColor = isDarkCard ? '#ffffff' : '#1a1a1a';
                const mutedColor = isDarkCard ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,26,0.7)';

                return (
                  <div
                    key={option.id}
                    style={{
                      backgroundColor: themeHex,
                      border: '2px solid #1a1a1a',
                      borderRadius: '2px',
                      padding: '14px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      boxShadow: '4px 4px 0px #1a1a1a',
                    }}
                  >
                    {/* OVR Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1a1a1a',
                      color: '#f4f1ea',
                      fontWeight: 900,
                      fontSize: '13px',
                      borderRadius: '2px',
                    }}>
                      {option.overallRating}
                    </div>

                    {/* Position & Name */}
                    <div style={{ marginBottom: '10px', paddingRight: '36px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: mutedColor, marginBottom: '2px' }}>#{idx + 1}</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: textColor, textTransform: 'uppercase' as const, lineHeight: 1.2 }}>
                        {option.player.name}
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: badgeBg,
                        color: badgeText,
                      }}>
                        {option.battingOrderType}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: '#ffffff',
                        color: '#1a1a1a',
                        border: '1px solid rgba(26,26,26,0.2)',
                      }}>
                        {roleLabel}
                      </span>
                      {option.isWicketkeeper && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 900,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.05em',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: '#fcd34d',
                          color: '#78350f',
                          border: '1px solid #fbbf24',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          🧤 WK
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${mutedColor}`, paddingBottom: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, color: textColor }}>BAT</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: textColor }}>{option.battingRating}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${mutedColor}`, paddingBottom: '4px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, color: textColor }}>BOWL</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: textColor }}>{option.bowlingRating}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, color: textColor }}>FIELD</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: textColor }}>{option.fieldingRating}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Results Footer inside the shareable card */}
            <div style={{
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              borderRadius: '2px',
            }}>
              <div style={{ textAlign: 'center', borderRight: '2px solid rgba(255,255,255,0.1)', paddingRight: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#e64a33', textTransform: 'uppercase' as const, letterSpacing: '0.2em', marginBottom: '6px' }}>RESULTS</div>
                <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {wins}<span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.5)' }}>.</span>{losses}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  {wins >= 3 ? 'KNOCKOUTS REACHED' : 'ELIMINATED IN GROUPS'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                  {totalRuns} Runs · {totalWickets} Wickets
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
                8-0 WORLD CUP XI
              </div>
            </div>
          </div>
          {/* ====== END SHAREABLE CARD AREA ====== */}

          {/* Action Buttons (outside the capture area) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleShare}
              disabled={isGeneratingImage}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[#e64a33] hover:bg-[#d53e28] transition-colors text-white font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_var(--theme-ink)] border-2 border-[var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)] disabled:opacity-60 disabled:cursor-wait"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> GENERATING...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> SHARE RESULTS
                </>
              )}
            </button>
            <button 
              onClick={handleShare}
              disabled={isGeneratingImage}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-[var(--theme-ink)] bg-[var(--theme-paper)] hover:bg-[var(--theme-ink)]/5 transition-colors text-[var(--theme-ink)] font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_var(--theme-ink)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--theme-ink)] disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" /> DOWNLOAD CARD
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={resetGame}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[var(--theme-ink)]/20 bg-transparent hover:bg-[var(--theme-ink)]/5 transition-colors text-[var(--theme-ink)] font-black text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
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
