/**
 * Cricsheet World Cup Seed Script — V2: Intelligent Rating System
 * ────────────────────────────────────────────────────────────────
 * Architecture:
 *   1. Parse ALL ODI matches chronologically
 *   2. For each WC year, snapshot each player's career stats UP TO that WC
 *   3. Compute Base Rating (pre-WC career) + WC Rating (tournament only)
 *   4. Apply dynamic confidence-based weighting (sigmoid on career matches)
 *   5. Add Legacy Bonus for iconic campaigns
 *   6. Compute role-weighted Overall Rating
 *
 * Usage:  npx tsx prisma/cricsheetSeed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ── World Cup configuration ────────────────────────────────────────────────────

const WORLD_CUPS: { year: number; startDate: string }[] = [
  { year: 2003, startDate: '2003-02-09' },
  { year: 2007, startDate: '2007-03-13' },
  { year: 2011, startDate: '2011-02-19' },
  { year: 2015, startDate: '2015-02-14' },
  { year: 2019, startDate: '2019-05-30' },
  { year: 2023, startDate: '2023-10-05' },
];

const WC_YEARS = WORLD_CUPS.map(wc => wc.year);

const WC_EVENT_NAMES = [
  'ICC Cricket World Cup',
  'ICC World Cup',
  'World Cup',
  'Prudential World Cup',
  'Benson & Hedges World Cup',
  'Wills World Cup',
  'Reliance World Cup',
];

// ── Dominance Bonuses ─────────────────────────────────────────────────────────────

const DOMINANCE_BONUSES: { playerName: string; worldCupYear: number; bonus: number }[] = [
  // 2003
  { playerName: 'SR Tendulkar', worldCupYear: 2003, bonus: 4 },
  { playerName: 'RT Ponting', worldCupYear: 2003, bonus: 4 },
  { playerName: 'AC Gilchrist', worldCupYear: 2003, bonus: 3 },
  { playerName: 'GD McGrath', worldCupYear: 2003, bonus: 10 },
  { playerName: 'B Lee', worldCupYear: 2003, bonus: 6 },
  { playerName: 'WPUJC Vaas', worldCupYear: 2003, bonus: 6 },
  { playerName: 'SE Bond', worldCupYear: 2003, bonus: 8 },
  { playerName: 'A Symonds', worldCupYear: 2003, bonus: 3 },

  // 2007
  { playerName: 'GD McGrath', worldCupYear: 2007, bonus: 10 },
  { playerName: 'AC Gilchrist', worldCupYear: 2007, bonus: 4 },
  { playerName: 'RT Ponting', worldCupYear: 2007, bonus: 3 },
  { playerName: 'ML Hayden', worldCupYear: 2007, bonus: 3 },
  { playerName: 'SR Watson', worldCupYear: 2007, bonus: 2 },
  { playerName: 'DPMD Jayawardene', worldCupYear: 2007, bonus: 3 },
  { playerName: 'Shahid Afridi', worldCupYear: 2007, bonus: 2 },
  { playerName: 'SB Styris', worldCupYear: 2007, bonus: 2 },

  // 2011
  { playerName: 'Yuvraj Singh', worldCupYear: 2011, bonus: 5 },
  { playerName: 'SR Tendulkar', worldCupYear: 2011, bonus: 4 },
  { playerName: 'KJ O\'Brien', worldCupYear: 2011, bonus: 4 },
  { playerName: 'TM Dilshan', worldCupYear: 2011, bonus: 3 },
  { playerName: 'V Kohli', worldCupYear: 2011, bonus: 2 },
  { playerName: 'Shahid Afridi', worldCupYear: 2011, bonus: 3 },
  { playerName: 'MS Dhoni', worldCupYear: 2011, bonus: 3 },
  { playerName: 'KC Sangakkara', worldCupYear: 2011, bonus: 3 },
  { playerName: 'Wahab Riaz', worldCupYear: 2011, bonus: 4 },
  { playerName: 'Z Khan', worldCupYear: 2011, bonus: 7 },

  // 2015
  { playerName: 'MA Starc', worldCupYear: 2015, bonus: 8 },
  { playerName: 'MJ Guptill', worldCupYear: 2015, bonus: 3 },
  { playerName: 'AB de Villiers', worldCupYear: 2015, bonus: 4 },
  { playerName: 'KC Sangakkara', worldCupYear: 2015, bonus: 4 },
  { playerName: 'TA Boult', worldCupYear: 2015, bonus: 7 },
  { playerName: 'MJ Clarke', worldCupYear: 2015, bonus: 2 },
  { playerName: 'BMAJ Mendis', worldCupYear: 2015, bonus: 2 },
  { playerName: 'TM Head', worldCupYear: 2015, bonus: 2 },
  { playerName: 'GJ Maxwell', worldCupYear: 2015, bonus: 2 },

  // 2019
  { playerName: 'MA Starc', worldCupYear: 2019, bonus: 8 },
  { playerName: 'JJ Roy', worldCupYear: 2019, bonus: 3 },
  { playerName: 'KS Williamson', worldCupYear: 2019, bonus: 4 },
  { playerName: 'Shakib Al Hasan', worldCupYear: 2019, bonus: 4 },
  { playerName: 'BA Stokes', worldCupYear: 2019, bonus: 5 },
  { playerName: 'JC Archer', worldCupYear: 2019, bonus: 6 },
  { playerName: 'TA Boult', worldCupYear: 2019, bonus: 6 },
  { playerName: 'RG Sharma', worldCupYear: 2019, bonus: 4 },
  { playerName: 'JE Root', worldCupYear: 2019, bonus: 2 },
  { playerName: 'DA Warner', worldCupYear: 2019, bonus: 3 },
  
  // 2023
  { playerName: 'V Kohli', worldCupYear: 2023, bonus: 4 },
  { playerName: 'Q de Kock', worldCupYear: 2023, bonus: 3 },
  { playerName: 'MA Starc', worldCupYear: 2023, bonus: 5 },
  { playerName: 'TM Head', worldCupYear: 2023, bonus: 4 },
  { playerName: 'RA Jadeja', worldCupYear: 2023, bonus: 3 },
  { playerName: 'JC Buttler', worldCupYear: 2023, bonus: 2 },
  { playerName: 'Rashid Khan', worldCupYear: 2023, bonus: 2 },
  { playerName: 'GJ Maxwell', worldCupYear: 2023, bonus: 5 },
  { playerName: 'DA Warner', worldCupYear: 2023, bonus: 3 },
  { playerName: 'Mohammed Shami', worldCupYear: 2023, bonus: 8 },
  { playerName: 'RG Sharma', worldCupYear: 2023, bonus: 3 },
  { playerName: 'DJ Mitchell', worldCupYear: 2023, bonus: 3 },
  { playerName: 'A Zampa', worldCupYear: 2023, bonus: 5 },
  { playerName: 'G Coetzee', worldCupYear: 2023, bonus: 4 },
  { playerName: 'D Madushanka', worldCupYear: 2023, bonus: 4 },
  { playerName: 'H Klaasen', worldCupYear: 2023, bonus: 3 },
];

// ── Country normalization ──────────────────────────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
  'India': 'India', 'Australia': 'Australia', 'England': 'England',
  'Pakistan': 'Pakistan', 'South Africa': 'South Africa', 'New Zealand': 'New Zealand',
  'West Indies': 'West Indies', 'Sri Lanka': 'Sri Lanka', 'Bangladesh': 'Bangladesh',
  'Zimbabwe': 'Zimbabwe', 'Kenya': 'Kenya', 'Netherlands': 'Netherlands',
  'Ireland': 'Ireland', 'Scotland': 'Scotland', 'Canada': 'Canada',
  'United Arab Emirates': 'UAE', 'U.A.E.': 'UAE', 'Bermuda': 'Bermuda',
  'Namibia': 'Namibia', 'East Africa': 'East Africa', 'Afghanistan': 'Afghanistan',
};

function normalizeCountry(country: string): string {
  return COUNTRY_MAP[country] || country;
}

// ── Match detection helpers ────────────────────────────────────────────────────

function isWorldCupMatch(matchInfo: any): boolean {
  if (!matchInfo.event) return false;
  const eventName = matchInfo.event.name || '';
  const lowerName = eventName.toLowerCase();
  if (lowerName.includes('qualifier') || lowerName.includes('league') || lowerName.includes('challenge')) {
    return false;
  }
  return WC_EVENT_NAMES.some(name =>
    lowerName.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerName)
  );
}

function getWorldCupYear(matchInfo: any): number | null {
  if (!matchInfo.dates || matchInfo.dates.length === 0) return null;
  const year = parseInt(matchInfo.dates[0].substring(0, 4));
  const closest = WC_YEARS.find(y => Math.abs(y - year) <= 1);
  return closest || null;
}

function getMatchDate(matchInfo: any): string | null {
  if (!matchInfo.dates || matchInfo.dates.length === 0) return null;
  return matchInfo.dates[0]; // "YYYY-MM-DD"
}

// ── Player stat accumulator ────────────────────────────────────────────────────

type PlayerStat = {
  name: string;
  team: string;
  matchIds: Set<string>;
  runs: number;
  ballsFaced: number;
  timesOut: number;
  fours: number;
  sixes: number;
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  isWicketkeeper: boolean;
  battingPositions: number[];
};

function createEmptyStat(name: string, team: string): PlayerStat {
  return {
    name, team,
    matchIds: new Set(),
    runs: 0, ballsFaced: 0, timesOut: 0, fours: 0, sixes: 0,
    ballsBowled: 0, runsConceded: 0, wicketsTaken: 0,
    catches: 0, runOuts: 0, stumpings: 0,
    isWicketkeeper: false,
    battingPositions: [],
  };
}

function cloneStat(s: PlayerStat): PlayerStat {
  return {
    ...s,
    matchIds: new Set(s.matchIds),
    battingPositions: [...s.battingPositions],
  };
}

// ── Match data structure ───────────────────────────────────────────────────────

type MatchMeta = {
  matchId: string;
  date: string;       // "YYYY-MM-DD"
  isWorldCup: boolean;
  worldCupYear: number | null;
  data: any;
};

// ── Parse a single match ───────────────────────────────────────────────────────

function processMatchInto(
  meta: MatchMeta,
  statMap: Map<string, PlayerStat>,
) {
  const data = meta.data;
  const info = data.info;
  if (!info || !info.teams) return;

  const teams = info.teams as string[];

  // Build player → team mapping
  const playerTeamMap = new Map<string, string>();
  if (info.players) {
    for (const team of Object.keys(info.players)) {
      for (const player of info.players[team]) {
        playerTeamMap.set(player, team);
      }
    }
  }

  if (!data.innings) return;

  for (const innings of data.innings) {
    const battingTeam = innings.team;
    const bowlingTeam = teams.find(t => t !== battingTeam) || teams[0];
    const batterOrder = new Map<string, number>();
    let batterIndex = 0;

    if (!innings.overs) continue;

    for (const over of innings.overs) {
      if (!over.deliveries) continue;

      for (const delivery of over.deliveries) {
        const batterName = delivery.batter;
        const bowlerName = delivery.bowler;
        const batterTeam = playerTeamMap.get(batterName) || battingTeam;
        const bowlerTeam = playerTeamMap.get(bowlerName) || bowlingTeam;

        if (!batterOrder.has(batterName)) {
          batterIndex++;
          batterOrder.set(batterName, batterIndex);
        }

        const runsOff = delivery.runs?.batter ?? 0;
        const extrasTotal = delivery.runs?.extras ?? 0;
        const isWide = delivery.extras && delivery.extras.wides !== undefined;
        const isNoBall = delivery.extras && delivery.extras.noballs !== undefined;
        const batPos = batterOrder.get(batterName)!;

        // Ensure batter stat exists
        if (!statMap.has(batterName)) statMap.set(batterName, createEmptyStat(batterName, batterTeam));
        const batStat = statMap.get(batterName)!;
        batStat.matchIds.add(meta.matchId);
        batStat.battingPositions.push(batPos);
        if (!isWide) batStat.ballsFaced++;
        batStat.runs += runsOff;
        if (runsOff === 4) batStat.fours++;
        if (runsOff === 6) batStat.sixes++;

        // Ensure bowler stat exists
        if (!statMap.has(bowlerName)) statMap.set(bowlerName, createEmptyStat(bowlerName, bowlerTeam));
        const bowlStat = statMap.get(bowlerName)!;
        bowlStat.matchIds.add(meta.matchId);
        if (!isWide && !isNoBall) bowlStat.ballsBowled++;
        bowlStat.runsConceded += runsOff + extrasTotal;

        // Wickets & fielding
        if (delivery.wickets) {
          for (const wicket of delivery.wickets) {
            const dismissalKind = wicket.kind;
            const isBowlerWicket = !['run out', 'retired hurt', 'retired out', 'obstructing the field', 'timed out', 'retired not out'].includes(dismissalKind);
            const dismissedPlayer = wicket.player_out || batterName;

            if (isBowlerWicket) {
              bowlStat.wicketsTaken++;
            }

            if (statMap.has(dismissedPlayer)) {
              statMap.get(dismissedPlayer)!.timesOut++;
            }

            if (wicket.fielders) {
              for (const fielder of wicket.fielders) {
                const fielderName = fielder.name || fielder;
                if (typeof fielderName === 'string') {
                  const fielderTeam = playerTeamMap.get(fielderName) || bowlingTeam;
                  if (!statMap.has(fielderName)) statMap.set(fielderName, createEmptyStat(fielderName, fielderTeam));
                  const fStat = statMap.get(fielderName)!;
                  fStat.matchIds.add(meta.matchId);
                  if (dismissalKind === 'caught') fStat.catches++;
                  if (dismissalKind === 'run out') fStat.runOuts++;
                  if (dismissalKind === 'stumped') { fStat.stumpings++; fStat.isWicketkeeper = true; }
                }
              }
            }
          }
        }
      }
    }
  }
}

// ── Rating computations ────────────────────────────────────────────────────────

function percentile(sorted: number[], value: number): number {
  if (sorted.length === 0) return 50;
  let count = 0;
  for (const v of sorted) {
    if (v <= value) count++;
    else break;
  }
  return (count / sorted.length) * 100;
}

function invertedPercentile(sorted: number[], value: number): number {
  return 100 - percentile(sorted, value);
}

type ComputedRatings = {
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
};

function computeRatingsForGroup(stats: PlayerStat[]): Map<string, ComputedRatings> {
  const result = new Map<string, ComputedRatings>();
  if (stats.length === 0) return result;

  // Derived values
  const derived = stats.map(s => {
    const avg = s.timesOut > 0 ? s.runs / s.timesOut : s.runs;
    const sr = s.ballsFaced > 0 ? (s.runs / s.ballsFaced) * 100 : 0;
    const bowlAvg = s.wicketsTaken > 0 ? s.runsConceded / s.wicketsTaken : null;
    const oversBowled = s.ballsBowled / 6;
    const econ = oversBowled > 0 ? s.runsConceded / oversBowled : null;
    const bowlSR = s.wicketsTaken > 0 ? s.ballsBowled / s.wicketsTaken : null;
    const fieldScore = s.catches + s.runOuts * 0.5 + s.stumpings * 1.5;
    const sortedPos = [...s.battingPositions].sort((a, b) => a - b);
    const medianBatPos = sortedPos.length > 0 ? sortedPos[Math.floor(sortedPos.length / 2)] : 6;
    return { stat: s, avg, sr, bowlAvg, econ, bowlSR, fieldScore, medianBatPos };
  });

  // Build sorted arrays for percentile calculations
  const allRuns = derived.map(d => d.stat.runs).sort((a, b) => a - b);
  const allAvgs = derived.filter(d => d.avg > 0).map(d => d.avg).sort((a, b) => a - b);
  const allSRs = derived.filter(d => d.sr > 0).map(d => d.sr).sort((a, b) => a - b);

  const bowlers = derived.filter(d => d.stat.wicketsTaken >= 1 && d.stat.ballsBowled >= 12);
  const allWkts = bowlers.map(d => d.stat.wicketsTaken).sort((a, b) => a - b);
  const allBowlAvgs = bowlers.filter(d => d.bowlAvg !== null).map(d => d.bowlAvg!).sort((a, b) => a - b);
  const allEcons = bowlers.filter(d => d.econ !== null).map(d => d.econ!).sort((a, b) => a - b);
  const allBowlSRs = bowlers.filter(d => d.bowlSR !== null).map(d => d.bowlSR!).sort((a, b) => a - b);

  const allFieldScores = derived.map(d => d.fieldScore).sort((a, b) => a - b);

  for (const d of derived) {
    const { stat, avg, sr, bowlAvg, econ, bowlSR, fieldScore } = d;

    // ── Batting Rating ──
    const runsPct = percentile(allRuns, stat.runs);
    const avgPct = avg > 0 ? percentile(allAvgs, avg) : 10;
    const srPct = sr > 0 ? percentile(allSRs, sr) : 10;
    // Hundreds proxy: runs / average gives rough innings count, high avg + high runs = consistency
    const consistencyBonus = (avg > 35 && stat.runs > 200) ? 5 : (avg > 25 && stat.runs > 100) ? 2 : 0;
    let battingRaw = 0.35 * runsPct + 0.30 * avgPct + 0.20 * srPct + 0.15 * (runsPct * 0.5 + avgPct * 0.5) + consistencyBonus;
    let battingRating = Math.max(40, Math.min(99, Math.round(battingRaw)));

    // ── Bowling Rating ──
    let bowlingRating = 40; // minimum floor
    if (stat.wicketsTaken >= 1 && stat.ballsBowled >= 12) {
      const oversBowled = stat.ballsBowled / 6;
      const matchesPlayed = Math.max(1, stat.matchIds.size);
      const oversPerMatch = oversBowled / matchesPlayed;
      const wicketsPerMatch = stat.wicketsTaken / matchesPlayed;
      
      // Use absolute benchmarks instead of percentiles for more realistic ratings
      // Bowling Average: lower is better (elite < 20, good < 30, avg < 40)
      let bowlAvgScore = 40;
      if (bowlAvg !== null) {
        if (bowlAvg <= 15) bowlAvgScore = 99;
        else if (bowlAvg <= 20) bowlAvgScore = 90 + (20 - bowlAvg) / 5 * 9;
        else if (bowlAvg <= 25) bowlAvgScore = 78 + (25 - bowlAvg) / 5 * 12;
        else if (bowlAvg <= 30) bowlAvgScore = 65 + (30 - bowlAvg) / 5 * 13;
        else if (bowlAvg <= 40) bowlAvgScore = 50 + (40 - bowlAvg) / 10 * 15;
        else if (bowlAvg <= 60) bowlAvgScore = 40 + (60 - bowlAvg) / 20 * 10;
        else bowlAvgScore = 40;
      }
      
      // Economy: lower is better (elite < 4.0, good < 5.0, avg < 6.0)
      let econScore = 40;
      if (econ !== null) {
        if (econ <= 3.5) econScore = 99;
        else if (econ <= 4.0) econScore = 90 + (4.0 - econ) / 0.5 * 9;
        else if (econ <= 4.5) econScore = 80 + (4.5 - econ) / 0.5 * 10;
        else if (econ <= 5.0) econScore = 70 + (5.0 - econ) / 0.5 * 10;
        else if (econ <= 5.5) econScore = 60 + (5.5 - econ) / 0.5 * 10;
        else if (econ <= 6.0) econScore = 50 + (6.0 - econ) / 0.5 * 10;
        else if (econ <= 7.0) econScore = 40 + (7.0 - econ) / 1.0 * 10;
        else econScore = 40;
      }
      
      // Wickets per match score (combines with total wickets logic implicitly since WPM is the strongest proxy for wicket-taking ability)
      let wpmScore = 40;
      if (wicketsPerMatch >= 3.0) wpmScore = 99;
      else if (wicketsPerMatch >= 2.5) wpmScore = 92 + (wicketsPerMatch - 2.5) / 0.5 * 7;
      else if (wicketsPerMatch >= 2.0) wpmScore = 82 + (wicketsPerMatch - 2.0) / 0.5 * 10;
      else if (wicketsPerMatch >= 1.5) wpmScore = 72 + (wicketsPerMatch - 1.5) / 0.5 * 10;
      else if (wicketsPerMatch >= 1.0) wpmScore = 60 + (wicketsPerMatch - 1.0) / 0.5 * 12;
      else if (wicketsPerMatch >= 0.5) wpmScore = 45 + (wicketsPerMatch - 0.5) / 0.5 * 15;
      else wpmScore = 40;
      
      // Enhance wpmScore slightly based on raw total wickets to reward longevity/volume in the tournament or career
      let totalWicketsBonus = 0;
      if (stat.wicketsTaken >= 20) totalWicketsBonus = 5;
      else if (stat.wicketsTaken >= 15) totalWicketsBonus = 3;
      else if (stat.wicketsTaken >= 10) totalWicketsBonus = 1;
      
      const wicketScore = Math.min(99, wpmScore + totalWicketsBonus);
      
      // Bowling Strike Rate: lower is better (elite < 25, good < 35)
      let bowlSRScore = 40;
      if (bowlSR !== null) {
        if (bowlSR <= 20) bowlSRScore = 99;
        else if (bowlSR <= 25) bowlSRScore = 88 + (25 - bowlSR) / 5 * 11;
        else if (bowlSR <= 30) bowlSRScore = 75 + (30 - bowlSR) / 5 * 13;
        else if (bowlSR <= 35) bowlSRScore = 65 + (35 - bowlSR) / 5 * 10;
        else if (bowlSR <= 45) bowlSRScore = 50 + (45 - bowlSR) / 10 * 15;
        else bowlSRScore = 40 + Math.max(0, (60 - bowlSR) / 15 * 10);
      }
      
      // Weighted combination based on user requirement: 40% Wickets, 25% Avg, 20% Econ, 15% SR
      let bowlingRaw = 0.40 * wicketScore + 0.25 * bowlAvgScore + 0.20 * econScore + 0.15 * bowlSRScore;
      
      // Volume Penalty: Graduated scale based on bowling workload
      // This ensures part-timers (1-2 overs/match) get heavily penalized,
      // while genuine 5th bowlers (4-5 overs/match) get a slight penalty,
      // and frontline bowlers (6+ overs/match) are unaffected.
      if (oversPerMatch < 5) {
        // Scale from 0.0 (at 0 overs) to 1.0 (at 5 overs)
        const penaltyFactor = Math.min(1, oversPerMatch / 5);
        bowlingRaw = 40 + (bowlingRaw - 40) * penaltyFactor;
      }
      
      bowlingRating = Math.max(40, Math.min(99, Math.round(bowlingRaw)));
    }

    // ── Fielding Rating ──
    const fieldPct = percentile(allFieldScores, fieldScore);
    let fieldingRating = Math.max(50, Math.min(99, Math.round(50 + (fieldPct / 100) * 49)));
    if (stat.isWicketkeeper) fieldingRating = Math.min(99, fieldingRating + 10);

    result.set(stat.name, { battingRating, bowlingRating, fieldingRating });
  }

  return result;
}

// ── Dynamic weighting ──────────────────────────────────────────────────────────

function getDynamicWeight(careerMatches: number): { careerW: number; wcW: number } {
  const t = Math.min(careerMatches / 120, 1);
  const careerW = 0.25 + 0.50 * (1 - Math.exp(-3 * t));
  return { careerW, wcW: 1 - careerW };
}

function getPlayerRole(bat: number, bowl: number): 'BAT' | 'BOWL' | 'AR' {
  // To be an AR, must be genuinely good at both to avoid penalizing bowlers with decent batting
  if (bat >= 65 && bowl >= 65) return 'AR';
  if (bat > bowl + 15) return 'BAT';
  if (bowl > bat + 15) return 'BOWL';
  if (bat >= bowl) return 'BAT';
  return 'BOWL';
}

function computeOverallRating(bat: number, bowl: number, field: number, isWk: boolean, role: 'BAT' | 'BOWL' | 'AR', dominanceBonus: number = 0): number {
  let baseOvr: number;
  
  if (role === 'BAT') {
    // Batter: 70% Bat, 10% Bowl, 20% Field
    baseOvr = 0.70 * bat + 0.10 * bowl + 0.20 * field;
  } else if (role === 'BOWL') {
    // Bowler: 10% Bat, 80% Bowl, 10% Field (user requested 80/10/10)
    baseOvr = 0.10 * bat + 0.80 * bowl + 0.10 * field;
  } else if (role === 'AR') {
    // AR: 45% Bat, 40% Bowl, 15% Field
    baseOvr = 0.45 * bat + 0.40 * bowl + 0.15 * field;
  } else {
    // Fallback
    baseOvr = 0.50 * bat + 0.50 * bowl;
  }

  // Wicketkeeper override
  if (isWk) {
    baseOvr = 0.60 * bat + 0.10 * bowl + 0.30 * field;
  }

  // Bowler Role Boost
  if (role === 'BOWL') {
    baseOvr += 3;
  }

  return Math.min(99, Math.round(baseOvr) + dominanceBonus);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const dataDir = path.join(__dirname, '..', 'cricsheet_data');
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 1: Load and sort all matches by date
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📂 Loading all ODI match files...');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  const allMatches: MatchMeta[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const data = JSON.parse(raw);
      const matchId = file.replace('.json', '');
      const date = getMatchDate(data.info);
      if (!date) continue;

      const isWC = isWorldCupMatch(data.info);
      const wcYear = isWC ? getWorldCupYear(data.info) : null;

      allMatches.push({ matchId, date, isWorldCup: isWC, worldCupYear: wcYear, data });
    } catch {}
  }

  // Sort chronologically
  allMatches.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`📊 Loaded ${allMatches.length} matches (${allMatches[0]?.date} → ${allMatches[allMatches.length - 1]?.date})`);

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 2: Build career snapshots for each WC and WC-only stats
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n🏏 Building career snapshots and WC stats...');

  // PASS 1: Build WC-only stats by directly filtering WC matches per year
  const wcOnlyStats = new Map<number, Map<string, PlayerStat>>();
  for (const wc of WORLD_CUPS) {
    const wcMap = new Map<string, PlayerStat>();
    for (const match of allMatches) {
      if (match.isWorldCup && match.worldCupYear === wc.year) {
        processMatchInto(match, wcMap);
      }
    }
    wcOnlyStats.set(wc.year, wcMap);
  }

  // PASS 2: Build career snapshots — for each WC, accumulate all non-WC matches before the start date
  const careerSnapshots = new Map<number, Map<string, PlayerStat>>();
  for (const wc of WORLD_CUPS) {
    const careerMap = new Map<string, PlayerStat>();
    for (const match of allMatches) {
      // Include all matches (WC and non-WC) that happened BEFORE this WC's start date
      if (match.date < wc.startDate) {
        processMatchInto(match, careerMap);
      }
    }
    careerSnapshots.set(wc.year, careerMap);
    const wcStats = wcOnlyStats.get(wc.year)!;
    console.log(`  ${wc.year}: ${careerMap.size} career profiles, ${wcStats.size} WC participants`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 3 & 4: Compute ratings per WC year
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n📐 Computing ratings...');

  // Build dominance bonus lookup
  const legacyLookup = new Map<string, number>();
  for (const lb of DOMINANCE_BONUSES) {
    legacyLookup.set(`${lb.playerName}__${lb.worldCupYear}`, lb.bonus);
  }

  type ProcessedPlayer = {
    name: string;
    team: string;
    worldCupYear: number;
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
    careerMatches: number;
    dominanceBonus: number;
    baseBowlingRating: number;
    wcBowlingRating: number;
    careerW: number;
    wcW: number;
  };

  const allProcessed: ProcessedPlayer[] = [];

  for (const wc of WORLD_CUPS) {
    const wcStats = wcOnlyStats.get(wc.year)!;
    const careerSnap = careerSnapshots.get(wc.year)!;

    // Only players who participated in the WC
    const wcParticipants = Array.from(wcStats.values()).filter(s => s.matchIds.size >= 1);
    if (wcParticipants.length === 0) continue;

    // Build career stats ONLY for WC participants (for fair percentiling)
    const careerForWCPlayers: PlayerStat[] = [];
    for (const wcPlayer of wcParticipants) {
      const career = careerSnap.get(wcPlayer.name);
      if (career && career.matchIds.size > 0) {
        careerForWCPlayers.push(career);
      } else {
        // Player has no pre-WC career data → create a minimal entry
        careerForWCPlayers.push(createEmptyStat(wcPlayer.name, wcPlayer.team));
      }
    }

    // Compute ratings for each group
    const baseRatings = computeRatingsForGroup(careerForWCPlayers);
    const wcRatings = computeRatingsForGroup(wcParticipants);

    for (const wcPlayer of wcParticipants) {
      const name = wcPlayer.name;
      const career = careerSnap.get(name);
      const careerMatches = career ? career.matchIds.size : 0;

      const base = baseRatings.get(name) || { battingRating: 40, bowlingRating: 40, fieldingRating: 50 };
      const wcRate = wcRatings.get(name) || { battingRating: 40, bowlingRating: 40, fieldingRating: 50 };

      // Dynamic weighting
      const { careerW, wcW } = getDynamicWeight(careerMatches);

      // Dominance bonus
      const dominanceBonus = legacyLookup.get(`${name}__${wc.year}`) || 0;

      // Blend ratings
      const battingRating = Math.max(40, Math.min(99, Math.round(base.battingRating * careerW + wcRate.battingRating * wcW + dominanceBonus)));
      const bowlingRating = Math.max(40, Math.min(99, Math.round(base.bowlingRating * careerW + wcRate.bowlingRating * wcW + dominanceBonus)));
      const fieldingRating = Math.max(50, Math.min(99, Math.round(base.fieldingRating * careerW + wcRate.fieldingRating * wcW)));

      // Overall (role-weighted)
      const isWk = wcPlayer.isWicketkeeper || (career?.isWicketkeeper ?? false);
      const role = getPlayerRole(battingRating, bowlingRating);
      const overallRating = computeOverallRating(battingRating, bowlingRating, fieldingRating, isWk, role, dominanceBonus);

      // Batting order from career and WC performance
      const allBattingPositions = new Set([...wcPlayer.battingPositions, ...(career ? career.battingPositions : [])]);
      const sortedPos = [...allBattingPositions].sort((a, b) => a - b);
      
      let medianBatPos = 11; // Default to tailender if they literally never batted
      if (sortedPos.length > 0) {
        medianBatPos = sortedPos[Math.floor(sortedPos.length / 2)];
      }

      let battingOrderType: 'TOP' | 'MID' | 'LOW';
      if (medianBatPos <= 3) battingOrderType = 'TOP';
      else if (medianBatPos <= 7) battingOrderType = 'MID';
      else battingOrderType = 'LOW';

      // Genuine bowlers should generally be forced to LOW order unless they specifically bat in the top 7
      if (role === 'BOWL' && medianBatPos > 7) {
        battingOrderType = 'LOW';
      }

      let eligiblePositions: string;
      if (battingOrderType === 'TOP') eligiblePositions = '1,2,3';
      else if (battingOrderType === 'MID') eligiblePositions = '4,5,6,7';
      else eligiblePositions = '8,9,10,11';

      // Derived stats for display (from WC performance)
      const avg = wcPlayer.timesOut > 0 ? wcPlayer.runs / wcPlayer.timesOut : wcPlayer.runs;
      const sr = wcPlayer.ballsFaced > 0 ? (wcPlayer.runs / wcPlayer.ballsFaced) * 100 : 0;
      const bowlAvg = wcPlayer.wicketsTaken > 0 ? wcPlayer.runsConceded / wcPlayer.wicketsTaken : null;
      const oversBowled = wcPlayer.ballsBowled / 6;
      const econ = oversBowled > 0 ? wcPlayer.runsConceded / oversBowled : null;

      allProcessed.push({
        name,
        team: normalizeCountry(wcPlayer.team),
        worldCupYear: wc.year,
        matches: wcPlayer.matchIds.size,
        runs: wcPlayer.runs,
        average: parseFloat(avg.toFixed(2)),
        strikeRate: parseFloat(sr.toFixed(2)),
        wickets: wcPlayer.wicketsTaken,
        bowlingAverage: bowlAvg !== null ? parseFloat(bowlAvg.toFixed(2)) : null,
        economy: econ !== null ? parseFloat(econ.toFixed(2)) : null,
        catches: wcPlayer.catches,
        battingRating,
        bowlingRating,
        fieldingRating,
        overallRating,
        eligiblePositions,
        battingOrderType,
        isWicketkeeper: isWk,
        careerMatches,
        dominanceBonus,
        baseBowlingRating: base.bowlingRating,
        wcBowlingRating: wcRate.bowlingRating,
        careerW,
        wcW,
      });
    }

    console.log(`  ${wc.year}: ${wcParticipants.length} players rated (avg career matches: ${Math.round(careerForWCPlayers.reduce((s, c) => s + c.matchIds.size, 0) / careerForWCPlayers.length)})`);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 5: Seed database
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n🗑️  Clearing existing database...');
  await prisma.playerVersion.deleteMany();
  await prisma.player.deleteMany();
  await prisma.dominanceBonus.deleteMany();

  // Seed dominance bonuses
  try {
    for (const lb of DOMINANCE_BONUSES) {
      await prisma.dominanceBonus.create({ data: lb });
    }
    console.log(`🌟 Seeded ${DOMINANCE_BONUSES.length} dominance bonuses`);
  } catch (e) {
    console.warn(`⚠️  Could not seed dominance bonuses (table might be empty or missing)`);
  }

  console.log('📝 Seeding players...');
  let addedCount = 0;
  let skippedCount = 0;

  for (const p of allProcessed) {
    try {
      if (p.matches < 1) continue;
      if (p.runs < 1 && p.wickets < 1 && p.catches < 1) continue;

      let player = await prisma.player.findFirst({
        where: { name: p.name, country: p.team }
      });

      if (!player) {
        player = await prisma.player.create({
          data: {
            name: p.name,
            country: p.team,
            battingStyle: 'Right-hand bat',
            bowlingStyle: p.wickets >= 3 ? 'Right-arm medium' : 'Right-arm medium',
          }
        });
      }

      const existing = await prisma.playerVersion.findUnique({
        where: { playerId_worldCupYear: { playerId: player.id, worldCupYear: p.worldCupYear } }
      });

      if (!existing) {
        await prisma.playerVersion.create({
          data: {
            playerId: player.id,
            worldCupYear: p.worldCupYear,
            team: p.team,
            matches: p.matches,
            runs: p.runs,
            average: p.average,
            strikeRate: p.strikeRate,
            wickets: p.wickets,
            bowlingAverage: p.bowlingAverage,
            economy: p.economy,
            catches: p.catches,
            battingRating: p.battingRating,
            bowlingRating: p.bowlingRating,
            fieldingRating: p.fieldingRating,
            overallRating: p.overallRating,
            eligiblePositions: p.eligiblePositions,
            battingOrderType: p.battingOrderType,
            isWicketkeeper: p.isWicketkeeper,
          }
        });
        addedCount++;
      }
    } catch (e) {
      console.error(`Error processing ${p.name}:`, e);
      skippedCount++;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 6: Print results
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`\n✅ Seed complete! Added ${addedCount} player versions.`);

  // Benchmark players
  const benchmarks = [
    'SR Tendulkar', 'V Kohli', 'RT Ponting', 'Yuvraj Singh',
    'MA Starc', 'GD McGrath', 'MJ Guptill', 'KJ O\'Brien',
    'AB de Villiers', 'BA Stokes', 'Shakib Al Hasan', 'MS Dhoni',
  ];

  console.log('\n🏆 Benchmark Player Ratings:');
  console.log('─'.repeat(90));
  console.log(`${'Player'.padEnd(22)} ${'Year'.padEnd(5)} ${'BAT'.padEnd(5)} ${'BOWL'.padEnd(5)} ${'FLD'.padEnd(5)} ${'OVR'.padEnd(5)} ${'Role'.padEnd(5)} ${'Career'.padEnd(7)} ${'Wt'.padEnd(12)} ${'Bonus'.padEnd(6)}`);
  console.log('─'.repeat(90));

  for (const p of allProcessed) {
    if (benchmarks.includes(p.name)) {
      const { careerW } = getDynamicWeight(p.careerMatches);
      const role = getPlayerRole(p.battingRating, p.bowlingRating);
      console.log(
        `${p.name.padEnd(22)} ${String(p.worldCupYear).padEnd(5)} ` +
        `${String(p.battingRating).padEnd(5)} ${String(p.bowlingRating).padEnd(5)} ` +
        `${String(p.fieldingRating).padEnd(5)} ${String(p.overallRating).padEnd(5)} ` +
        `${role.padEnd(5)} ${String(p.careerMatches).padEnd(7)} ` +
        `${(careerW * 100).toFixed(0)}/${((1 - careerW) * 100).toFixed(0)}`.padEnd(12) +
        `+${p.dominanceBonus}`
      );
    }
  }

  // Top players per WC
  console.log('\n🏅 Top 5 Overall per World Cup:');
  for (const wc of WORLD_CUPS) {
    const wcPlayers = allProcessed
      .filter(p => p.worldCupYear === wc.year && p.matches >= 2)
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 5);
    console.log(`\n  ${wc.year}:`);
    for (const p of wcPlayers) {
      const role = getPlayerRole(p.battingRating, p.bowlingRating);
      console.log(`    ${p.name.padEnd(25)} ${p.team.padEnd(15)} OVR:${p.overallRating} BAT:${p.battingRating} BWL:${p.bowlingRating} FLD:${p.fieldingRating} [${role}]`);
    }
  }

  const total = await prisma.playerVersion.count();
  const teamCount = await prisma.playerVersion.groupBy({ by: ['team'] }).then(r => r.length);
  const squadCount = await prisma.playerVersion.groupBy({ by: ['team', 'worldCupYear'] }).then(r => r.length);
  console.log(`\n📊 Final: ${total} player versions, ${teamCount} teams, ${squadCount} squads`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
