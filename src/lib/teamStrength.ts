import { DraftedPlayer, BattingOrder, TeamStrength } from '../types/game';

export function getPlayerRole(bat: number, bowl: number): 'AR' | 'BAT' | 'BOWL' {
  if (bat >= 50 && bowl >= 50) return 'AR';
  if (bat >= bowl) return 'BAT';
  return 'BOWL';
}

export function getRoleLabel(bat: number, bowl: number): 'ALL-ROUNDER' | 'BATTER' | 'BOWLER' {
  const role = getPlayerRole(bat, bowl);
  if (role === 'AR') return 'ALL-ROUNDER';
  if (role === 'BAT') return 'BATTER';
  return 'BOWLER';
}

export function isPlayerInPosition(playerType: string, pos: number): boolean {
  if (playerType === 'TOP') return pos >= 1 && pos <= 3;
  if (playerType === 'MID') return pos >= 3 && pos <= 7;
  if (playerType === 'LOW') return pos >= 8 && pos <= 11;
  return false;
}

export function calculateTeamStrength(squad: DraftedPlayer[], battingOrder: BattingOrder[]): TeamStrength {
  let fieldingSum = 0;
  let hasWk = false;

  const orderedPlayers = battingOrder
    .sort((a, b) => a.position - b.position)
    .map(bo => squad.find(p => p.id === bo.playerVersionId))
    .filter((p): p is DraftedPlayer => p !== undefined);

  if (orderedPlayers.length !== 11) {
    return { batting: 0, bowling: 0, fielding: 0, balanceValid: false, issues: ['Squad incomplete'] };
  }

  const issues: string[] = [];
  let pureBowlers = 0;
  let allRounders = 0;
  
  const batterAndAR: number[] = [];
  const bowlerAndAR: number[] = [];

  orderedPlayers.forEach((player, index) => {
    const position = index + 1;
    let battingMultiplier = 1.0;

    if (!isPlayerInPosition(player.battingOrderType, position)) {
      battingMultiplier = 0.8; // 20% penalty for out-of-position
      issues.push(`${player.player.name} is a ${player.battingOrderType} order batter at #${position}`);
    }

    const role = getPlayerRole(player.battingRating, player.bowlingRating);
    const isAllRounder = role === 'AR';
    const isBatter = role === 'BAT';
    const isBowler = role === 'BOWL';

    if (isAllRounder) {
      allRounders++;
      batterAndAR.push(player.battingRating * battingMultiplier);
      bowlerAndAR.push(player.bowlingRating);
    } else if (isBatter) {
      batterAndAR.push(player.battingRating * battingMultiplier);
    } else if (isBowler) {
      pureBowlers++;
      bowlerAndAR.push(player.bowlingRating);
    }

    fieldingSum += player.fieldingRating;

    if (player.isWicketkeeper) {
      hasWk = true;
    }
  });

  const batting = batterAndAR.length > 0 
    ? Math.round(batterAndAR.reduce((a, b) => a + b, 0) / batterAndAR.length) 
    : 0;
    
  const bowling = bowlerAndAR.length > 0
    ? Math.round(bowlerAndAR.reduce((a, b) => a + b, 0) / bowlerAndAR.length)
    : 0;

  const fielding = Math.round(fieldingSum / 11);

  const totalBowlingOptions = pureBowlers + allRounders;
  
  if (!hasWk) {
    issues.push('No Wicketkeeper in the playing XI.');
  }
  if (pureBowlers < 3) {
    issues.push(`Only ${pureBowlers} pure bowlers. You need at least 3.`);
  }
  if (totalBowlingOptions < 5) {
    issues.push(`Only ${totalBowlingOptions} bowling options. You need at least 5 (including all-rounders).`);
  }

  const balanceValid = issues.length === 0;

  return {
    batting,
    bowling,
    fielding,
    balanceValid,
    issues
  };
}
