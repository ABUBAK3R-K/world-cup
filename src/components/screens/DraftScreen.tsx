"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { DraftedPlayer } from '@/types/game';
import { Shield, RefreshCw, Target, Dices } from 'lucide-react';
import { getPlayerRole, getRoleLabel } from '@/lib/teamStrength';

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

export function DraftScreen() {
  const { state, setSpin, useReroll, addDraftPick } = useGameState();
  const [squadOptions, setSquadOptions] = useState<DraftedPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<DraftedPlayer | null>(null);

  const draftedPlayerIds = new Set(state.squad.map(p => p.playerId));
  const filledPositions = new Set(state.battingOrder.filter(b => b.playerVersionId !== null).map(b => b.position));
  const bowlingOptionsCount = state.squad.filter(p => {
    const role = getPlayerRole(p.battingRating, p.bowlingRating);
    return role === 'BOWL' || role === 'AR';
  }).length;
  const hasWk = state.squad.some(p => p.isWicketkeeper);

  const numDrafted = state.squad.length;
  const battingAvg = numDrafted ? Math.round(state.squad.reduce((sum, p) => sum + p.battingRating, 0) / numDrafted) : 0;
  const bowlingAvg = numDrafted ? Math.round(state.squad.reduce((sum, p) => sum + p.bowlingRating, 0) / numDrafted) : 0;
  const fieldingAvg = numDrafted ? Math.round(state.squad.reduce((sum, p) => sum + p.fieldingRating, 0) / numDrafted) : 0;
  const overallAvg = numDrafted ? Math.round(state.squad.reduce((sum, p) => sum + p.overallRating, 0) / numDrafted) : 0;

  // We will move this useEffect below

  const triggerSpin = async () => {
    setSpinning(true);
    setSquadOptions([]);
    try {
      const res = await fetch('/api/spin');
      const data = await res.json();
      setTimeout(() => {
        setSpin({ team: data.team, year: data.year });
        setSpinning(false);
      }, 1500); 
    } catch (err) {
      console.error(err);
      setSpinning(false);
    }
  };

  const fetchSquad = async (team: string, year: number) => {
    setLoading(true);
    try {
      if (!team || !year) return;
      const res = await fetch(`/api/draft?team=${encodeURIComponent(team)}&year=${year}`);
      const data = await res.json();
      
      if (data.options && Array.isArray(data.options)) {
        const sortedOptions = data.options.sort((a: DraftedPlayer, b: DraftedPlayer) => {
          const orderMap: Record<string, number> = { 'TOP': 1, 'MID': 2, 'LOW': 3 };
          const orderA = orderMap[a.battingOrderType] || 4;
          const orderB = orderMap[b.battingOrderType] || 4;
          if (orderA !== orderB) return orderA - orderB;
          return b.overallRating - a.overallRating;
        });
        setSquadOptions(sortedOptions);
      } else {
        setSquadOptions([]);
      }
    } catch (err) {
      console.error(err);
      setSquadOptions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!state.currentSpin) {
      triggerSpin();
    } else {
      fetchSquad(state.currentSpin.team, state.currentSpin.year);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSpin]);

  const handlePickClick = (player: DraftedPlayer) => {
    if (draftedPlayerIds.has(player.playerId)) return;
    setSelectedPlayer(player);
  };

  const confirmPick = (position: number) => {
    if (selectedPlayer) {
      addDraftPick(selectedPlayer, position);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 pb-12">
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <div className="brutal-panel p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-ink)]/50 border-b-2 border-[var(--theme-ink)]/10 pb-2">
            STATUS
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-ink)]/60">Round</span>
            <span className="text-lg font-black text-[var(--theme-ink)]">{state.draftRound}/11</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-ink)]/60">Mode</span>
            <span className="text-sm font-black text-[var(--theme-ink)]">{state.difficulty}</span>
          </div>
          <div className="h-[2px] bg-[var(--theme-ink)]/10" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span className="text-xs font-bold uppercase tracking-wider">WK</span>
            </div>
            <span className={`text-sm font-black ${hasWk ? 'text-[var(--theme-accent)]' : 'text-[#e64a33]'}`}>{hasWk ? 1 : 0}/1</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              <span className="text-xs font-bold uppercase tracking-wider">BOWL</span>
            </div>
            <span className={`text-sm font-black ${bowlingOptionsCount >= 5 ? 'text-[var(--theme-accent)]' : 'text-[#e64a33]'}`}>{bowlingOptionsCount}/5</span>
          </div>
        </div>

        <div className="brutal-panel p-0 overflow-hidden">
          {spinning ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}>
                <Dices className="w-10 h-10 text-[var(--theme-accent)]" />
              </motion.div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--theme-ink)]/50">Rolling...</p>
            </div>
          ) : state.currentSpin ? (
            <div className={`text-center py-6 ${getTeamTheme(state.currentSpin.team).bg}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${getTeamTheme(state.currentSpin.team).muted}`}>DRAWN SQUAD</p>
              <p className={`text-2xl font-black uppercase tracking-tight ${getTeamTheme(state.currentSpin.team).text}`}>{state.currentSpin.team}</p>
              <p className={`text-lg font-bold ${getTeamTheme(state.currentSpin.team).text}`}>{state.currentSpin.year}</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-[var(--theme-ink)]/60 font-bold uppercase tracking-widest">Roll to draw a squad</p>
            </div>
          )}
        </div>

        <button
          onClick={useReroll}
          disabled={spinning || state.rerollsLeft <= 0}
          className={`w-full py-3 px-4 flex items-center justify-center gap-2 ${
            state.rerollsLeft > 0
              ? 'brutal-btn-alt cursor-pointer'
              : 'bg-[var(--theme-ink)]/5 text-[var(--theme-ink)]/30 border-2 border-[var(--theme-ink)]/20 rounded-sm cursor-not-allowed'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          REROLL ({state.rerollsLeft})
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {loading && !spinning && (
          <div className="brutal-panel p-12 text-center">
            <p className="text-lg font-bold uppercase tracking-widest text-[var(--theme-ink)]/50 animate-pulse">Fetching Roster...</p>
          </div>
        )}

        {!loading && !spinning && squadOptions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <AnimatePresence>
              {squadOptions.map((option, idx) => {
                const isAlreadyDrafted = draftedPlayerIds.has(option.playerId);
                const roleLabel = getRoleLabel(option.battingRating, option.bowlingRating);
                const theme = getTeamTheme(state.currentSpin?.team || 'default');
                const themeHex = theme.bg.startsWith('bg-[') ? theme.bg.slice(4, -1) : (theme.bg === 'bg-white' ? '#ffffff' : 'inherit');
                const isDarkCard = theme.text === 'text-white';
                const badgeBgClass = isDarkCard ? 'bg-white' : 'bg-[var(--theme-ink)]';
                
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handlePickClick(option)}
                    className={`p-4 flex flex-col items-start cursor-pointer transition-all relative overflow-hidden border-2 border-[var(--theme-ink)] rounded-sm
                      ${theme.bg}
                      ${isAlreadyDrafted ? 'opacity-30 pointer-events-none shadow-[4px_4px_0px_var(--theme-ink)]' : 'shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--theme-ink)]'}
                    `}
                  >
                    <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[var(--theme-ink)] text-[var(--theme-paper)] font-black text-sm rounded-sm z-10">
                      {option.overallRating}
                    </div>

                    <div className="w-[calc(100%-2rem)] mb-3 z-10 min-h-[2.5rem] flex items-start">
                      <div className={`text-sm font-black leading-tight uppercase ${theme.text} line-clamp-2 break-words`}>{option.player.name}</div>
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

                    {isAlreadyDrafted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--theme-ink)]/80 z-20">
                        <span className="text-white font-black border-2 border-white px-3 py-1 rotate-[-8deg] rounded-sm tracking-widest text-sm">PICKED</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="w-full lg:w-60 shrink-0">
        <div className="brutal-panel p-4 sticky top-8">
          <div className="flex justify-between items-end border-b-2 border-[var(--theme-ink)] pb-2 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-ink)]">BOX SCORE</span>
              <span className="text-xs font-black text-[var(--theme-ink)]/50">· {numDrafted}/11</span>
            </div>
            <span className="text-4xl leading-none font-black text-[var(--theme-ink)]">{overallAvg || '--'}</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-ink)]/60">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#e64a33]">{battingAvg || '--'}</span> BAT
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--theme-ink)]">{bowlingAvg || '--'}</span> BOWL
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--theme-ink)]/80">{fieldingAvg || '--'}</span> FLD
            </div>
          </div>

          <div className="space-y-0">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((pos) => {
              const orderEntry = state.battingOrder.find(b => b.position === pos);
              const player = orderEntry && orderEntry.playerVersionId 
                ? state.squad.find(p => p.id === orderEntry.playerVersionId) 
                : null;

              return (
                <div key={`slot-${pos}`} className={`flex items-center gap-2 py-1.5 ${pos < 11 ? 'border-b border-[#1a1a1a]/10' : ''}`}>
                  <span className="text-[10px] font-black text-[#1a1a1a]/30 w-4 text-right">{pos}</span>
                  {player ? (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[9px] font-black px-1 py-0.5 rounded-sm ${
                          getPlayerRole(player.battingRating, player.bowlingRating) === 'AR' ? 'bg-[#2d6a4f]/15 text-[#2d6a4f]' :
                          getPlayerRole(player.battingRating, player.bowlingRating) === 'BAT' ? 'bg-blue-100 text-blue-700' :
                          'bg-[#e64a33]/15 text-[#e64a33]'
                        }`}>
                          {getPlayerRole(player.battingRating, player.bowlingRating)}
                        </span>
                        <span className="text-xs font-bold text-[#1a1a1a] truncate">{player.player.name}</span>
                      </div>
                      {player.isWicketkeeper && <Shield className="w-3 h-3 text-amber-600 shrink-0" />}
                    </div>
                  ) : (
                    <span className="text-xs text-[#1a1a1a]/20 font-bold">——</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* POSITION SELECT MODAL */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="brutal-panel max-w-xl w-full p-8 relative">
            <h3 className="text-2xl font-black text-[#1a1a1a] mb-1 uppercase">Draft {selectedPlayer.player.name}</h3>
            <p className="text-sm text-[#1a1a1a]/60 mb-6">
              Select a batting position for this <span className="font-black text-[#e64a33]">{selectedPlayer.battingOrderType}</span> order specialist. 
              (Recommended: {selectedPlayer.eligiblePositions})
            </p>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {Array.from({ length: 11 }, (_, i) => i + 1).map(pos => {
                const isFilled = filledPositions.has(pos);
                const isRecommended = selectedPlayer.eligiblePositions.split(',').map(Number).includes(pos);
                
                return (
                  <button
                    key={pos}
                    disabled={isFilled}
                    onClick={() => confirmPick(pos)}
                    className={`p-3 border-2 font-black text-lg transition-all flex flex-col items-center justify-center gap-0.5 rounded-sm ${
                      isFilled 
                        ? 'bg-[#f4f1ea] text-[#1a1a1a]/20 border-[#1a1a1a]/10 cursor-not-allowed' 
                        : isRecommended 
                          ? 'bg-[#2d6a4f]/10 text-[#2d6a4f] border-[#2d6a4f] shadow-[3px_3px_0px_#2d6a4f] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#2d6a4f]'
                          : 'bg-white text-[#1a1a1a] border-[#1a1a1a]/30 hover:border-[#1a1a1a] hover:shadow-[3px_3px_0px_#1a1a1a]'
                    }`}
                  >
                    #{pos}
                    {isRecommended && !isFilled && <div className="text-[8px] font-black text-[#2d6a4f] uppercase tracking-wider">Ideal</div>}
                  </button>
                );
              })}
            </div>

            <button onClick={() => setSelectedPlayer(null)} className="brutal-btn-alt w-full py-3 text-center">
              CANCEL
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
