export interface PlayerInput {
  name: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  rawMetrics: string;
  coachingChanges: string;
  recentNews: string;
}

export interface RegressionFlag {
  metric: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SystemAnalysis {
  playCaller: string;
  tendency: string;
  impactScore: number; // 1-100 impact of play-caller on this position
}

export interface TrueRangeOfOutcomes {
  floorDescription: string;
  ceilingDescription: string;
  floorValue: number; // 0-25 fantasy PPG or score
  ceilingValue: number; // 0-25 fantasy PPG or score
  metricType: 'PPG' | 'Score';
}

export interface FilterResult {
  playerName: string;
  team: string;
  position: string;
  objectiveMetrics: string[];
  narrativeTrashBin: string;
  trueRangeOfOutcomes: TrueRangeOfOutcomes;
  regressionFlags: RegressionFlag[];
  systemAnalysis: SystemAnalysis;
  varianceAssessment: string;
  clinicalScore: number; // 1-10 clinical rating of player profile
}

export interface DraftPlayer {
  id: string;
  name: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  byeWeek: number;
  adp: number;
  projectedPointsStd: number;
  projectedPointsPpr: number;
  isBpa?: boolean; // Best Player Available
  isDrafted: boolean;
  draftedBy?: 'user' | 'opponent' | null;
  draftPickNumber?: number;
  tier?: number; // Fantasy Draft Tier (1 = Elite, etc.)
  // Raw attributes for AI analysis
  rawMetrics: string;
  coachingChanges: string;
  recentNews: string;
  // Pre-cached analysis to avoid redundant API calls and speed up interaction
  preCachedAnalysis?: FilterResult;
  // User Overrides
  manualAdpOverride?: number;
  isSleeperTarget?: boolean;
}

export interface DraftSettings {
  scoring: 'STD' | 'PPR';
  userPickNumber: number; // e.g. 5th pick in a 12-team league
  totalTeams: number; // e.g. 12
  timeLimitSeconds: number; // e.g. 90
  teamNames?: Record<number, string>;
}

// A named, pre-assembled draft configuration the user saves ahead of time.
// Purely setup (scoring, teams, slot, specialty rules) — no players drafted.
export interface DraftSetup {
  id: string;
  name: string;
  createdAt: number;
  settings: DraftSettings;
  scoring: {
    ppr: number;
    passingTd: number;
    interception: number;
    tePremium: number;
    passingBonus300: number;
    rushingBonus100: number;
    receivingBonus100: number;
    rushingTd: number;
    receivingTd: number;
  };
}

export interface DraftHistoryItem {
  pickNumber: number;
  playerId: string;
  playerName: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  team: string;
  draftedBy: 'user' | 'opponent';
}

