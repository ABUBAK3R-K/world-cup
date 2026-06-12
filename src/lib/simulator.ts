export type SimPlayer = {
  name: string;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
};

export type SimTeam = {
  name: string;
  players: SimPlayer[]; // Must be exactly 11 players in batting order
  _key?: string; // Optional key for deduplication (team + year)
};

export type InningsResult = {
  runs: number;
  wickets: number;
  balls: number;
};

// Probability distributions based on difference in skill (Batter - Bowler)
// We return an array of weights for outcomes: [Dot, 1, 2, 3, 4, 6, Wicket]
function getProbabilities(batDiff: number, isPowerplay: boolean, isDeath: boolean, ballsFaced: number): number[] {
  // Base weights for an even matchup to yield ~315 runs and 9 wickets over 300 balls
  let weights = [45, 32, 6, 1, 10, 3, 3]; // [Dot, 1, 2, 3, 4, 6, W]

  // Adjust for skill difference (batting rating vs bowling rating)
  // Positive means batter is better, negative means bowler is better. Range approx -80 to +80.
  const diffFactor = Math.max(Math.min(batDiff / 50, 1.5), -1.5); 
  
  // Apply skill modifiers safely
  weights[0] -= diffFactor * 5;  // Dots
  weights[1] += diffFactor * 2;  // 1s
  weights[4] += diffFactor * 4;  // 4s
  weights[5] += diffFactor * 2;  // 6s
  weights[6] -= diffFactor * 2;  // Wickets

  // Adjust for match phases
  if (isPowerplay) {
    weights[0] += 5; // More dots (fielding restrictions but new ball moving)
    weights[4] += 5; // More 4s (inner circle gaps)
    weights[6] += 1; // slightly more wickets (new ball)
  } else if (isDeath) {
    weights[0] -= 10; // Less dots
    weights[1] += 2;  // More 1s
    weights[2] += 4;  // More 2s
    weights[4] += 8;  // More 4s
    weights[5] += 8;  // More 6s
    weights[6] += 6;  // WAY more wickets (attacking)
  } else {
    // Middle overs
    weights[0] += 2; // Dots
    weights[1] += 8; // Rotate strike (1s)
    weights[4] -= 2; // Fewer boundaries (field spread out)
    weights[6] -= 1; // Fewer wickets (consolidation)
  }

  // Adjust for "Settled" batter (fatigue/eye in)
  if (ballsFaced > 30) {
    weights[0] -= 5;
    weights[1] += 5;
    weights[4] += 3;
    weights[6] -= 1; // Less likely to get out if settled
  }
  if (ballsFaced > 60) {
    weights[4] += 4;
    weights[5] += 4;
    weights[6] -= 1;
  }

  // Ensure no negative weights
  return weights.map(w => Math.max(w, 0.1));
}

function getRandomOutcome(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * sum;
  
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      return i; // 0=Dot, 1=1, 2=2, 3=3, 4=4, 5=6, 6=Wicket
    }
  }
  return 0;
}

export function simulateInnings(battingTeam: SimTeam, bowlingTeam: SimTeam, target?: number): InningsResult {
  let runs = 0;
  let wickets = 0;
  let balls = 0;
  
  let strikerIdx = 0;
  let nonStrikerIdx = 1;
  let currentBowlerIdx = 10; // Start with opening bowlers at bottom of order

  let strikerBallsFaced = 0;

  for (let over = 0; over < 50; over++) {
    const isPowerplay = over < 10;
    const isDeath = over >= 40;

    // Pick a bowler (rotate between 5 bowlers from pos 7 to 11)
    currentBowlerIdx = 10 - (over % 5);
    const bowler = bowlingTeam.players[currentBowlerIdx] || bowlingTeam.players[bowlingTeam.players.length - 1];

    for (let ball = 1; ball <= 6; ball++) {
      balls++;
      
      const striker = battingTeam.players[strikerIdx];
      const batDiff = striker.battingRating - bowler.bowlingRating;
      
      const weights = getProbabilities(batDiff, isPowerplay, isDeath, strikerBallsFaced);
      const outcome = getRandomOutcome(weights);
      
      strikerBallsFaced++;

      if (outcome === 6) { // Wicket
        wickets++;
        strikerIdx = Math.max(strikerIdx, nonStrikerIdx) + 1;
        strikerBallsFaced = 0;
        
        if (wickets === 10) return { runs, wickets, balls };
      } else {
        let runsScored = 0;
        if (outcome === 1) runsScored = 1;
        if (outcome === 2) runsScored = 2;
        if (outcome === 3) runsScored = 3;
        if (outcome === 4) runsScored = 4;
        if (outcome === 5) runsScored = 6;
        
        runs += runsScored;
        
        // Rotate strike on 1 or 3
        if (runsScored === 1 || runsScored === 3) {
          const temp = strikerIdx;
          strikerIdx = nonStrikerIdx;
          nonStrikerIdx = temp;
          strikerBallsFaced = 0; // we aren't tracking non-striker balls faced for simplicity, just resetting for new striker
        }
      }

      if (target && runs >= target) {
        return { runs, wickets, balls };
      }
    }
    
    // End of over: rotate strike
    const temp = strikerIdx;
    strikerIdx = nonStrikerIdx;
    nonStrikerIdx = temp;
    strikerBallsFaced = 0; // reset for simplicity
  }

  return { runs, wickets, balls };
}

export function simulateMatchEngine(team1: SimTeam, team2: SimTeam) {
  // Simulate Toss
  const tossWinnerTeam = Math.random() > 0.5 ? team1 : team2;
  const tossLoserTeam = tossWinnerTeam === team1 ? team2 : team1;
  const tossDecision: 'BAT' | 'BOWL' = Math.random() > 0.5 ? 'BAT' : 'BOWL';

  let battingFirstTeam = tossDecision === 'BAT' ? tossWinnerTeam : tossLoserTeam;
  let bowlingFirstTeam = tossDecision === 'BAT' ? tossLoserTeam : tossWinnerTeam;

  const innings1 = simulateInnings(battingFirstTeam, bowlingFirstTeam);
  const innings2 = simulateInnings(bowlingFirstTeam, battingFirstTeam, innings1.runs + 1);

  const team1BatFirst = battingFirstTeam === team1;
  const t1Score = team1BatFirst ? innings1.runs : innings2.runs;
  const t2Score = team1BatFirst ? innings2.runs : innings1.runs;
  const t1Wickets = team1BatFirst ? innings1.wickets : innings2.wickets;
  const t2Wickets = team1BatFirst ? innings2.wickets : innings1.wickets;

  const t1Wins = t1Score > t2Score;

  return {
    team1: team1.name,
    team2: team2.name,
    winner: t1Wins ? team1.name : team2.name,
    team1Score: t1Score,
    team2Score: t2Score,
    team1Wickets: t1Wickets,
    team2Wickets: t2Wickets,
    tossWinner: tossWinnerTeam.name,
    tossDecision,
    battingFirst: battingFirstTeam.name,
  };
}
