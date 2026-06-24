import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DraftedPlayer, BattingOrder, TournamentResult, MatchResult } from '@/types/game';
import { simulateMatchEngine, SimTeam, SimPlayer } from '@/lib/simulator';
import { calculateTeamStrength, isPlayerInPosition } from '@/lib/teamStrength';

// Helper to convert the drafted team into a SimTeam
function buildPlayerTeam(squad: DraftedPlayer[], battingOrder: BattingOrder[]): SimTeam {
  // Sort squad by batting order
  const orderedSquad = [...squad].sort((a, b) => {
    const posA = battingOrder.find(bo => bo.playerVersionId === a.id)?.position || 11;
    const posB = battingOrder.find(bo => bo.playerVersionId === b.id)?.position || 11;
    return posA - posB;
  });

  const simPlayers: SimPlayer[] = orderedSquad.map(p => {
    // If they are batting out of position, they get a penalty. Let's calculate that here too.
    const posObj = battingOrder.find(bo => bo.playerVersionId === p.id);
    const assignedPos = posObj?.position || 11;
    
    const isOutOfPos = !isPlayerInPosition(p.battingOrderType, assignedPos);

    return {
      name: p.player.name,
      battingRating: isOutOfPos ? p.battingRating * 0.8 : p.battingRating, // 20% penalty
      bowlingRating: p.bowlingRating,
      fieldingRating: p.fieldingRating,
    };
  });

  return { name: 'Your XI', players: simPlayers };
}

// excludeTeamKeys is an array of team names (e.g., "Australia") to prevent facing the same country twice
async function fetchRandomOpponent(excludeTeamKeys: string[] = []): Promise<SimTeam> {
  // Query all distinct team+year combos from the database
  const allCombos = await prisma.playerVersion.findMany({
    select: { team: true, worldCupYear: true },
    distinct: ['team', 'worldCupYear'],
  });

  // Build available pool, excluding already-used countries
  const available = allCombos.filter(
    c => !excludeTeamKeys.includes(c.team)
  );

  if (available.length === 0) {
    return { name: `Fallback AI`, players: Array(11).fill({ name: 'AI Player', battingRating: 50, bowlingRating: 50, fieldingRating: 50 }) };
  }

  // Pick a random combo
  const pick = available[Math.floor(Math.random() * available.length)];
  const teamName = pick.team;
  const year = pick.worldCupYear;
  
  // Fetch all players for this team/year
  const squad = await prisma.playerVersion.findMany({
    where: { team: teamName, worldCupYear: year },
    include: { player: true },
  });
  
  if (squad.length < 11) {
    // Fallback
    return { name: `Fallback AI`, players: Array(11).fill({ name: 'AI Player', battingRating: 50, bowlingRating: 50, fieldingRating: 50 }) };
  }

  // Auto-selection for AI: Top 6 batters, 1 WK, Top 4 bowlers
  const batters = [...squad].sort((a, b) => b.battingRating - a.battingRating);
  const topBatters = batters.slice(0, 6);
  
  const wk = squad.find(p => p.isWicketkeeper && !topBatters.find(tb => tb.id === p.id)) || 
             batters.find(p => !topBatters.find(tb => tb.id === p.id))!;
             
  const remaining = squad.filter(p => !topBatters.find(tb => tb.id === p.id) && p.id !== wk.id);
  const topBowlers = remaining.sort((a, b) => b.bowlingRating - a.bowlingRating).slice(0, 4);
  
  const final11 = [...topBatters, wk, ...topBowlers];
  
  // Re-sort into basic batting order (highest bat rating first)
  const sorted11 = [...final11].sort((a, b) => b.battingRating - a.battingRating);

  const simPlayers: SimPlayer[] = sorted11.map(p => ({
    name: p.player.name,
    battingRating: p.battingRating,
    bowlingRating: p.bowlingRating,
    fieldingRating: p.fieldingRating,
  }));

  return { name: `${teamName} '${String(year).slice(-2)}`, players: simPlayers, _key: `${teamName}_${year}` };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const squad = body.squad as DraftedPlayer[] || [];
    const battingOrder = body.battingOrder as BattingOrder[] || [];
    
    if (squad.length < 11) {
      return NextResponse.json({ error: "Need 11 players to simulate!" }, { status: 400 });
    }

    // Penalties check
    const strength = calculateTeamStrength(squad, battingOrder);
    
    const userTeam = buildPlayerTeam(squad, battingOrder);
    
    // Apply balance penalty directly to players if balance is bad (e.g., missing 5 bowlers)
    if (!strength.balanceValid) {
      userTeam.players.forEach(p => {
         p.battingRating *= 0.8;
         p.bowlingRating *= 0.8;
      });
    }

    const groupStage: MatchResult[] = [];
    const playedOpponents: string[] = [];

    // Simulate 5 group matches
    for (let i = 0; i < 5; i++) {
      const opp = await fetchRandomOpponent(playedOpponents);
      playedOpponents.push(opp.name.split(' ')[0]); // exclude country name so we don't play them twice
      
      const result = simulateMatchEngine(userTeam, opp);
      groupStage.push(result);
    }

    const wins = groupStage.filter(m => m.winner === 'Your XI').length;
    
    const quarterFinals: MatchResult[] = [];
    const semiFinals: MatchResult[] = [];
    let finalMatch: MatchResult | null = null;
    let champion = 'Eliminated in Group Stage';

    if (wins >= 3) {
      const qfOpp = await fetchRandomOpponent(playedOpponents);
      const qf = simulateMatchEngine(userTeam, qfOpp);
      quarterFinals.push(qf);
      
      if (qf.winner === 'Your XI') {
        const sfOpp = await fetchRandomOpponent([qfOpp.name.split(' ')[0]]);
        const sf = simulateMatchEngine(userTeam, sfOpp);
        semiFinals.push(sf);
        
        if (sf.winner === 'Your XI') {
          const fOpp = await fetchRandomOpponent([sfOpp.name.split(' ')[0]]);
          const f = simulateMatchEngine(userTeam, fOpp);
          finalMatch = f;
          champion = f.winner === 'Your XI' ? 'Your XI' : fOpp.name;
        } else {
          champion = 'Eliminated in Semi Finals';
        }
      } else {
        champion = 'Eliminated in Quarter Finals';
      }
    }

    const result: TournamentResult = {
      champion,
      groupStage,
      quarterFinals,
      semiFinals,
      final: finalMatch || { team1: '', team2: '', winner: '', team1Score: 0, team2Score: 0, team1Wickets: 0, team2Wickets: 0 }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation API error:", error);
    return NextResponse.json({ error: "Failed to simulate tournament" }, { status: 500 });
  }
}
