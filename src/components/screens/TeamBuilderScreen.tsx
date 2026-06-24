"use client";

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { calculateTeamStrength, getPlayerRole, isPlayerInPosition } from '@/lib/teamStrength';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, AlertTriangle, Wand2, GripVertical, ArrowUpDown } from 'lucide-react';
import { DraftedPlayer } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';

function getIdealRange(type: string): string {
  if (type === 'TOP') return '#1–3';
  if (type === 'MID') return '#3–7';
  if (type === 'LOW') return '#8–11';
  return '—';
}

function getZoneLabel(position: number): string {
  if (position <= 3) return 'TOP';
  if (position <= 7) return 'MID';
  return 'LOW';
}

function getZoneColor(zone: string): string {
  if (zone === 'TOP') return 'bg-blue-500/8 border-l-blue-500';
  if (zone === 'MID') return 'bg-purple-500/8 border-l-purple-500';
  return 'bg-orange-500/8 border-l-orange-500';
}

function SortableItem({ id, player, position, isActive }: { id: string, player: DraftedPlayer, position: number, isActive?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOutOfPosition = !isPlayerInPosition(player.battingOrderType, position);
  const role = getPlayerRole(player.battingRating, player.bowlingRating);
  const zone = getZoneLabel(position);
  const idealRange = getIdealRange(player.battingOrderType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-2 p-3 transition-all rounded-sm relative group ${
        isDragging ? 'opacity-30 scale-[0.98]' : ''
      } ${isActive ? 'ring-2 ring-[var(--theme-accent)] ring-offset-2' : ''} ${
        isOutOfPosition
          ? 'bg-[var(--theme-accent)]/5 border-[var(--theme-accent)]/40'
          : 'bg-[var(--theme-paper)] border-[var(--theme-ink)]/15 hover:border-[var(--theme-ink)]'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-[var(--theme-ink)]/30 hover:text-[var(--theme-ink)]/60 transition-colors touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className={`w-7 h-7 flex items-center justify-center font-black text-sm shrink-0 rounded-sm ${
        isOutOfPosition
          ? 'bg-[var(--theme-accent)] text-white'
          : 'bg-[var(--theme-ink)] text-[var(--theme-paper)]'
      }`}>
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm text-[var(--theme-ink)] truncate uppercase">{player.player.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[9px] font-black text-[var(--theme-ink)]/40 uppercase">{player.player.country}</span>
          <span className="text-[var(--theme-ink)]/20">·</span>
          <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded-sm ${
            player.battingOrderType === 'TOP' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
            player.battingOrderType === 'MID' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' :
            'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
          }`}>
            {player.battingOrderType}
          </span>
          <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded-sm ${
            role === 'AR' ? 'bg-[#2d6a4f]/15 text-[#2d6a4f] dark:bg-[#2ecc71]/15 dark:text-[#2ecc71]' :
            role === 'BAT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
            'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
          }`}>
            {role}
          </span>
          {isOutOfPosition && (
            <span className="flex items-center gap-0.5 text-[var(--theme-accent)] text-[9px] font-black">
              <AlertTriangle className="w-2.5 h-2.5" /> OOP
            </span>
          )}
        </div>
      </div>

      {/* Ideal position guide */}
      <div className={`shrink-0 text-center px-2 py-1 rounded-sm border ${
        isOutOfPosition
          ? 'border-[var(--theme-accent)]/30 bg-[var(--theme-accent)]/10'
          : 'border-[#2d6a4f]/20 bg-[#2d6a4f]/5'
      }`}>
        <div className={`text-[7px] font-black uppercase tracking-widest ${
          isOutOfPosition ? 'text-[var(--theme-accent)]' : 'text-[#2d6a4f]'
        }`}>Ideal</div>
        <div className={`text-xs font-black ${
          isOutOfPosition ? 'text-[var(--theme-accent)]' : 'text-[#2d6a4f]'
        }`}>{idealRange}</div>
      </div>

      <div className="shrink-0 text-center bg-[var(--theme-ink)] text-[var(--theme-paper)] px-2.5 py-1 rounded-sm">
        <div className="text-[8px] font-bold text-[var(--theme-paper)]/50 uppercase">OVR</div>
        <div className="font-black text-sm">{player.overallRating}</div>
      </div>
    </div>
  );
}

function autoArrangePlayers(squad: DraftedPlayer[], currentItems: string[]): string[] {
  // Group players by their battingOrderType
  const topPlayers: { id: string; player: DraftedPlayer }[] = [];
  const midPlayers: { id: string; player: DraftedPlayer }[] = [];
  const lowPlayers: { id: string; player: DraftedPlayer }[] = [];

  currentItems.forEach(id => {
    const player = squad.find(p => p.id === parseInt(id));
    if (!player) return;
    const entry = { id, player };
    if (player.battingOrderType === 'TOP') topPlayers.push(entry);
    else if (player.battingOrderType === 'MID') midPlayers.push(entry);
    else lowPlayers.push(entry);
  });

  // Sort each group by overallRating descending (best players first in their zone)
  topPlayers.sort((a, b) => b.player.overallRating - a.player.overallRating);
  midPlayers.sort((a, b) => b.player.overallRating - a.player.overallRating);
  lowPlayers.sort((a, b) => b.player.overallRating - a.player.overallRating);

  // Slots: TOP = 1-3, MID = 4-7, LOW = 8-11
  const result: (string | null)[] = new Array(11).fill(null);
  const placed = new Set<string>();

  // Place TOP players in slots 1-3
  const topSlots = [0, 1, 2];
  topSlots.forEach((slot, i) => {
    if (i < topPlayers.length) {
      result[slot] = topPlayers[i].id;
      placed.add(topPlayers[i].id);
    }
  });

  // Place MID players in slots 3-6 (indices 3-6)
  const midSlots = [3, 4, 5, 6];
  // Also consider slot 2 if it's still empty (MID is eligible for #3 which is index 2)
  if (result[2] === null) midSlots.unshift(2);
  let midIdx = 0;
  midSlots.forEach(slot => {
    if (midIdx < midPlayers.length && result[slot] === null) {
      result[slot] = midPlayers[midIdx].id;
      placed.add(midPlayers[midIdx].id);
      midIdx++;
    }
  });

  // Place LOW players in slots 7-10 (indices 7-10)
  const lowSlots = [7, 8, 9, 10];
  let lowIdx = 0;
  lowSlots.forEach(slot => {
    if (lowIdx < lowPlayers.length && result[slot] === null) {
      result[slot] = lowPlayers[lowIdx].id;
      placed.add(lowPlayers[lowIdx].id);
      lowIdx++;
    }
  });

  // Overflow: place any remaining unplaced players in empty slots
  const unplaced = [
    ...topPlayers.filter(p => !placed.has(p.id)),
    ...midPlayers.filter(p => !placed.has(p.id)),
    ...lowPlayers.filter(p => !placed.has(p.id)),
  ];

  let unplacedIdx = 0;
  for (let i = 0; i < 11; i++) {
    if (result[i] === null && unplacedIdx < unplaced.length) {
      result[i] = unplaced[unplacedIdx].id;
      unplacedIdx++;
    }
  }

  return result.filter((id): id is string => id !== null);
}

export function TeamBuilderScreen() {
  const { state, updateBattingOrder, setPhase } = useGameState();
  const [items, setItems] = useState(state.battingOrder.map(b => b.playerVersionId!.toString()));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAutoArrangeFlash, setShowAutoArrangeFlash] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      setItems(newItems);
      
      const newBattingOrder = newItems.map((id, index) => ({
        position: index + 1,
        playerVersionId: parseInt(id)
      }));
      updateBattingOrder(newBattingOrder);
    }
  };

  const handleAutoArrange = () => {
    const arranged = autoArrangePlayers(state.squad, items);
    setItems(arranged);

    const newBattingOrder = arranged.map((id, index) => ({
      position: index + 1,
      playerVersionId: parseInt(id)
    }));
    updateBattingOrder(newBattingOrder);

    // Flash feedback
    setShowAutoArrangeFlash(true);
    setTimeout(() => setShowAutoArrangeFlash(false), 1500);
  };

  const currentBattingOrder = items.map((id, index) => ({ position: index + 1, playerVersionId: parseInt(id) }));
  const strength = calculateTeamStrength(state.squad, currentBattingOrder);

  const outOfPositionCount = items.reduce((count, id, index) => {
    const player = state.squad.find(p => p.id === parseInt(id));
    if (player && !isPlayerInPosition(player.battingOrderType, index + 1)) return count + 1;
    return count;
  }, 0);

  const activePlayer = activeId ? state.squad.find(p => p.id === parseInt(activeId)) : null;

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 pb-12">
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-ink)] uppercase tracking-tight">Review & Reorder</h2>
            <p className="text-xs sm:text-sm text-[var(--theme-ink)]/50 font-medium mt-1">Drag players to optimize your batting lineup. Watch for position penalties!</p>
          </div>

          <button
            onClick={handleAutoArrange}
            className="brutal-btn-alt flex items-center justify-center gap-2 px-5 py-2.5 shrink-0 group"
          >
            <Wand2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="text-xs font-black uppercase tracking-wider">Auto Arrange</span>
          </button>
        </div>

        {/* Auto arrange success flash */}
        <AnimatePresence>
          {showAutoArrangeFlash && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#2d6a4f]/10 border-2 border-[#2d6a4f]/30 rounded-sm p-3 flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4 text-[#2d6a4f]" />
              <span className="text-sm font-bold text-[#2d6a4f]">Lineup auto-arranged for optimal positioning!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-sm border border-blue-200 dark:border-blue-700">#1-3 TOP</span>
          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-sm border border-purple-200 dark:border-purple-700">#3-7 MID</span>
          <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-sm border border-orange-200 dark:border-orange-700">#8-11 LOW</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {items.map((id, index) => {
                const player = state.squad.find(p => p.id === parseInt(id));
                const zone = getZoneLabel(index + 1);
                const showZoneDivider = index === 0 || getZoneLabel(index) !== zone;

                return player ? (
                  <div key={id}>
                    {showZoneDivider && (
                      <div className={`flex items-center gap-2 mt-${index === 0 ? '0' : '3'} mb-1.5`}>
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-sm ${
                          zone === 'TOP' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
                          zone === 'MID' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {zone} ORDER
                        </span>
                        <div className="flex-1 h-[1px] bg-[var(--theme-ink)]/10" />
                      </div>
                    )}
                    <SortableItem id={id} player={player} position={index + 1} />
                  </div>
                ) : null;
              })}
            </div>
          </SortableContext>

          {/* Drag overlay for visual feedback */}
          <DragOverlay>
            {activePlayer ? (
              <div className="flex items-center gap-3 border-2 border-[var(--theme-accent)] bg-[var(--theme-paper)] p-3 rounded-sm shadow-[6px_6px_0px_var(--theme-accent)] opacity-90">
                <ArrowUpDown className="w-4 h-4 text-[var(--theme-accent)]" />
                <div className="w-7 h-7 flex items-center justify-center font-black text-sm shrink-0 rounded-sm bg-[var(--theme-accent)] text-white">
                  ↕
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm text-[var(--theme-ink)] truncate uppercase">{activePlayer.player.name}</div>
                  <div className="text-[9px] font-black text-[var(--theme-ink)]/50 uppercase">
                    Drop in {getIdealRange(activePlayer.battingOrderType)} for best results
                  </div>
                </div>
                <div className="shrink-0 text-center bg-[var(--theme-ink)] text-[var(--theme-paper)] px-2.5 py-1 rounded-sm">
                  <div className="text-[8px] font-bold text-[var(--theme-paper)]/50 uppercase">OVR</div>
                  <div className="font-black text-sm">{activePlayer.overallRating}</div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="w-full md:w-72 space-y-4">
        <div className="brutal-panel p-5 sticky top-8">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--theme-ink)] border-b-2 border-[var(--theme-ink)] pb-2 mb-4">Team Chemistry</h3>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center border-b border-[var(--theme-ink)]/10 pb-2">
              <span className="text-sm font-bold text-[var(--theme-ink)]/50 uppercase">Batting</span>
              <span className="font-black text-2xl text-[var(--theme-ink)]">{strength.batting}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[var(--theme-ink)]/10 pb-2">
              <span className="text-sm font-bold text-[var(--theme-ink)]/50 uppercase">Bowling</span>
              <span className="font-black text-2xl text-[var(--theme-ink)]">{strength.bowling}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[var(--theme-ink)]/50 uppercase">Fielding</span>
              <span className="font-black text-2xl text-[var(--theme-ink)]">{strength.fielding}</span>
            </div>
          </div>

          {outOfPositionCount > 0 && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 p-3 border-2 border-amber-400 dark:border-amber-600 rounded-sm flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {outOfPositionCount} player{outOfPositionCount > 1 ? 's' : ''} out of position (−20% batting)
            </div>
          )}

          {strength.issues.length > 0 && (
            <div className="mb-4 bg-[var(--theme-accent)]/5 p-3 border-2 border-[var(--theme-accent)]/40 rounded-sm">
              <div className="text-[var(--theme-accent)] font-black text-xs mb-2 uppercase">Issues:</div>
              <ul className="list-disc list-inside text-[11px] text-[var(--theme-accent)]/80 space-y-1 font-medium">
                {strength.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setPhase('SIMULATING')}
            className="brutal-btn w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            SIMULATE
          </button>
        </div>
      </div>
    </div>
  );
}
