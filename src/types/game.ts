export type GamePhase = 'HOME' | 'DRAFTING' | 'TEAM_BUILDING' | 'SIMULATING' | 'RESULTS';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type DraftedPlayer = {
  id: number;
  playerId: number;
  worldCupYear: number;
  team: string;
  matches: number;
  runs: number;
  average: number;
  strikeRate: number;
  wickets: number;
  bowlingAverage: number | null;
  economy: number | null;
  catches: number;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  overallRating: number;
  eligiblePositions: string;
  battingOrderType: 'TOP' | 'MID' | 'LOW';
  isWicketkeeper: boolean;
  player: {
    id: number;
    name: string;
    country: string;
    battingStyle: string;
    bowlingStyle: string;
  };
};

export type BattingOrder = {
  position: number; // 1 to 11
  playerVersionId: number | null;
};

export type GameState = {
  phase: GamePhase;
  difficulty: Difficulty;
  rerollsLeft: number;
  currentSpin: { team: string, year: number } | null;
  draftRound: number; // 1 to 11
  squad: DraftedPlayer[];
  battingOrder: BattingOrder[];
  tournamentResults: TournamentResult | null;
};

export type MatchResult = {
  team1: string;
  team2: string;
  winner: string;
  team1Score: number;
  team2Score: number;
  team1Wickets: number;
  team2Wickets: number;
  tossWinner?: string;
  tossDecision?: 'BAT' | 'BOWL';
  battingFirst?: string;
};

export type TournamentResult = {
  champion: string;
  groupStage: MatchResult[];
  quarterFinals: MatchResult[];
  semiFinals: MatchResult[];
  final: MatchResult;
};

export type TeamStrength = {
  batting: number;
  bowling: number;
  fielding: number;
  balanceValid: boolean;
  issues: string[];
};
