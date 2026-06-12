"use client";

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { calculateTeamStrength, getPlayerRole, getRoleLabel } from '@/lib/teamStrength';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, AlertTriangle } from 'lucide-react';

function getPositionLabel(pos: number): string {
  if (pos <= 3) return 'TOP';
  if (pos <= 7) return 'MID';
  return 'LOW';
}

function SortableItem({ id, player, position }: { id: string, player: any, position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const posLabel = getPositionLabel(position);
  const isOutOfPosition = player.battingOrderType !== posLabel;
  const role = getPlayerRole(player.battingRating, player.bowlingRating);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`flex items-center gap-3 border-2 p-3 cursor-grab active:cursor-grabbing transition-all rounded-sm ${isOutOfPosition ? 'bg-[var(--theme-accent)]/5 border-[var(--theme-accent)]/40' : 'bg-[var(--theme-paper)] border-[var(--theme-ink)]/15 hover:border-[var(--theme-ink)]'}`}>
      <div className={`w-7 h-7 flex items-center justify-center font-black text-sm shrink-0 rounded-sm ${isOutOfPosition ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-ink)] text-[var(--theme-paper)]'}`}>
        {position}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm text-[var(--theme-ink)] truncate uppercase">{player.player.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] font-black text-[var(--theme-ink)]/40 uppercase">{player.player.country}</span>
          <span className="text-[var(--theme-ink)]/20">·</span>
          <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded-sm ${player.battingOrderType === 'TOP' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : player.battingOrderType === 'MID' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'}`}>
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
      <div className="shrink-0 text-center bg-[var(--theme-ink)] text-[var(--theme-paper)] px-2.5 py-1 rounded-sm">
        <div className="text-[8px] font-bold text-[var(--theme-paper)]/50 uppercase">OVR</div>
        <div className="font-black text-sm">{player.overallRating}</div>
      </div>
    </div>
  );
}

export function TeamBuilderScreen() {
  const { state, updateBattingOrder, setPhase } = useGameState();
  const [items, setItems] = useState(state.battingOrder.map(b => b.playerVersionId!.toString()));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
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

  const currentBattingOrder = items.map((id, index) => ({ position: index + 1, playerVersionId: parseInt(id) }));
  const strength = calculateTeamStrength(state.squad, currentBattingOrder);

  const outOfPositionCount = items.reduce((count, id, index) => {
    const player = state.squad.find(p => p.id === parseInt(id));
    if (player && player.battingOrderType !== getPositionLabel(index + 1)) return count + 1;
    return count;
  }, 0);

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6 pb-12">
      <div className="flex-1 space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-ink)] uppercase tracking-tight">Review & Reorder</h2>
          <p className="text-xs sm:text-sm text-[var(--theme-ink)]/50 font-medium mt-1">Drag players to optimize your batting lineup. Watch for position penalties! (Hold to drag on mobile)</p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-sm border border-blue-200 dark:border-blue-700">#1-3 TOP</span>
          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-sm border border-purple-200 dark:border-purple-700">#4-7 MID</span>
          <span className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-sm border border-orange-200 dark:border-orange-700">#8-11 LOW</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((id, index) => {
                const player = state.squad.find(p => p.id === parseInt(id));
                return player ? <SortableItem key={id} id={id} player={player} position={index + 1} /> : null;
              })}
            </div>
          </SortableContext>
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
