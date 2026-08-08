import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import HomeHub from './components/HomeHub';
import HowToPage from './components/HowToPage';
import AnalysisReport from './components/AnalysisReport';
import DiagnosticLoader from './components/DiagnosticLoader';
import { PlayerInput, FilterResult, DraftPlayer, DraftSettings, DraftHistoryItem, DraftSetup } from './types';
import { INITIAL_DRAFT_PLAYERS } from './data';
import { getFullPlayerPool, assignTiers } from './additionalPlayers';
import { 
  Activity, Sliders, ChevronRight, AlertCircle, 
  X, Info, Database, BarChart3, TrendingDown, Target,
  Clock, Play, Pause, RotateCcw, Search, UserPlus,
  Sparkles, CheckCircle2, User, Users, ChevronDown, ListFilter,
  PlusCircle, Undo2, AlertTriangle, Trash2, Settings, Calendar, Home, Save, BookOpen,
  CalendarRange, ArrowLeftRight, Link2
} from 'lucide-react';

// Helper to determine if a specific pick number belongs to the user's draft slot in a snake draft
function isUserPick(pickNo: number, slot: number, totalTeams: number): boolean {
  const round = Math.floor((pickNo - 1) / totalTeams) + 1;
  const pickInRound = ((pickNo - 1) % totalTeams) + 1;
  const isEvenRound = round % 2 === 0;
  if (isEvenRound) {
    return pickInRound === (totalTeams - slot + 1);
  } else {
    return pickInRound === slot;
  }
}

// Normalizes a player name so it matches Sleeper's database regardless of
// punctuation, apostrophes, periods, or "Jr."/"Sr." suffixes.
function normalizeSleeperName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/(jr|sr)$/, '')
    .trim();
}

// Synthesizes a short alarm chime using the Web Audio API (no audio file needed).
let alarmAudioCtx: AudioContext | null = null;
function getAlarmAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!alarmAudioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    alarmAudioCtx = new Ctx();
  }
  if (alarmAudioCtx.state === 'suspended') {
    alarmAudioCtx.resume();
  }
  return alarmAudioCtx;
}

function playAlarmChime(freqs: number[], duration: number) {
  const ctx = getAlarmAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.15;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  });
}

export default function App() {
  // Draft Settings State
  const [settings, setSettings] = useState<DraftSettings>({
    scoring: 'PPR',
    userPickNumber: 5,
    totalTeams: 12,
    timeLimitSeconds: 90,
  });

  // Draft Board Players List State
  const [players, setPlayers] = useState<DraftPlayer[]>(() => {
    // Load full player pool (~240 players)
    const fullPool = getFullPlayerPool(INITIAL_DRAFT_PLAYERS);
    // Assign positional tiers based on initial ADP
    const tieredPool = assignTiers(fullPool);
    // Sort initially by projected points (PPR)
    return [...tieredPool].sort((a, b) => b.projectedPointsPpr - a.projectedPointsPpr);
  });

  // Selected Player for detailed analysis panel
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('9'); // Default to Bijan Robinson (has pre-cached analysis)

  // Custom Player Creator state
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customPlayerForm, setCustomPlayerForm] = useState<Omit<DraftPlayer, 'id' | 'isDrafted'>>({
    name: '',
    team: '',
    position: 'RB',
    byeWeek: 9,
    adp: 120,
    projectedPointsStd: 100,
    projectedPointsPpr: 130,
    rawMetrics: '',
    coachingChanges: '',
    recentNews: '',
  });

  // Filters State
  const [activePositionFilter, setActivePositionFilter] = useState<'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'>('ALL');
  const [activeTierFilter, setActiveTierFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDrafted, setShowDrafted] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'ADP' | 'PROJECTIONS'>('ADP');

  // Sleeper Rankings State
  const [isPublicSleeperAdpLoading, setIsPublicSleeperAdpLoading] = useState<boolean>(false);
  const [sleeperError, setSleeperError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Sleeper Projections State (fresh projected points, free public API — no key needed)
  const [isSleeperProjectionsLoading, setIsSleeperProjectionsLoading] = useState<boolean>(false);
  const [sleeperProjectionsError, setSleeperProjectionsError] = useState<string | null>(null);

  // Bring-Your-Own-Key: user's own Gemini API key, saved only on this device
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try { return localStorage.getItem('td_gemini_api_key') || ''; } catch { return ''; }
  });
  const [aiKeyInput, setAiKeyInput] = useState<string>('');

  // Active Draft Board stats
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentPick, setCurrentPick] = useState<number>(1);
  const [totalDraftedCount, setTotalDraftedCount] = useState<number>(0);

  // Dynamic Custom Scoring Configurator State
  const [scoringSettings, setScoringSettings] = useState({
    ppr: 1.0, // 0.0 Standard, 0.5 Half, 1.0 PPR, etc.
    passingTd: 4.0, // standard is 4.0
    interception: -2.0, // standard is -2.0
    // Advanced/Bracket scoring options
    tePremium: 0.0, // Extra points per reception for TEs (e.g., 0.5, 1.0)
    passingBonus300: 0.0, // Bonus points for 300+ passing yards game (e.g., 3.0)
    rushingBonus100: 0.0, // Bonus points for 100+ rushing yards game (e.g., 3.0)
    receivingBonus100: 0.0, // Bonus points for 100+ receiving yards game (e.g., 3.0)
    rushingTd: 6.0, // points per rushing touchdown (standard is 6.0)
    receivingTd: 6.0, // points per receiving touchdown (standard is 6.0)
  });
  const [showAdvancedScoring, setShowAdvancedScoring] = useState<boolean>(false);
  const [showScoringModal, setShowScoringModal] = useState<boolean>(false);
  const [isMockDraftActive, setIsMockDraftActive] = useState<boolean>(false);

  // Pick-Time Coach state (AI one-liner, cached per pick)
  const [coachAiText, setCoachAiText] = useState<string | null>(null);
  const [coachAiLoading, setCoachAiLoading] = useState<boolean>(false);
  const [coachAiPickKey, setCoachAiPickKey] = useState<number>(-1);
  // Coach panel visibility: button toggles it manually; auto-shows on the user's turn
  const [showCoachPanel, setShowCoachPanel] = useState<boolean>(false);

  // Draft Recap: shown when the final pick has been made
  const [showDraftRecap, setShowDraftRecap] = useState<boolean>(false);
  const [recapDismissed, setRecapDismissed] = useState<boolean>(false);
  

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(true);

  // Track previous pick to trigger audio alarms on turn transitions
  const prevPickRef = useRef<number>(1);

  // Sleeper Rankings Accordion State
  const [isSleeperSyncOpen, setIsSleeperSyncOpen] = useState<boolean>(false);

  // Personal Edge Accordion State
  const [showPersonalEdgePanel, setShowPersonalEdgePanel] = useState<boolean>(false);
  const [enablePersonalEdge, setEnablePersonalEdge] = useState<boolean>(true);

  // Core backup handcuff mapping for high-value running backs
  // Last-tab memory: remember which tab the user had open when they last used the app
  const [activeTopTab, setActiveTopTabState] = useState<'players' | 'board' | 'squad' | 'log' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('td_last_tab');
      if (saved === 'players' || saved === 'board' || saved === 'squad' || saved === 'log' || saved === 'settings') {
        return saved;
      }
    } catch { /* ignore */ }
    return 'players';
  });
  const setActiveTopTab = (tab: 'players' | 'board' | 'squad' | 'log' | 'settings') => {
    setActiveTopTabState(tab);
    try { localStorage.setItem('td_last_tab', tab); } catch { /* ignore */ }
  };

  // App stage flow: splash → hub (menu) → draft room.
  // Splash shows on EVERY fresh open (so the app feels like a real app);
  // you only see it when the app first launches, then navigate freely.
  const [appStage, setAppStage] = useState<'splash' | 'hub' | 'draft' | 'howto'>('splash');
  const goToHub = () => setAppStage('hub');
  const goToDraft = () => setAppStage('draft');
  const handleEnter = () => setAppStage('hub');

  // Home button dropdown: lets you jump straight to any page from anywhere.
  const [showHomeMenu, setShowHomeMenu] = useState<boolean>(false);

  // Draft Setups: named, pre-assembled draft configurations saved on this device.
  const [savedSetups, setSavedSetups] = useState<DraftSetup[]>(() => {
    try {
      const raw = localStorage.getItem('td_draft_setups');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as DraftSetup[];
      }
    } catch { /* ignore */ }
    return [];
  });
  // Modal state for saving / loading setups
  const [showSaveSetupModal, setShowSaveSetupModal] = useState<boolean>(false);
  const [setupNameInput, setSetupNameInput] = useState<string>('');
  const [showSetupListModal, setShowSetupListModal] = useState<boolean>(false);
  const [setupToConfirmLoad, setSetupToConfirmLoad] = useState<DraftSetup | null>(null);
  const [showMockSetupModal, setShowMockSetupModal] = useState<boolean>(false);

  const HANDCUFF_MAP: Record<string, string[]> = {
    'Christian McCaffrey': ['Jordan Mason', 'Isaac Guerendo'],
    'Breece Hall': ['Braelon Allen'],
    'Kyren Williams': ['Blake Corum'],
    'Bijan Robinson': ['Tyler Allgeier'],
    'Jonathan Taylor': ['Trey Sermon'],
    'Saquon Barkley': ['Kenneth Gainwell', 'Will Shipley'],
    'Jahmyr Gibbs': ['Sione Vaki', 'Craig Reynolds'],
    'David Montgomery': ['Dameon Pierce'],
    'Isiah Pacheco': ['Samaje Perine', 'Clyde Edwards-Helaire'],
    'Travis Etienne Jr.': ['Tank Bigsby'],
    'Kenneth Walker III': ['Zach Charbonnet'],
    'James Cook': ['Ray Davis'],
    'De\'Von Achane': ['Raheem Mostert', 'Jaylen Wright'],
    'Raheem Mostert': ['De\'Von Achane', 'Jaylen Wright'],
  };

  // 32 NFL Teams offensive tempo / plays per game (measured from recent season snaps)
  const TEAM_PACE_STATS: Record<string, { playsPerGame: number; tier: 'Elite' | 'Above Average' | 'Average' | 'Below Average' | 'Slow' }> = {
    CLE: { playsPerGame: 68.2, tier: 'Elite' },
    IND: { playsPerGame: 67.5, tier: 'Elite' },
    PHI: { playsPerGame: 66.8, tier: 'Elite' },
    BAL: { playsPerGame: 65.5, tier: 'Above Average' },
    DAL: { playsPerGame: 65.2, tier: 'Above Average' },
    CIN: { playsPerGame: 64.8, tier: 'Above Average' },
    DET: { playsPerGame: 64.6, tier: 'Above Average' },
    BUF: { playsPerGame: 64.3, tier: 'Above Average' },
    KC: { playsPerGame: 64.1, tier: 'Above Average' },
    MIN: { playsPerGame: 63.9, tier: 'Above Average' },
    HOU: { playsPerGame: 63.8, tier: 'Average' },
    GB: { playsPerGame: 63.5, tier: 'Average' },
    LAR: { playsPerGame: 63.2, tier: 'Average' },
    ARI: { playsPerGame: 62.9, tier: 'Average' },
    MIA: { playsPerGame: 62.7, tier: 'Average' },
    JAX: { playsPerGame: 62.4, tier: 'Average' },
    TB: { playsPerGame: 62.2, tier: 'Average' },
    SEA: { playsPerGame: 62.0, tier: 'Average' },
    NYG: { playsPerGame: 61.8, tier: 'Below Average' },
    WAS: { playsPerGame: 61.5, tier: 'Below Average' },
    NYJ: { playsPerGame: 61.2, tier: 'Below Average' },
    NO: { playsPerGame: 60.9, tier: 'Below Average' },
    ATL: { playsPerGame: 60.7, tier: 'Below Average' },
    TEN: { playsPerGame: 60.5, tier: 'Below Average' },
    CHI: { playsPerGame: 60.2, tier: 'Below Average' },
    PIT: { playsPerGame: 59.9, tier: 'Slow' },
    NE: { playsPerGame: 59.6, tier: 'Slow' },
    DEN: { playsPerGame: 59.3, tier: 'Slow' },
    LV: { playsPerGame: 59.0, tier: 'Slow' },
    LAC: { playsPerGame: 58.7, tier: 'Slow' },
    CAR: { playsPerGame: 58.4, tier: 'Slow' },
    SF: { playsPerGame: 58.0, tier: 'Slow' }
  };

  // Helper to estimate a player's targets and decide if they are an elite High-Volume Target Monster
  const getPlayerTargetStats = (player: DraftPlayer) => {
    const receptions = Math.max(0, player.projectedPointsPpr - player.projectedPointsStd);
    let catchRate = 0.68; // default
    if (player.position === 'TE') catchRate = 0.72;
    if (player.position === 'RB') catchRate = 0.78;
    const estTargets = Math.round(receptions / catchRate);
    
    let isTargetMonster = false;
    if (player.position === 'WR' && estTargets >= 115) isTargetMonster = true;
    if (player.position === 'TE' && estTargets >= 85) isTargetMonster = true;
    if (player.position === 'RB' && estTargets >= 55) isTargetMonster = true;
    
    return { receptions, estTargets, isTargetMonster };
  };

  // Helper to calculate custom points dynamically based on customizable rules
  const getPlayerProjectedPoints = (player: DraftPlayer) => {
    const receptions = Math.max(0, player.projectedPointsPpr - player.projectedPointsStd);
    const baseStd = player.projectedPointsStd;
    let basePoints = 0;
    
    if (player.position === 'QB') {
      const estPassingTDs = baseStd * 0.08;
      const estInterceptions = baseStd * 0.04;
      const passingTdDiff = ((scoringSettings.passingTd || 4.0) - 4.0) * estPassingTDs;
      const intDiff = ((scoringSettings.interception || -2.0) - (-2.0)) * estInterceptions;
      
      // Estimate 300+ passing yards games
      const estPassingYards = baseStd * 12.0;
      const estGames300 = Math.max(0, Math.floor((estPassingYards - 2500) / 300));
      const passingBonus = estGames300 * (scoringSettings.passingBonus300 || 0);
      
      basePoints = Math.max(0, baseStd + passingTdDiff + intDiff + passingBonus);
    } else {
      // For RB, WR, TE:
      // Receptions points (including TE Premium if applicable)
      const isTe = player.position === 'TE';
      const pprRate = (scoringSettings.ppr || 0) + (isTe ? (scoringSettings.tePremium || 0) : 0);
      
      // Estimate Touchdowns and Yards
      // Let's assume standard points ≈ yards*0.1 + TDs*6.
      // Average touchdown share of standard fantasy points is ~15% for WR/TE, ~20% for RB.
      const tdShare = player.position === 'RB' ? 0.20 : 0.15;
      const estTDs = (baseStd * tdShare) / 6.0;
      
      // Touchdown multiplier adjustments (rushingTd / receivingTd vs default 6.0)
      const tdWeight = player.position === 'RB' ? (scoringSettings.rushingTd || 6.0) : (scoringSettings.receivingTd || 6.0);
      const tdAdj = (tdWeight - 6.0) * estTDs;
      
      // Yards calculation
      const estYards = baseStd * (1 - tdShare) * 10.0;
      
      // Estimate 100+ yard games based on total yards
      const estGames100 = Math.max(0, Math.floor((estYards - 500) / 150));
      const yardBonusRate = player.position === 'RB' ? (scoringSettings.rushingBonus100 || 0) : (scoringSettings.receivingBonus100 || 0);
      const yardBonus = estGames100 * yardBonusRate;
      
      basePoints = Math.max(0, baseStd + (pprRate * receptions) + tdAdj + yardBonus);
    }

    if (enablePersonalEdge) {
      // 1. Team Pace Nudge (plays relative to 63.0 baseline)
      const plays = TEAM_PACE_STATS[player.team]?.playsPerGame || 63.0;
      const paceMultiplier = 1 + (plays - 63.0) * 0.005;

      // 2. Target Volume Nudge
      const { isTargetMonster } = getPlayerTargetStats(player);
      const targetMultiplier = isTargetMonster ? 1.04 : 1.0;

      return Math.max(0, basePoints * paceMultiplier * targetMultiplier);
    }

    return basePoints;
  };

  // Dynamically calculate replacement level points for VORP tracking
  const replacementPoints = React.useMemo(() => {
    const qbCount = settings.totalTeams;
    const rbCount = settings.totalTeams * 2;
    const wrCount = settings.totalTeams * 2;
    const teCount = settings.totalTeams;
    const kCount = settings.totalTeams;
    const dstCount = settings.totalTeams;

    const sortedPlayers = [...players].sort((a, b) => getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a));

    const findReplacementPoints = (pos: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST', rank: number) => {
      const posPlayers = sortedPlayers.filter(p => p.position === pos && !p.isDrafted);
      if (posPlayers.length === 0) return 0;
      const targetIndex = Math.min(rank - 1, posPlayers.length - 1);
      return getPlayerProjectedPoints(posPlayers[targetIndex]);
    };

    return {
      QB: findReplacementPoints('QB', qbCount),
      RB: findReplacementPoints('RB', rbCount),
      WR: findReplacementPoints('WR', wrCount),
      TE: findReplacementPoints('TE', teCount),
      K: findReplacementPoints('K', kCount),
      DST: findReplacementPoints('DST', dstCount),
    };
  }, [players, settings.totalTeams, scoringSettings]);

  // Helper to calculate VORP (Value Over Replacement Player) for any player
  const getPlayerVorp = (player: DraftPlayer) => {
    return getPlayerProjectedPoints(player) - replacementPoints[player.position];
  };

  // Helper to generate custom roster synergy stacks, handcuff alerts, and bye week congestion warnings
  const getRosterSynergies = () => {
    const userSquad = players.filter(p => p.isDrafted && p.draftedBy === 'user');
    const opponentSquad = players.filter(p => p.isDrafted && p.draftedBy === 'opponent');
    const undraftedRBs = players.filter(p => !p.isDrafted && p.position === 'RB');
    const synergies: { id: string; type: 'success' | 'warning' | 'info'; message: string }[] = [];

    userSquad.forEach(player => {
      if (player.position === 'RB') {
        const handcuffs = HANDCUFF_MAP[player.name];
        if (handcuffs) {
          handcuffs.forEach(hcName => {
            const draftedByMe = userSquad.find(p => p.name === hcName);
            const draftedByOpponent = opponentSquad.find(p => p.name === hcName);
            const availablePlayer = undraftedRBs.find(p => p.name === hcName);

            if (draftedByMe) {
              synergies.push({
                id: `hc-secured-${player.name}-${hcName}`,
                type: 'success',
                message: `🔒 Protected: Handcuff ${hcName} secured to back up ${player.name}!`
              });
            } else if (draftedByOpponent) {
              synergies.push({
                id: `hc-blocked-${player.name}-${hcName}`,
                type: 'warning',
                message: `⚠️ Blocked: Opponent drafted ${hcName}, the vital backup to your ${player.name}.`
              });
            } else if (availablePlayer) {
              synergies.push({
                id: `hc-avail-${player.name}-${hcName}`,
                type: 'info',
                message: `💡 Handcuff Available: Draft ${hcName} (ADP ${availablePlayer.adp}) to protect your investment in ${player.name}.`
              });
            }
          });
        }
      }
    });

    const userQBs = userSquad.filter(p => p.position === 'QB');
    const userReceivers = userSquad.filter(p => p.position === 'WR' || p.position === 'TE');
    userQBs.forEach(qb => {
      const stacked = userReceivers.filter(rec => rec.team === qb.team && qb.team !== 'FA');
      stacked.forEach(rec => {
        synergies.push({
          id: `stack-${qb.name}-${rec.name}`,
          type: 'success',
          message: `🔥 Synergy Stack: ${qb.name} + ${rec.name} (${qb.team})! High-scoring offensive multiplier.`
        });
      });
    });

    const byeWeeks = userSquad.map(p => p.byeWeek).filter(b => b && b > 0);
    const byeCounts: Record<number, number> = {};
    byeWeeks.forEach(w => {
      byeCounts[w] = (byeCounts[w] || 0) + 1;
    });
    Object.entries(byeCounts).forEach(([week, count]) => {
      if (count >= 3) {
        synergies.push({
          id: `bye-congestion-${week}`,
          type: 'warning',
          message: `⚠️ Bye Congestion: ${count} players share Bye Week ${week}. Plan replacement coverages.`
        });
      }
    });

    return synergies;
  };

  // Right-side Panel tab state
  const [activeRightTab, setActiveRightTab] = useState<'profile' | 'roster' | 'history'>('profile');
  const [showPlayerInfo, setShowPlayerInfo] = useState<boolean>(false);
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [rosterSubView, setRosterSubView] = useState<'positions' | 'lineup'>('positions');

  // AI Analysis API state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasServerConnection, setHasServerConnection] = useState<boolean>(true);

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasServerConnection(true);
      })
      .catch((err) => {
        console.warn('Backend server connection missing or loading:', err);
        setHasServerConnection(false);
      });
  }, []);

  const handleFetchPublicSleeperAdp = async (silent: boolean = false) => {
    setIsPublicSleeperAdpLoading(true);
    setSleeperError(null);
    try {
      // Sleeper's player database has a live "search_rank" for every active
      // player — their constantly-updated popularity/rank signal. We use it as
      // our always-fresh ADP source (no draft IDs needed).
      const POSITION_FETCHES: Record<string, string> = {
        QB: 'QB',
        RB: 'RB',
        WR: 'WR',
        TE: 'TE',
        K: 'K',
        DEF: 'DST',
      };

      const rankMap: Record<string, number> = {};

      await Promise.all(
        Object.entries(POSITION_FETCHES).map(async ([sleeperPos, appPos]) => {
          const res = await fetch(
            `https://api.sleeper.app/v1/players/nfl?position=${sleeperPos}&active=true`
          );
          if (!res.ok) {
            throw new Error(`Sleeper returned status ${res.status} for ${sleeperPos}.`);
          }
          const data = await res.json();
          Object.values(data).forEach((player: any) => {
            if (!player || typeof player !== 'object') return;
            const rank = player.search_rank;
            const name = player.full_name;
            if (typeof rank !== 'number' || rank <= 0 || rank > 5000) return;
            if (!name) return;
            const key = normalizeSleeperName(name);
            if (key) {
              // Keep the best (lowest) rank if a name appears more than once
              if (rankMap[key] === undefined || rank < rankMap[key]) {
                rankMap[key] = rank;
              }
            }
          });
        })
      );

      let updateCount = 0;
      let matched = 0;
      const matchedPlayers: string[] = [];
      setPlayers((currentPlayers) => {
        const updated = currentPlayers.map((p) => {
          const key = normalizeSleeperName(p.name);
          if (key && rankMap[key] !== undefined) {
            updateCount++;
            matched = rankMap[key];
            if (matchedPlayers.length < 6) {
              matchedPlayers.push(`${p.name} (#${matched})`);
            }
            return {
              ...p,
              adp: rankMap[key],
            };
          }
          return p;
        });
        return assignTiers(updated);
      });
      setLastSyncTime(new Date().toLocaleTimeString());

      // Set a small delay so the state update lands before we count
      setTimeout(() => {
        if (updateCount === 0) {
          setSleeperError('No player rankings were matched. Sleeper may be updating their database.');
        } else if (!silent) {
          alert(
            `Live ADP updated from Sleeper's current rankings! ${updateCount} players refreshed on your board.` +
            (matchedPlayers.length ? `\n\nSample: ${matchedPlayers.join(', ')}` : '')
          );
        }
      }, 50);
    } catch (err: any) {
      console.error(err);
      setSleeperError(err.message || 'Failed to fetch live Sleeper rankings.');
    } finally {
      setIsPublicSleeperAdpLoading(false);
    }
  };

  // Fetch live projected fantasy points from Sleeper's free public projections API
  // (same no-key source family as the ADP rankings — keeps board numbers fresh)
  const handleFetchSleeperProjections = async (silent: boolean = false) => {
    setIsSleeperProjectionsLoading(true);
    setSleeperProjectionsError(null);
    try {
      const season = new Date().getFullYear(); // projections live on api.sleeper.com, not the /v1 path
      const POSITION_FETCHES: Record<string, string> = {
        QB: 'QB',
        RB: 'RB',
        WR: 'WR',
        TE: 'TE',
        K: 'K',
        DEF: 'DST',
      };

      const projectionMap: Record<string, { ppr: number; std: number }> = {};

      await Promise.all(
        Object.entries(POSITION_FETCHES).map(async ([sleeperPos]) => {
          const res = await fetch(
            `https://api.sleeper.com/projections/nfl/${season}?season_type=regular&position=${sleeperPos}&order_by=pts_ppr`
          );
          if (!res.ok) {
            throw new Error(`Sleeper returned status ${res.status} for ${sleeperPos}.`);
          }
          const data = await res.json();
          if (!Array.isArray(data)) return;
          data.forEach((entry: any) => {
            const p = entry?.player;
            if (!p) return;
            const firstName = p.first_name || '';
            const lastName = p.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const stats = entry?.stats || {};
            const ppr = typeof stats.pts_ppr === 'number' ? stats.pts_ppr : NaN;
            const std = typeof stats.pts_std === 'number' ? stats.pts_std : NaN;
            if (!fullName || (isNaN(ppr) && isNaN(std))) return;
            const key = normalizeSleeperName(fullName);
            if (key && !projectionMap[key]) {
              projectionMap[key] = { ppr, std };
            }
          });
        })
      );

      let updateCount = 0;
      setPlayers((currentPlayers) => {
        return assignTiers(
          currentPlayers.map((p) => {
            const key = normalizeSleeperName(p.name);
            if (key && projectionMap[key]) {
              updateCount++;
              const proj = projectionMap[key];
              return {
                ...p,
                projectedPointsPpr: isNaN(proj.ppr) ? p.projectedPointsPpr : proj.ppr,
                projectedPointsStd: isNaN(proj.std) ? p.projectedPointsStd : proj.std,
              };
            }
            return p;
          })
        );
      });
      setLastSyncTime(new Date().toLocaleTimeString());

      // Small delay so the state update lands before we count
      setTimeout(() => {
        if (updateCount === 0) {
          setSleeperProjectionsError('No player projections were matched. Sleeper may be updating their database.');
        } else if (!silent) {
          alert(
            `Live projections updated from Sleeper! ${updateCount} players refreshed on your board.`
          );
        }
      }, 50);
    } catch (err: any) {
      console.error(err);
      setSleeperProjectionsError(err.message || 'Failed to fetch live Sleeper projections.');
    } finally {
      setIsSleeperProjectionsLoading(false);
    }
  };

  // Save the user's own Gemini API key to this device (never sent to any server)
  const handleSaveAiKey = () => {
    const trimmed = aiKeyInput.trim();
    try {
      if (trimmed) {
        localStorage.setItem('td_gemini_api_key', trimmed);
        setGeminiApiKey(trimmed);
      } else {
        localStorage.removeItem('td_gemini_api_key');
        setGeminiApiKey('');
      }
    } catch (err) {
      console.error('Failed to save AI key locally:', err);
    }
    setAiKeyInput('');
  };

  // Auto-refresh ADP from Sleeper's live rankings on app open (runs once)
  const hasAutoRefreshedAdp = useRef(false);
  useEffect(() => {
    if (hasAutoRefreshedAdp.current) return;
    hasAutoRefreshedAdp.current = true;
    handleFetchPublicSleeperAdp(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the home dropdown when clicking anywhere else
  const homeMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showHomeMenu) return;
    const onDocClick = (e: MouseEvent) => {
      if (homeMenuRef.current && !homeMenuRef.current.contains(e.target as Node)) {
        setShowHomeMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showHomeMenu]);

  // Timer Ticking Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && isTimerEnabled) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isTimerEnabled]);

  // Audio alarm when the user's turn is approaching or begins.
  // A ~60s warning sounds when the pick right before the user's turn starts,
  // and a chime sounds the moment it becomes the user's turn.
  useEffect(() => {
    const prev = prevPickRef.current;
    if (currentPick !== prev && currentPick > prev) {
      const isUserNow = isUserPick(currentPick, settings.userPickNumber, settings.totalTeams);
      const wasUser = isUserPick(prev, settings.userPickNumber, settings.totalTeams);
      const isOnDeck = !isUserNow && isUserPick(currentPick + 1, settings.userPickNumber, settings.totalTeams);
      if (isUserNow && !wasUser) {
        playAlarmChime([659.25, 880, 1046.5], 0.35);
      } else if (isOnDeck) {
        playAlarmChime([523.25, 659.25], 0.25);
      }
    }
    prevPickRef.current = currentPick;
  }, [currentPick, settings.userPickNumber, settings.totalTeams]);

  // Recalculate BPA (Best Player Available) badges whenever players list or scoring system changes
  useEffect(() => {
    setPlayers((prevPlayers) => {
      // Find the top 2 undrafted players based on projected points for the active scoring system
      const updated = prevPlayers.map(p => ({ ...p, isBpa: false }));
      
      const undraftedSorted = [...updated]
        .filter(p => !p.isDrafted)
        .sort((a, b) => getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a));
      
      if (undraftedSorted.length > 0) {
        const firstBpa = updated.find(p => p.id === undraftedSorted[0].id);
        if (firstBpa) firstBpa.isBpa = true;
      }
      if (undraftedSorted.length > 1) {
        const secondBpa = updated.find(p => p.id === undraftedSorted[1].id);
        if (secondBpa) secondBpa.isBpa = true;
      }
      return updated;
    });
  }, [scoringSettings, totalDraftedCount]);

  // Handle Draft action
  const handleDraftPlayer = (playerId: string, draftedBy: 'user' | 'opponent') => {
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;

    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            isDrafted: true,
            draftedBy,
            draftPickNumber: currentPick,
          };
        }
        return p;
      });
    });

    // Add to History log
    setDraftHistory((prev) => [
      ...prev,
      {
        pickNumber: currentPick,
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        position: targetPlayer.position,
        team: targetPlayer.team,
        draftedBy,
      },
    ]);

    // Advance Pick Counters
    const nextPick = currentPick + 1;
    setCurrentPick(nextPick);
    setTotalDraftedCount((prev) => prev + 1);
    
    // Auto calculate round based on totalTeams
    const newRound = Math.floor((nextPick - 1) / settings.totalTeams) + 1;
    setCurrentRound(newRound);

    // Reset draft clock to standard
    setTimerSeconds(settings.timeLimitSeconds);
    
    // Auto focus the drafted player or move selected player to the next best available player
    const nextAvailable = players
      .filter((p) => p.id !== playerId && !p.isDrafted)
      .sort((a, b) => getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a))[0];
    
    if (nextAvailable) {
      setSelectedPlayerId(nextAvailable.id);
    }
  };

  // Undo the absolute most recent pick
  const handleUndoLastPick = () => {
    if (draftHistory.length === 0) return;
    const lastItem = draftHistory[draftHistory.length - 1];

    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        if (p.id === lastItem.playerId) {
          return {
            ...p,
            isDrafted: false,
            draftedBy: null,
            draftPickNumber: undefined,
          };
        }
        return p;
      });
    });

    setDraftHistory((prev) => prev.slice(0, -1));
    setTotalDraftedCount((prev) => Math.max(0, prev - 1));
    
    // Set current pick and round back
    setCurrentPick(lastItem.pickNumber);
    const newRound = Math.floor((lastItem.pickNumber - 1) / settings.totalTeams) + 1;
    setCurrentRound(newRound);
    
    // Reset timer
    setTimerSeconds(settings.timeLimitSeconds);
  };

  // Handle Undraft / Reset draft state of a single player
  const handleUndraftPlayer = (playerId: string) => {
    setPlayers((prevPlayers) => {
      return prevPlayers.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            isDrafted: false,
            draftedBy: null,
            draftPickNumber: undefined,
          };
        }
        return p;
      });
    });

    // Remove from history
    setTotalDraftedCount((prev) => Math.max(0, prev - 1));
    
    // Check if the removed player was the last pick, if so adjust the pick counter back
    setDraftHistory((prevHistory) => {
      const isLastPick = prevHistory.length > 0 && prevHistory[prevHistory.length - 1].playerId === playerId;
      if (isLastPick) {
        const lastItem = prevHistory[prevHistory.length - 1];
        setCurrentPick(lastItem.pickNumber);
        const newRound = Math.floor((lastItem.pickNumber - 1) / settings.totalTeams) + 1;
        setCurrentRound(newRound);
      }
      return prevHistory.filter((h) => h.playerId !== playerId);
    });
  };

  // Reset the entire Draft Board
  const handleResetDraft = () => {
    if (window.confirm('Reset all drafted players, rosters, and clocks back to Round 1?')) {
      setPlayers((prev) => {
        return prev.map((p) => ({
          ...p,
          isDrafted: false,
          draftedBy: null,
          draftPickNumber: undefined,
        }));
      });
      setDraftHistory([]);
      setCurrentRound(1);
      setCurrentPick(1);
      setTotalDraftedCount(0);
      setTimerSeconds(settings.timeLimitSeconds);
      setIsTimerRunning(false);
    }
  };

  // ---- Draft Setups: save / load named predraft configurations ----

  // Persist the setups list to this device
  const persistSetups = (setups: DraftSetup[]) => {
    setSavedSetups(setups);
    try { localStorage.setItem('td_draft_setups', JSON.stringify(setups)); } catch { /* ignore */ }
  };

  // Save the CURRENT configuration (settings + scoring + team names) under a name
  const handleSaveSetup = () => {
    const name = setupNameInput.trim();
    if (!name) return;
    const setup: DraftSetup = {
      id: `setup_${Date.now()}`,
      name,
      createdAt: Date.now(),
      settings: {
        scoring: settings.scoring,
        userPickNumber: settings.userPickNumber,
        totalTeams: settings.totalTeams,
        timeLimitSeconds: settings.timeLimitSeconds,
        teamNames: settings.teamNames || {},
      },
      scoring: { ...scoringSettings },
    };
    persistSetups([...savedSetups, setup]);
    setSetupNameInput('');
    setShowSaveSetupModal(false);
  };

  // Clear the draft board back to a clean, ready-to-draft state (no picks)
  const clearDraftBoard = () => {
    setPlayers((prev) => {
      return prev.map((p) => ({
        ...p,
        isDrafted: false,
        draftedBy: null,
        draftPickNumber: undefined,
      }));
    });
    setDraftHistory([]);
    setCurrentRound(1);
    setCurrentPick(1);
    setTotalDraftedCount(0);
    setTimerSeconds(60);
    setIsTimerRunning(false);
    setIsMockDraftActive(false);
  };

  // Apply a saved setup: replace settings + scoring, clear board (ask first)
  const confirmLoadSetup = () => {
    if (!setupToConfirmLoad) return;
    const s = setupToConfirmLoad;
    setSettings({
      scoring: s.settings.scoring,
      userPickNumber: s.settings.userPickNumber,
      totalTeams: s.settings.totalTeams,
      timeLimitSeconds: s.settings.timeLimitSeconds,
      teamNames: s.settings.teamNames || {},
    });
    setScoringSettings({
      ppr: s.scoring.ppr,
      passingTd: s.scoring.passingTd,
      interception: s.scoring.interception,
      tePremium: s.scoring.tePremium,
      passingBonus300: s.scoring.passingBonus300,
      rushingBonus100: s.scoring.rushingBonus100,
      receivingBonus100: s.scoring.receivingBonus100,
      rushingTd: s.scoring.rushingTd,
      receivingTd: s.scoring.receivingTd,
    });
    clearDraftBoard();
    setSetupToConfirmLoad(null);
    setShowSetupListModal(false);
    setActiveTopTab('board');
  };

  const handleDeleteSetup = (id: string) => {
    if (window.confirm('Delete this saved draft setup?')) {
      persistSetups(savedSetups.filter((s) => s.id !== id));
    }
  };

  // Start a mock draft using either standard settings or a saved setup
  const startMockWithSetup = (setup: DraftSetup | null) => {
    const slot = setup ? setup.settings.userPickNumber : settings.userPickNumber;
    const teams = setup ? setup.settings.totalTeams : settings.totalTeams;
    if (setup) {
      setSettings({
        scoring: setup.settings.scoring,
        userPickNumber: slot,
        totalTeams: teams,
        timeLimitSeconds: setup.settings.timeLimitSeconds,
        teamNames: setup.settings.teamNames || {},
      });
      setScoringSettings({ ...setup.scoring });
    }
    clearDraftBoard();
    setTimeout(() => {
      handleStartMockDraft(slot, teams);
    }, 50);
  };

  // Simulate CPU draft picks up to the user's turn
  const simulateCpuPicksUpToUser = (startPick: number, slot: number, totalTeams: number) => {
    setPlayers((currentPlayers) => {
      let tempPlayers = [...currentPlayers];
      let historyAddition: DraftHistoryItem[] = [];
      let pickNo = startPick;

      // Which team slot is on the clock for a given pick number (snake order)
      const getSlotForPick = (pickNo: number) => {
        const round = Math.floor((pickNo - 1) / totalTeams) + 1;
        const pickInRound = ((pickNo - 1) % totalTeams) + 1;
        return round % 2 === 1 ? pickInRound : totalTeams - pickInRound + 1;
      };

      // Standard starting lineup every team is trying to fill
      const lineupTargets: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 };

      while (!isUserPick(pickNo, slot, totalTeams) && pickNo <= totalTeams * 15) {
        const round = Math.floor((pickNo - 1) / totalTeams) + 1;
        const pickingSlot = getSlotForPick(pickNo);

        // Build this CPU team's roster so far (players already taken by this slot)
        const cpuPosCount: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
        tempPlayers.forEach(p => {
          if (p.isDrafted && p.draftedBy === 'opponent' && p.draftPickNumber && getSlotForPick(p.draftPickNumber) === pickingSlot) {
            cpuPosCount[p.position] = (cpuPosCount[p.position] || 0) + 1;
          }
        });

        // How many starters this team still needs at each position.
        // Kickers/DSTs only become a "need" from round 11 on — nobody grabs a kicker early.
        const posNeed = (pos: string) => {
          if ((pos === 'K' || pos === 'DST') && round < 11) return 0;
          return Math.max(0, (lineupTargets[pos] || 0) - (cpuPosCount[pos] || 0));
        };

        // Scarcity: how many startable (above-replacement) players remain per position
        const undrafted = tempPlayers.filter(p => !p.isDrafted);
        if (undrafted.length === 0) break;
        const startableRemaining: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
        undrafted.forEach(p => {
          if (getPlayerProjectedPoints(p) >= replacementPoints[p.position]) {
            startableRemaining[p.position] = (startableRemaining[p.position] || 0) + 1;
          }
        });

        // Score every available player for THIS team: VORP + need + scarcity + steals + human jitter
        const scored = undrafted.map(p => {
          const vorp = getPlayerVorp(p);
          const need = posNeed(p.position);
          const startable = startableRemaining[p.position] || 0;
          const adp = p.manualAdpOverride ?? p.adp ?? 999;

          const needBonus = need > 0 ? Math.min(need, 2) * 5 : 0;
          const scarcityBonus = (startable <= 3 ? 8 : startable <= 6 ? 4 : 0) + (p.position === 'RB' || p.position === 'TE' ? 2 : 0);
          const stealPicks = Math.max(0, pickNo - adp);
          const adpValue = Math.min(stealPicks * 0.3, 8);
          const jitter = Math.random() * 6; // humans don't draft perfectly

          const score = vorp + needBonus + scarcityBonus + adpValue + jitter;
          return { player: p, score };
        });

        scored.sort((a, b) => b.score - a.score);

        // Pick the top pick most of the time, but sometimes deviate within the top 3
        const top = scored.slice(0, 3);
        const chosen = Math.random() < 0.65 ? top[0] : top[Math.floor(Math.random() * top.length)];
        const chosenPlayer = chosen.player;

        const chosenIdx = tempPlayers.findIndex(p => p.id === chosenPlayer.id);
        if (chosenIdx !== -1) {
          tempPlayers[chosenIdx] = {
            ...tempPlayers[chosenIdx],
            isDrafted: true,
            draftedBy: 'opponent',
            draftPickNumber: pickNo,
          };

          historyAddition.push({
            pickNumber: pickNo,
            playerId: chosenPlayer.id,
            playerName: chosenPlayer.name,
            position: chosenPlayer.position,
            team: chosenPlayer.team,
            draftedBy: 'opponent',
          });
        }

        pickNo++;
      }

      if (historyAddition.length > 0) {
        setTimeout(() => {
          setDraftHistory(prev => [...prev, ...historyAddition]);
          setCurrentPick(pickNo);
          const newRound = Math.floor((pickNo - 1) / totalTeams) + 1;
          setCurrentRound(newRound);
          setTotalDraftedCount(prev => prev + historyAddition.length);

          const nextAvail = tempPlayers
            .filter(p => !p.isDrafted)
            .sort((a, b) => getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a))[0];
          if (nextAvail) {
            setSelectedPlayerId(nextAvail.id);
          }
        }, 0);
      }

      return tempPlayers;
    });
  };

  // Start or restart a Mock Draft Simulation
  const handleStartMockDraft = (slot: number = 5, totalTeams: number = 12) => {
    setPlayers((prev) => {
      return prev.map((p) => ({
        ...p,
        isDrafted: false,
        draftedBy: null,
        draftPickNumber: undefined,
      }));
    });
    setDraftHistory([]);
    setCurrentRound(1);
    setCurrentPick(1);
    setTotalDraftedCount(0);
    setTimerSeconds(settings.timeLimitSeconds);
    setIsTimerRunning(false);
    setIsMockDraftActive(true);

    setSettings(prev => ({
      ...prev,
      userPickNumber: slot,
      totalTeams: totalTeams,
    }));

    setTimeout(() => {
      simulateCpuPicksUpToUser(1, slot, totalTeams);
    }, 50);
  };

  // Effect to automatically run CPU picks in Mock Draft mode when currentPick is modified
  useEffect(() => {
    if (isMockDraftActive && !isUserPick(currentPick, settings.userPickNumber, settings.totalTeams)) {
      const timer = setTimeout(() => {
        simulateCpuPicksUpToUser(currentPick, settings.userPickNumber, settings.totalTeams);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentPick, isMockDraftActive, settings.userPickNumber, settings.totalTeams]);

  // AI Scarcity & Position Run Warning Engine
  const getPositionRunWarnings = () => {
    const warnings: { id: string; type: 'run' | 'scarcity'; message: string; severity: 'high' | 'medium' }[] = [];
    
    // 1. Run detection (look at last 10 picks in history)
    const lastPicks = draftHistory.slice(-10);
    const posCounts: Record<string, number> = {};
    lastPicks.forEach((pick) => {
      posCounts[pick.position] = (posCounts[pick.position] || 0) + 1;
    });

    (['QB', 'RB', 'WR', 'TE'] as const).forEach((pos) => {
      const count = posCounts[pos] || 0;
      // If 4 or more of the last 10 picks are the same position, that is a run!
      if (count >= 4) {
        // Check if user has this position drafted yet
        const userHasPos = players.some(p => p.position === pos && p.isDrafted && p.draftedBy === 'user');
        warnings.push({
          id: `run-${pos}`,
          type: 'run',
          message: `🔥 ${pos} RUN ACTIVE! ${count} of the last 10 picks were ${pos}s. Tier supplies are dropping fast.`,
          severity: userHasPos ? 'medium' : 'high'
        });
      }
    });

    // 2. Scarcity warnings (check remaining Tier 1-3 players for positions)
    const userQBs = players.filter(p => p.position === 'QB' && p.isDrafted && p.draftedBy === 'user').length;
    const userRBs = players.filter(p => p.position === 'RB' && p.isDrafted && p.draftedBy === 'user').length;
    const userWRs = players.filter(p => p.position === 'WR' && p.isDrafted && p.draftedBy === 'user').length;
    const userTEs = players.filter(p => p.position === 'TE' && p.isDrafted && p.draftedBy === 'user').length;

    // Remaining elite/starter tier (Tier 1-3) players
    const remainingElite = (pos: 'QB' | 'RB' | 'WR' | 'TE') => 
      players.filter(p => p.position === pos && !p.isDrafted && p.tier && p.tier <= 3);

    // Quarterback Scarcity
    if (userQBs === 0) {
      const qbEliteLeft = remainingElite('QB');
      if (qbEliteLeft.length <= 2 && qbEliteLeft.length > 0) {
        warnings.push({
          id: 'scarcity-QB',
          type: 'scarcity',
          message: `⚠️ ELITE QB SCARCITY! Only ${qbEliteLeft.length} Tier 1-3 QBs remain: ${qbEliteLeft.map(p => p.name).join(', ')}. Consider securing one.`,
          severity: qbEliteLeft.length === 1 ? 'high' : 'medium'
        });
      }
    }

    // Tight End Scarcity
    if (userTEs === 0) {
      const teEliteLeft = remainingElite('TE');
      if (teEliteLeft.length <= 2 && teEliteLeft.length > 0) {
        warnings.push({
          id: 'scarcity-TE',
          type: 'scarcity',
          message: `⚠️ ELITE TE SCARCITY! Only ${teEliteLeft.length} Tier 1-3 TEs remain: ${teEliteLeft.map(p => p.name).join(', ')}.`,
          severity: teEliteLeft.length === 1 ? 'high' : 'medium'
        });
      }
    }

    // Running Back Scarcity
    if (userRBs < 2) {
      const rbEliteLeft = remainingElite('RB');
      if (rbEliteLeft.length <= 4 && rbEliteLeft.length > 0) {
        warnings.push({
          id: 'scarcity-RB',
          type: 'scarcity',
          message: `⚠️ RB DEPLETION! RB Tier 1-3 supply is down to ${rbEliteLeft.length} (${rbEliteLeft.map(p => p.name).slice(0, 3).join(', ')}...). You only have ${userRBs} RBs.`,
          severity: rbEliteLeft.length <= 2 ? 'high' : 'medium'
        });
      }
    }

    // Wide Receiver Scarcity
    if (userWRs < 2) {
      const wrEliteLeft = remainingElite('WR');
      if (wrEliteLeft.length <= 5 && wrEliteLeft.length > 0) {
        warnings.push({
          id: 'scarcity-WR',
          type: 'scarcity',
          message: `⚠️ WR DRIFT! WR Tier 1-3 supply is down to ${wrEliteLeft.length} (${wrEliteLeft.map(p => p.name).slice(0, 3).join(', ')}...). You only have ${userWRs} WRs.`,
          severity: wrEliteLeft.length <= 2 ? 'high' : 'medium'
        });
      }
    }

    return warnings;
  };

  // Helper to map user drafted players to standard fantasy lineup starting positions
  const getLineupVisual = () => {
    const userSquad = players.filter(p => p.isDrafted && p.draftedBy === 'user');
    
    // Extract by position, sorted by ADP to place best players in starting slots
    let qbs = userSquad.filter(p => p.position === 'QB').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    let rbs = userSquad.filter(p => p.position === 'RB').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    let wrs = userSquad.filter(p => p.position === 'WR').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    let tes = userSquad.filter(p => p.position === 'TE').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    let ks = userSquad.filter(p => p.position === 'K').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    let dsts = userSquad.filter(p => p.position === 'DST').sort((a,b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));

    const lineup: { slot: string; player: DraftPlayer | null }[] = [
      { slot: 'QB', player: qbs.shift() || null },
      { slot: 'RB1', player: rbs.shift() || null },
      { slot: 'RB2', player: rbs.shift() || null },
      { slot: 'WR1', player: wrs.shift() || null },
      { slot: 'WR2', player: wrs.shift() || null },
      { slot: 'TE', player: tes.shift() || null },
    ];

    // FLEX: next best available of remaining RBs, WRs, or TEs
    const flexCandidates = [...rbs, ...wrs, ...tes].sort((a, b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
    const flexPlayer = flexCandidates.shift() || null;
    lineup.push({ slot: 'FLEX', player: flexPlayer });

    // Remove chosen flex player from its respective remaining list
    if (flexPlayer) {
      if (flexPlayer.position === 'RB') rbs = rbs.filter(p => p.id !== flexPlayer.id);
      if (flexPlayer.position === 'WR') wrs = wrs.filter(p => p.id !== flexPlayer.id);
      if (flexPlayer.position === 'TE') tes = tes.filter(p => p.id !== flexPlayer.id);
    }

    lineup.push(
      { slot: 'K', player: ks.shift() || null },
      { slot: 'DST', player: dsts.shift() || null },
    );

    // Bench consists of everything else
    const benchPlayers = [...qbs, ...rbs, ...wrs, ...tes, ...ks, ...dsts, ...flexCandidates];

    return { lineup, bench: benchPlayers };
  };

  // Helper to detect bye week overlaps/conflicts among starting players
  const getByeWeekConflicts = (lineup: { slot: string; player: DraftPlayer | null }[]) => {
    const activeStarters = lineup.filter(l => l.player !== null) as { slot: string; player: DraftPlayer }[];
    
    // Group active starters by bye week
    const byeGroups: Record<number, { slot: string; playerName: string; position: string }[]> = {};
    activeStarters.forEach((item) => {
      const bye = item.player.byeWeek;
      if (bye && bye > 0) {
        if (!byeGroups[bye]) {
          byeGroups[bye] = [];
        }
        byeGroups[bye].push({
          slot: item.slot,
          playerName: item.player.name,
          position: item.player.position,
        });
      }
    });

    const conflicts: string[] = [];
    Object.entries(byeGroups).forEach(([byeNum, items]) => {
      if (items.length >= 2) {
        conflicts.push(`Bye Week ${byeNum} Overlap: ${items.map(i => `${i.playerName} (${i.slot})`).join(', ')} are sharing their bye week.`);
      }
    });

    return conflicts;
  };

  const handleUpdatePlayerOverride = (playerId: string, overrides: Partial<DraftPlayer>) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...overrides } : p));
  };

  // Run AI analysis with Gemini — uses the user's own API key (saved on this device)
  const handleRunAiAnalysis = async (player: DraftPlayer) => {
    if (!geminiApiKey) {
      setAiError('No AI key set yet. Open the Settings tab, paste your own free Gemini API key in the "AI Key" box, save it, then try again.');
      return;
    }
    setIsAiLoading(true);
    setAiError(null);

    try {
      const systemInstruction = `You are an elite, highly clinical sports data analyst specializing in NFL predictive modeling and fantasy football forecasting.
Your job is to act as an "Anti-Hype Filter" that strips away all media narrative, coach speak, training camp puff pieces, and emotional fan bias.

Apply these strict analytical principles:
1. QUANTIFY OVER QUALIFY: Prioritize high-value sticky metrics (such as target share, expected fantasy points, slot snaps, target rate per route run, yards per route run, and offensive line pass-blocking/run-blocking rankings) over adjectives like "primed for a breakout," "looking unstoppable," or "in the best shape of his life."
2. REGRESSION DETECTION: Explicitly flag statistics from the previous year that are mathematically unsustainable (such as an unusually high touchdown rate per touch/reception, extreme efficiency on low volume, or unsustainable yards per carry).
3. SYSTEM OVER HYPE: Heavily weight the historical tendencies of the offensive coordinator/play-caller (e.g., neutral-script pass rate, pace of play, personnel groupings like 11/12 personnel) rather than subjective player talent hype.
4. VARIANCE ASSESSMENT: Identify whether the player's true range of outcomes leans toward high-floor safety or high-ceiling volatility.

Return a highly rigorous, clinical analysis in structured JSON matching the requested schema. Ensure the response format adheres exactly to the schema. Make the numbers like floorValue and ceilingValue realistic for a fantasy league (PPR or half-PPR PPG, typically ranging between 2 and 24).`;

      const userPrompt = `Analyze the following NFL Player Profile:
Player Name: ${player.name}
Team: ${player.team}
Position: ${player.position}

--- Raw Player Metrics & Historical Statistics ---
${player.rawMetrics || 'No raw statistical metrics provided.'}

--- Coaching & System Changes ---
${player.coachingChanges || 'No coaching changes or system details provided.'}

--- Recent News & Training Camp Narratives ---
${player.recentNews || 'No news or narrative statements provided.'}
`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          playerName: { type: 'STRING' },
          team: { type: 'STRING' },
          position: { type: 'STRING' },
          objectiveMetrics: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: "2-3 bullet points of hard, predictive data. Prioritize high-value sticky metrics (target share, TPRR, expected fantasy points, slot snaps, O-line rankings) over adjectives."
          },
          narrativeTrashBin: {
            type: 'STRING',
            description: "Exactly 1 sentence explicitly calling out the specific media hype, training camp puff piece, or coach-speak quote that analysts must ignore."
          },
          trueRangeOfOutcomes: {
            type: 'OBJECT',
            properties: {
              floorDescription: { type: 'STRING', description: "Realistic clinical floor scenario based on historical low percentiles, system risks, or draft capital constraints." },
              ceilingDescription: { type: 'STRING', description: "Realistic ceiling scenario if volume and efficiency are optimized under current system constraints." },
              floorValue: { type: 'NUMBER', description: "Ranged score representing the player's fantasy PPG or value floor, on a scale of 0 to 25." },
              ceilingValue: { type: 'NUMBER', description: "Ranged score representing the player's fantasy PPG or value ceiling, on a scale of 0 to 25." },
              metricType: { type: 'STRING', description: "Must be 'PPG' or 'Score'." }
            },
            required: ['floorDescription', 'ceilingDescription', 'floorValue', 'ceilingValue', 'metricType']
          },
          regressionFlags: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                metric: { type: 'STRING', description: "The specific metric that is highly unsustainable (e.g. 'Rushing Touchdown Rate of 16%')" },
                description: { type: 'STRING', description: "The statistical reason why it is likely to regress toward the historical mean." },
                severity: { type: 'STRING', description: "Severity of regression risk. Must be 'high', 'medium', or 'low'." }
              },
              required: ['metric', 'description', 'severity']
            }
          },
          systemAnalysis: {
            type: 'OBJECT',
            properties: {
              playCaller: { type: 'STRING' },
              tendency: { type: 'STRING', description: "Historical metrics of play-caller (e.g. neutral script pass rate, pace of play, personnel preferences)." },
              impactScore: { type: 'NUMBER', description: "Rating of the system's effect on this position on a scale of 1-100." }
            },
            required: ['playCaller', 'tendency', 'impactScore']
          },
          varianceAssessment: {
            type: 'STRING',
            description: "1-2 sentence clinical summary identifying whether the profile is high-floor safety or high-ceiling variance, and why."
          },
          clinicalScore: {
            type: 'NUMBER',
            description: "A total analytical rating of the player's stability as an asset on a scale of 1 to 10 (1 = pure volatile hype, 10 = elite blue-chip metrics-backed safety)."
          }
        },
        required: [
          'playerName', 'team', 'position', 'objectiveMetrics', 'narrativeTrashBin',
          'trueRangeOfOutcomes', 'regressionFlags', 'systemAnalysis', 'varianceAssessment', 'clinicalScore'
        ]
      };

      // Call Google's Gemini API directly from the browser using the user's own key.
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        let detail = '';
        try { const e = await geminiResponse.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `Gemini returned status ${geminiResponse.status}.`);
      }

      const geminiData = await geminiResponse.json();
      const resultText = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      if (!resultText) {
        throw new Error('Gemini returned an empty response.');
      }

      const analyzedResult = JSON.parse(resultText);

      // Update players state to cache this analysis
      setPlayers((prev) => {
        return prev.map((p) => {
          if (p.id === player.id) {
            return {
              ...p,
              preCachedAnalysis: analyzedResult,
            };
          }
          return p;
        });
      });
    } catch (err: any) {
      console.error('AI analytical error:', err);
      setAiError(err.message || 'The analysis failed to parse these metrics.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Create custom player
  const handleCreateCustomPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlayerForm.name || !customPlayerForm.team) return;

    const newPlayer: DraftPlayer = {
      id: Date.now().toString(),
      name: customPlayerForm.name,
      team: customPlayerForm.team,
      position: customPlayerForm.position as any,
      byeWeek: Number(customPlayerForm.byeWeek) || 9,
      adp: Number(customPlayerForm.adp) || 120,
      projectedPointsStd: Number(customPlayerForm.projectedPointsStd) || 100,
      projectedPointsPpr: Number(customPlayerForm.projectedPointsPpr) || 130,
      isDrafted: false,
      rawMetrics: customPlayerForm.rawMetrics || 'No raw metric profiles compiled.',
      coachingChanges: customPlayerForm.coachingChanges || 'No tactical coaching adjustments specified.',
      recentNews: customPlayerForm.recentNews || 'No off-season news captured.',
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setSelectedPlayerId(newPlayer.id);
    setShowAddCustomModal(false);
    
    // Reset form
    setCustomPlayerForm({
      name: '',
      team: '',
      position: 'RB',
      byeWeek: 9,
      adp: 120,
      projectedPointsStd: 100,
      projectedPointsPpr: 130,
      rawMetrics: '',
      coachingChanges: '',
      recentNews: '',
    });
  };

  // Format Draft Clock Time Helper
  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find currently selected player details
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  // Filter & Sort Players for Draft Board view
  const getFilteredPlayers = () => {
    let result = [...players];

    // Filter by position
    if (activePositionFilter !== 'ALL') {
      result = result.filter(p => p.position === activePositionFilter);
    }

    // Filter by tier
    if (activeTierFilter !== 'ALL') {
      result = result.filter(p => p.tier === activeTierFilter);
    }

    // Filter by draft state
    if (!showDrafted) {
      result = result.filter(p => !p.isDrafted);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query)
      );
    }

    // Sort by ADP or projected points for active scoring setting
    result.sort((a, b) => {
      // Drafted players should drift to the bottom if we show them
      if (a.isDrafted && !b.isDrafted) return 1;
      if (!a.isDrafted && b.isDrafted) return -1;
      
      if (sortBy === 'ADP') {
        const adpA = a.manualAdpOverride ?? a.adp ?? 999;
        const adpB = b.manualAdpOverride ?? b.adp ?? 999;
        if (adpA !== adpB) {
          return adpA - adpB;
        }
        return getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a);
      } else {
        return getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a);
      }
    });

    return result;
  };

  const filteredPlayersList = getFilteredPlayers();
  const isUserTurn = isUserPick(currentPick, settings.userPickNumber, settings.totalTeams);
  // Auto-show the coach panel when the user is "on deck" (one pick before their turn)
  const isOnDeck = !isUserTurn && isUserPick(currentPick + 1, settings.userPickNumber, settings.totalTeams);
  const coachPanelVisible = isUserTurn || isOnDeck || showCoachPanel;

  // Stats Counters
  const userDraftedCount = players.filter(p => p.isDrafted && p.draftedBy === 'user').length;

  // Draft is complete once we've passed the last pick of the final round (15 rounds).
  const isDraftComplete = currentPick > settings.totalTeams * 15;

  // Auto-show the recap modal the moment the draft finishes (unless dismissed this session).
  useEffect(() => {
    if (isDraftComplete && !recapDismissed && !showDraftRecap) {
      const t = setTimeout(() => setShowDraftRecap(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isDraftComplete, recapDismissed, showDraftRecap]);

  // Build the recap: user's starters, best-value picks, reaches, and roster grade.
  const draftRecap = React.useMemo(() => {
    const userSquad = players.filter(p => p.isDrafted && p.draftedBy === 'user');
    if (userSquad.length === 0) return null;

    const { lineup, bench } = getLineupVisual();
    const starters = lineup.filter(s => s.player !== null) as { slot: string; player: DraftPlayer }[];

    // Best value: drafted many picks after their ADP. Reaches: drafted way before their ADP.
    const withValue = userSquad.map(p => {
      const adp = p.manualAdpOverride ?? p.adp ?? 999;
      return { player: p, diff: p.draftPickNumber ? p.draftPickNumber - adp : 0 };
    });

    const bestValue = [...withValue].sort((a, b) => b.diff - a.diff).slice(0, 3);
    const reaches = [...withValue].sort((a, b) => a.diff - b.diff).slice(0, 3);

    // Projected season total for the starting lineup.
    const projectedTotal = starters.reduce((sum, s) => sum + getPlayerProjectedPoints(s.player), 0);

    // Roster grade: compare against the theoretical "best possible" startable squad
    // (top available at each slot) to give a rough 0-100 grade.
    const starterSum = projectedTotal;
    const bestAvail = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST'].reduce((sum, slotPos) => {
      const candidates = players
        .filter(p => p.position === slotPos || (slotPos === 'FLEX' && ['RB', 'WR', 'TE'].includes(p.position)))
        .sort((a, b) => getPlayerProjectedPoints(b) - getPlayerProjectedPoints(a));
      if (candidates.length > 0) return sum + getPlayerProjectedPoints(candidates[0]);
      return sum;
    }, 0);

    const grade = bestAvail > 0 ? Math.max(0, Math.min(100, Math.round((starterSum / bestAvail) * 100))) : 0;

    return { userSquad, starters, bench, bestValue, reaches, projectedTotal, grade };
  }, [players, scoringSettings, settings]);

  // PICK-TIME COACH: top 3 recommendations for the user's next pick.
  // Works entirely from the app's own numbers (VORP, scarcity, roster need, ADP value) — no AI key required.
  const coachRecommendations = React.useMemo(() => {
    const userSquad = players.filter(p => p.isDrafted && p.draftedBy === 'user');
    const undrafted = players.filter(p => !p.isDrafted);
    if (undrafted.length === 0) return [];

    // Count how many startable (above-replacement) players remain per position.
    const startableRemaining: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
    undrafted.forEach((p) => {
      if (getPlayerProjectedPoints(p) >= replacementPoints[p.position]) {
        startableRemaining[p.position] = (startableRemaining[p.position] || 0) + 1;
      }
    });

    // Standard starting lineup the user still needs to fill.
    const lineupTargets: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 };
    const userPosCount: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
    userSquad.forEach((p) => { userPosCount[p.position] = (userPosCount[p.position] || 0) + 1; });

    // Only surface kickers/DSTs as top-3 picks once the draft is deep (round 12+).
    // Earlier in the draft, skill positions (QB/RB/WR/TE) always matter more.
    const roundOfPick = Math.floor((currentPick - 1) / settings.totalTeams) + 1;
    const isLateDraft = roundOfPick >= 12;
    const eligibleForTopPick = (pos: string) => isLateDraft || (pos !== 'K' && pos !== 'DST');

    const posNeed = (pos: string) => Math.max(0, (lineupTargets[pos] || 0) - (userPosCount[pos] || 0));

    // Score each undrafted player: base VORP, nudged by position need + scarcity + ADP value.
    const scored = undrafted.map((p) => {
      const vorp = getPlayerVorp(p);
      const startable = startableRemaining[p.position] || 0;
      const need = posNeed(p.position);
      const adp = p.manualAdpOverride ?? p.adp ?? 999;

      // Roster-need nudge: extra points for positions the user still has to start.
      const needBonus = need > 0 ? Math.min(need, 2) * 6 : 0;
      // Scarcity nudge: RBs/TEs with few startable left get a bigger push.
      const scarcityBonus = (startable <= 4 ? 8 : startable <= 8 ? 4 : 0) + (p.position === 'RB' || p.position === 'TE' ? 2 : 0);
      // ADP-value nudge: reward REAL steals — a player still available whose ADP is
      // well BEFORE the current pick (they were supposed to go earlier and fell to you).
      // Capped so it stays a tiebreaker, never the star of the show.
      const stealPicks = Math.max(0, currentPick - adp);
      const adpValue = Math.min(stealPicks * 0.4, 10);

      const score = vorp + needBonus + scarcityBonus + adpValue;
      return { player: p, score, vorp, need, scarcity: startable, adp, eligible: eligibleForTopPick(p.position) };
    });

    const ranked = scored
      .filter(r => r.eligible)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Build a short human-readable reason for each recommendation.
    return ranked.map((r, i) => {
      const reasons: string[] = [];
      if (r.need > 0) reasons.push(`Need ${r.need} more starter${r.need > 1 ? 's' : ''} at ${r.player.position}`);
      if (r.scarcity <= 4) reasons.push(`Only ${r.scarcity} startable ${r.player.position}s left`);
      else if (r.scarcity <= 8) reasons.push(`${r.scarcity} startable ${r.player.position}s left`);
      if (currentPick - r.adp >= 6) reasons.push(`Fell ${currentPick - r.adp} picks past ADP (steal)`);
      if (reasons.length === 0) reasons.push('Best value on the board');
      return {
        rank: i + 1,
        player: r.player,
        vorp: r.vorp,
        reasons,
        score: r.score,
      };
    });
  }, [players, replacementPoints, currentPick, scoringSettings, settings]);

  // One-tap AI coach read: a single Gemini call that weighs the top candidates and says who to take.
  const handleAskCoachAi = async () => {
    if (!geminiApiKey) {
      setCoachAiText('No AI key saved on this device. Add your free key in Settings → AI Analysis Key, then ask me again.');
      return;
    }
    setCoachAiLoading(true);
    setCoachAiText(null);
    try {
      const top3 = coachRecommendations.map((r) =>
        `${r.rank}. ${r.player.name} (${r.player.position}, ${r.player.team}) — VORP +${r.vorp.toFixed(1)}, projected ${getPlayerProjectedPoints(r.player).toFixed(1)} pts`
      ).join('\n');

      const userPrompt = `I'm drafting right now. It's my pick (Pick #${currentPick}, Round ${currentRound}, ${settings.totalTeams} team snake draft, ${settings.scoring} scoring).

Here are the top 3 candidates my stats-based coach ranked for me:
${top3}

Give me a decisive, 2-3 sentence recommendation: who should I take, and the ONE biggest reason why. Be direct, no hedging. If there's a clear position run happening (e.g. RBs flying off the board), say so.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 220 },
          }),
        }
      );

      if (!geminiResponse.ok) {
        let detail = '';
        try { const e = await geminiResponse.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `Gemini returned status ${geminiResponse.status}.`);
      }

      const data = await geminiResponse.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
      setCoachAiText(text.trim());
      setCoachAiPickKey(currentPick);
    } catch (err: any) {
      setCoachAiText(err?.message ? `AI error: ${err.message}` : 'AI error. Try again in a moment.');
    } finally {
      setCoachAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden max-w-full">

      {/* SPLASH SCREEN (doorway cover) */}
      {appStage === 'splash' && <SplashScreen onEnter={handleEnter} />}

      {/* HOME HUB (menu of doors) */}
      {appStage === 'hub' && (
        <div className="min-h-screen flex flex-col bg-[#0a0a0c]">
          <HomeHub
            onOpenDraft={goToDraft}
            onOpenHowTo={() => setAppStage('howto')}
            onBackToSplash={() => setAppStage('splash')}
          />
        </div>
      )}

      {/* HOW TO & GLOSSARY PAGE */}
      {appStage === 'howto' && (
        <div className="min-h-screen flex flex-col bg-slate-950">
          <Header onHomeClick={goToHub} onDraftClick={goToDraft} onHowToClick={() => setAppStage('howto')} />
          <HowToPage onBack={goToHub} />
        </div>
      )}

      {/* DRAFT ROOM */}
      {appStage === 'draft' && (
      <>
      {/* COMPRESSED TOP BAR: title + home + tabs all in one line (wraps on narrow screens) */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 sm:px-4" id="top-bar">
          <div className="relative mr-1.5 shrink-0" ref={homeMenuRef}>
            <button
              type="button"
              onClick={() => setShowHomeMenu(!showHomeMenu)}
              className="flex items-center gap-2 group cursor-pointer"
              title="Jump to a page"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/20 text-teal-400 group-hover:border-teal-400/60 group-hover:bg-teal-900/40 transition-colors">
                <Home className="h-4 w-4" />
              </div>
              <h1 className="hidden min-[420px]:block text-sm sm:text-base font-bold tracking-tight text-white font-sans">
                FIRE
              </h1>
            </button>

            {/* Home dropdown: jump straight to any page */}
            {showHomeMenu && (
              <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-fade-in overflow-hidden">
                <div className="px-3.5 pt-2.5 pb-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Pages</div>
                <button
                  type="button"
                  onClick={() => { setShowHomeMenu(false); goToDraft(); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <Database className="h-4 w-4 text-teal-400" />
                  Draft Room
                </button>
                <button
                  type="button"
                  onClick={() => { setShowHomeMenu(false); goToHub(); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <Home className="h-4 w-4 text-teal-400" />
                  Home Hub (Menu)
                </button>
                <button
                  type="button"
                  onClick={() => { setShowHomeMenu(false); setAppStage('howto'); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <BookOpen className="h-4 w-4 text-teal-400" />
                  How To &amp; Glossary
                </button>

                <div className="px-3.5 pt-2 pb-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Coming Soon</div>
                {[
                  { icon: CalendarRange, label: 'Season Hub' },
                  { icon: ArrowLeftRight, label: 'Trades' },
                  { icon: Link2, label: 'League Sync' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 select-none"
                    >
                      <Icon className="h-4 w-4 text-slate-600" />
                      {item.label}
                      <span className="ml-auto rounded-md border border-slate-700 bg-slate-950/60 px-1.5 py-0.5 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                        Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0" id="top-tab-bar">
            {([
              { id: 'players', label: 'Players', icon: ListFilter },
              { id: 'board', label: 'Draft Board', icon: Database },
              { id: 'squad', label: 'My Squad', icon: CheckCircle2 },
              { id: 'log', label: 'Draft Log', icon: Undo2 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTopTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setShowPlayerInfo(false);
                    setActiveTopTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs sm:text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-600/20'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}

            {/* Draft Setups: prominent button up top, opens as a popup */}
            <button
              onClick={() => setShowSetupListModal(true)}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none border-teal-500/50 bg-teal-950/40 text-teal-300 hover:bg-teal-900/50 hover:text-teal-200"
              title="Save, load, or delete named predraft setups"
            >
              <Save className="h-4 w-4 shrink-0" />
              Draft Setups
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col gap-4" id="draft-assistant-main">

          {/* Clock controls (Col-span 2). Clock only appears during Mock Draft —
              in a real draft you click your own buttons, so a countdown is pointless. */}
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            {isMockDraftActive ? (
              <>
            {isTimerEnabled ? (
              <div 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="group relative flex items-center gap-3 cursor-pointer select-none border border-slate-800 bg-slate-900/45 hover:bg-slate-900/75 rounded-xl p-2.5 flex-1 transition-all"
                title={isTimerRunning ? "Click to Pause" : "Click to Start"}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all ${
                  isTimerRunning 
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 animate-pulse' 
                    : 'bg-slate-950 border-slate-850 text-slate-500'
                }`}>
                  {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <span>Round {currentRound} • Pick {currentPick}</span>
                    {isTimerRunning && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                  </span>
                  <span className="text-lg font-black font-mono tracking-tight text-white flex items-center gap-1.5 leading-none">
                    {formatTimerTime(timerSeconds)}
                    <span className="text-[10px] font-normal text-slate-500 font-sans group-hover:text-teal-400 transition-colors">
                      ({isTimerRunning ? 'running' : 'paused'})
                    </span>
                  </span>
                </div>
                
                {/* Reset Timer Button inside */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimerSeconds(settings.timeLimitSeconds);
                  }}
                  className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-500 hover:text-white transition-colors"
                  title="Reset clock"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                {/* Disable Timer Button (Slash clock) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimerEnabled(false);
                    setIsTimerRunning(false);
                  }}
                  className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Disable clock"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => {
                  setIsTimerEnabled(true);
                  setIsTimerRunning(true);
                }}
                className="group flex items-center gap-3 cursor-pointer select-none border border-dashed border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl p-2.5 flex-1 transition-all"
                title="Click to Enable Timer Clock"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 border border-slate-850 text-slate-600 group-hover:text-teal-400 group-hover:border-teal-500/20 transition-all">
                  <Clock className="h-4 w-4 line-through decoration-rose-500 decoration-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                    Round {currentRound} • Pick {currentPick}
                  </span>
                  <span className="text-lg font-black font-mono tracking-tight text-slate-600 group-hover:text-slate-400 line-through decoration-rose-500/40 decoration-2 transition-all leading-none">
                    {formatTimerTime(settings.timeLimitSeconds)}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-teal-400/85 bg-teal-950/20 border border-teal-500/10 px-2 py-1 rounded-lg group-hover:bg-teal-950/40 transition-all">
                  Enable Clock
                </span>
              </div>
            )}
              </>
            ) : (
              <div
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/20 p-2.5 flex items-center justify-center text-[10px] font-mono text-slate-600"
                title="In a real draft there is no clock — you make your picks on your own time."
              >
                No clock in live drafts — mock drafts include a practice clock.
              </div>
            )}

            {/* Reset Board Button next to clock */}
            <button
              onClick={handleResetDraft}
              className="flex h-[58px] px-3.5 items-center justify-center gap-1.5 rounded-xl border border-rose-950 bg-rose-950/10 text-rose-400 hover:bg-rose-950/20 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors shrink-0"
              title="Reset entire draft board"
            >
              Reset
            </button>
          </div>

        {/* DRAFT ROUND & SELECTION STATUS BAR */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-3 sm:p-4 flex flex-col gap-3 shadow-xl" id="draft-round-progress-status-bar">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Round box */}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center shadow-lg min-w-[96px] flex-1">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Round</span>
              <span className="text-3xl font-black text-teal-400 font-mono leading-none">{currentRound}</span>
            </div>

            {/* Current Pick box */}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center shadow-lg min-w-[96px] flex-1">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Pick</span>
              <span className="text-3xl font-black text-white font-mono leading-none">{currentPick}</span>
            </div>

            {/* Your-pick-next box: elongated, green light */}
            <div className="flex-[2] min-w-[140px] bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-lg flex items-center justify-center text-center">
              {isUserPick(currentPick, settings.userPickNumber, settings.totalTeams) ? (
                <span className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  👉 YOUR TURN TO PICK!
                </span>
              ) : (() => {
                let nextUserPick = -1;
                for (let p = currentPick; p <= settings.totalTeams * 15; p++) {
                  if (isUserPick(p, settings.userPickNumber, settings.totalTeams)) {
                    nextUserPick = p;
                    break;
                  }
                }
                if (nextUserPick !== -1) {
                  const diff = nextUserPick - currentPick;
                  return (
                    <span className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse"></span>
                      Your pick in <strong className="text-teal-400">{diff} {diff === 1 ? 'pick' : 'picks'}</strong>
                      <span className="text-slate-500 font-mono">(Pick #{nextUserPick})</span>
                    </span>
                  );
                }
                return <span className="text-xs font-mono text-slate-500">Draft Finished</span>;
              })()}
            </div>
          </div>
        </div>

        {/* WORKSPACE DIVIDER GRID */}
        <div className="grid gap-6 lg:grid-cols-12 items-start w-full max-w-full overflow-hidden">
          
          {/* LEFT SIDE: THE DRAFT BOARD (full width) */}
          <div className="lg:col-span-12 min-w-0 w-full flex flex-col gap-4 bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 sm:p-5 overflow-hidden" id="draft-board-panel">
            
            {activeTopTab === 'settings' && (
              <div
                className="animate-fade-in flex flex-col gap-4"
                id="advanced-tools-panel"
              >
                <div
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <Settings className="h-4 w-4" />
                      Settings
                    </span>
                  </div>
                  <div className="animate-fade-in flex flex-col gap-4">
                {/* DRAFT SETUP HUB */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-4 shadow-inner" id="draft-settings-hub">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 border-b border-slate-800/60 pb-2">
                    <Settings className="h-4 w-4" />
                    Draft Setup
                  </h3>
                  
                  {/* Draft Slot & Teams Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                      <label className="text-xs font-mono text-slate-400">Scoring Format:</label>
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1" title="Select scoring settings">
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, scoring: 'STD' }))}
                          className={`flex-1 px-2.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                            settings.scoring === 'STD' 
                              ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, scoring: 'PPR' }))}
                          className={`flex-1 px-2.5 py-1.5 text-xs font-bold rounded-md transition-all ${
                            settings.scoring === 'PPR' 
                              ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          PPR
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                      <label className="text-xs font-mono text-slate-400">Total Teams:</label>
                      <select
                        value={settings.totalTeams}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSettings(prev => ({ ...prev, totalTeams: val }));
                          const newRound = Math.floor((currentPick - 1) / val) + 1;
                          setCurrentRound(newRound);
                        }}
                        className="rounded bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 cursor-pointer"
                      >
                        {[8, 10, 12, 14, 16].map((num) => (
                          <option key={num} value={num}>{num} Teams</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                      <label className="text-xs font-mono text-slate-400">My Draft Slot:</label>
                      <select
                        value={settings.userPickNumber}
                        onChange={(e) => setSettings(prev => ({ ...prev, userPickNumber: Number(e.target.value) }))}
                        className="rounded bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 cursor-pointer"
                      >
                        {Array.from({ length: settings.totalTeams }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>Pick #{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Team Names Customizer */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 mt-2">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      Custom Team Names
                    </h4>
                    <p className="text-[10px] text-slate-500 mb-2">Assign names to draft slots so you can easily identify who drafted whom on the Draft Board.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                      {Array.from({ length: settings.totalTeams }, (_, i) => i + 1).map((num) => (
                        <div key={num} className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono text-slate-500">Slot #{num}</label>
                          <input
                            type="text"
                            placeholder={num === settings.userPickNumber ? 'My Team' : `Team ${num}`}
                            value={settings.teamNames?.[num] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSettings(prev => ({
                                ...prev,
                                teamNames: {
                                  ...(prev.teamNames || {}),
                                  [num]: val
                                }
                              }));
                            }}
                            className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    <button
                      onClick={() => setShowScoringModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-teal-400 transition-colors shadow-sm text-slate-200"
                    >
                      <Sliders className="h-4 w-4 text-teal-400" />
                      <span>Custom Scoring Rules</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isMockDraftActive) {
                          setIsMockDraftActive(false);
                        } else {
                          setShowMockSetupModal(true);
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                        isMockDraftActive
                          ? 'border-emerald-500/50 bg-emerald-900/30 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-emerald-300'
                      }`}
                      title="Simulate team opponents automatically drafting in a 12-man league!"
                    >
                      <Target className={`h-4 w-4 ${isMockDraftActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>Mock Simulator {isMockDraftActive ? 'Active' : 'Start'}</span>
                    </button>

                    <button
                      onClick={() => setIsSleeperSyncOpen(!isSleeperSyncOpen)}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                        isSleeperSyncOpen
                          ? 'border-indigo-500/50 bg-indigo-900/30 text-indigo-300'
                          : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-indigo-300'
                      }`}
                    >
                      <Database className={`h-4 w-4 ${isSleeperSyncOpen ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>Sleeper Rankings</span>
                    </button>

                    <button
                      onClick={() => setShowPersonalEdgePanel(!showPersonalEdgePanel)}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                        showPersonalEdgePanel
                          ? 'border-teal-500/50 bg-teal-900/30 text-teal-300'
                          : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-teal-300'
                      }`}
                    >
                      <span className="text-teal-400 text-sm leading-none">⚡</span>
                      <span>Personal Analytics Edge</span>
                    </button>
                  </div>

              {/* Collapsed/collapsible skinny Sleeper controls */}
              {isSleeperSyncOpen && (
                <div className="mt-1 border-t border-slate-800/40 pt-3 flex flex-col gap-3">
                  
                  {/* Public ADP Banner & Fetch Option */}
                  <div className="bg-gradient-to-r from-indigo-950/45 to-slate-900/45 border border-indigo-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Sparkles className="h-4 w-4 text-indigo-300 animate-pulse" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">Live Sleeper Rankings</span>
                        <span className="block text-[10px] text-slate-400 leading-normal">
                          Pulls Sleeper's constantly-updated player rankings straight from their free public API. No login or League ID needed!
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchPublicSleeperAdp}
                      disabled={isPublicSleeperAdpLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 shadow-lg shadow-indigo-600/15 transition-all disabled:opacity-40"
                    >
                      {isPublicSleeperAdpLoading ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <Database className="h-3.5 w-3.5" />
                          <span>Load Sleeper ADP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Public Projections Banner & Fetch Option (keeps numbers fresh, free & no key) */}
                  <div className="bg-gradient-to-r from-sky-950/45 to-slate-900/45 border border-sky-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <BarChart3 className="h-4 w-4 text-sky-300" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">Live Sleeper Projections</span>
                        <span className="block text-[10px] text-slate-400 leading-normal">
                          Pulls Sleeper's current season projected points (PPR & Standard) from their free public API. No key or login needed — keeps your board fresh like ADP.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchSleeperProjections()}
                      disabled={isSleeperProjectionsLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 shadow-lg shadow-sky-600/15 transition-all disabled:opacity-40"
                    >
                      {isSleeperProjectionsLoading ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Calculating...</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Load Sleeper Projections</span>
                        </>
                      )}
                    </button>
                  </div>

                  {sleeperError && (
                    <div className="rounded border border-rose-500/10 bg-rose-500/5 p-1.5 text-center text-[9px] text-rose-400 font-mono">
                      Error: {sleeperError}
                    </div>
                  )}
                  {sleeperProjectionsError && (
                    <div className="rounded border border-rose-500/10 bg-rose-500/5 p-1.5 text-center text-[9px] text-rose-400 font-mono">
                      Error: {sleeperProjectionsError}
                    </div>
                  )}
                </div>
              )}

              {/* Bring-Your-Own-Key: AI Analysis Key card */}
              <div className="mt-2 border-t border-slate-800/40 pt-4 flex flex-col gap-3 animate-fade-in" id="ai-key-card">
                <div className="bg-gradient-to-r from-teal-950/15 to-slate-900/30 border border-teal-500/10 rounded-xl p-4 flex flex-col gap-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                        <Sparkles className="h-4 w-4 text-teal-300" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">AI Analysis Key</span>
                        <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">
                          The player breakdown reports are powered by Gemini AI. Paste your own free key here to unlock analysis — saved only on this device, never shared.
                        </span>
                      </div>
                    </div>
                    {geminiApiKey ? (
                      <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        KEY SAVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-mono font-bold text-amber-400">
                        <AlertTriangle className="h-3 w-3" />
                        NO KEY
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={aiKeyInput}
                      onChange={(e) => setAiKeyInput(e.target.value)}
                      placeholder="Paste your Gemini API key (e.g. AIza...) — free at aistudio.google.com"
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAiKey}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 shadow-lg shadow-teal-600/15 transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {geminiApiKey ? 'Update Key' : 'Save Key'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Where to get one: visit <span className="text-teal-400 font-mono">aistudio.google.com</span> → get an API key. It's free and lets anyone using this app run player analysis with their own key — no server setup needed.
                  </p>
                </div>
              </div>

              {/* Personal Edge Collapsible Panel */}
              {showPersonalEdgePanel && (
                <div className="mt-2 border-t border-slate-800/40 pt-4 flex flex-col gap-4 animate-fade-in" id="personal-edge-formula-board">
                  <div className="bg-gradient-to-r from-teal-950/15 to-slate-900/30 border border-teal-500/10 rounded-xl p-4 flex flex-col gap-3.5 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                          <span className="text-sm font-bold">🎯</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white font-sans">Draft Edge: Pace & Volume Formulas</span>
                          <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">
                            Baked-in statistical adjustments that dynamically nudge player VORP & ADP based on real play volume.
                          </span>
                        </div>
                      </div>
                      
                      {/* Interactive toggle switch */}
                      <button
                        onClick={() => setEnablePersonalEdge(!enablePersonalEdge)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-extrabold transition-all cursor-pointer select-none ${
                          enablePersonalEdge 
                            ? "bg-teal-500/20 border-teal-500/40 text-teal-400" 
                            : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${enablePersonalEdge ? 'bg-teal-400 animate-pulse' : 'bg-slate-700'}`}></span>
                        <span>{enablePersonalEdge ? "FORMULA ACTIVE" : "FORMULA BYPASSED"}</span>
                      </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 text-xxs">
                      {/* Left: Tempo List */}
                      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900/60">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-1">
                          <span className="font-bold text-slate-300 flex items-center gap-1 font-sans uppercase tracking-wider text-[10px]">
                            ⚡ Team Tempo Ranks (Plays/G)
                          </span>
                          <span className="font-mono text-slate-500 text-[9px]">NFL Baseline: 63.0</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-2">
                          High-tempo teams run more plays. Every offensive player on these teams gets a dynamic nudge of <span className="text-teal-400 font-bold">+0.5% for every play above 63</span> (e.g. IND gets +2.3%, CLE +2.6%). Slow teams receive a proportionate minor reduction down to -2.5% max.
                        </p>
                        
                        {/* Scrollable grid of teams */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {Object.entries(TEAM_PACE_STATS).map(([teamCode, info]) => {
                            let tierColor = 'text-slate-500 bg-slate-900/40 border-slate-850/40';
                            if (info.tier === 'Elite') tierColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
                            if (info.tier === 'Above Average') tierColor = 'text-teal-400 bg-teal-500/10 border-teal-500/10';
                            if (info.tier === 'Slow') tierColor = 'text-rose-400/80 bg-rose-500/5 border-rose-500/5';
                            
                            return (
                              <div 
                                key={teamCode} 
                                className={`flex flex-col items-center justify-center p-1 border rounded font-mono ${tierColor}`}
                                title={`${teamCode}: ${info.playsPerGame} plays/game (${info.tier})`}
                              >
                                <span className="font-bold text-[9px]">{teamCode}</span>
                                <span className="text-[8px] opacity-75">{info.playsPerGame}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Target Volume */}
                      <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-900/60">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-1">
                          <span className="font-bold text-slate-300 flex items-center gap-1 font-sans uppercase tracking-wider text-[10px]">
                            🎯 Target-Volume Boost Rules
                          </span>
                          <span className="font-mono text-slate-500 text-[9px]">PPR Rec Proxy</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-2.5">
                          Targets represent pure opportunity. Receivers who earn heavy target volume historically deliver a higher fantasy floor.
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 border-l-2 border-amber-500/30 pl-2">
                            <span className="font-bold text-amber-400 font-mono w-14 shrink-0 text-[9px]">🎯 WR Elite:</span>
                            <span className="text-slate-300 leading-snug">
                              Projected for <strong className="text-white">115+ targets</strong> (derived from PPR receptions). Receives a <strong className="text-teal-400">+4.0% custom projection nudge</strong> and displays the gold target badge.
                            </span>
                          </div>
                          <div className="flex items-start gap-2 border-l-2 border-amber-500/30 pl-2">
                            <span className="font-bold text-amber-400 font-mono w-14 shrink-0 text-[9px]">🎯 TE Elite:</span>
                            <span className="text-slate-300 leading-snug">
                              Projected for <strong className="text-white">85+ targets</strong>. Receives a <strong className="text-teal-400">+4.0% nudge</strong> and badge, identifying critical positional advantage.
                            </span>
                          </div>
                          <div className="flex items-start gap-2 border-l-2 border-amber-500/30 pl-2">
                            <span className="font-bold text-amber-400 font-mono w-14 shrink-0 text-[9px]">🎯 RB Bellcow:</span>
                            <span className="text-slate-300 leading-snug">
                              Projected for <strong className="text-white">55+ targets</strong>. High-volume pass-catching backs get a <strong className="text-teal-400">+4.0% nudge</strong> to isolate high-floor dual-threat assets.
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
            </div>
          </div>
        )}

            {activeTopTab === 'board' && (
              <div className="animate-fade-in flex flex-col gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Live Draft Board
                    </h3>
                  </div>
                  
                  <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                    <div 
                      className="grid gap-2 min-w-max"
                      style={{ gridTemplateColumns: `repeat(${settings.totalTeams}, minmax(120px, 1fr))` }}
                    >
                      {/* Team Headers */}
                      {Array.from({ length: settings.totalTeams }, (_, i) => i + 1).map(slotNum => {
                        const isMyTeam = slotNum === settings.userPickNumber;
                        const defaultName = isMyTeam ? 'My Team' : `Team ${slotNum}`;
                        const displayName = settings.teamNames?.[slotNum] || defaultName;
                        
                        return (
                          <div 
                            key={`header-${slotNum}`}
                            className={`p-2 rounded-t-lg text-center font-bold text-xs truncate border-b-2 ${
                              isMyTeam 
                                ? 'bg-teal-950/40 text-teal-300 border-teal-500' 
                                : 'bg-slate-800/40 text-slate-300 border-slate-700'
                            }`}
                            title={displayName}
                          >
                            {displayName}
                          </div>
                        );
                      })}

                      {/* Draft Picks Grid */}
                      {Array.from({ length: 16 }, (_, roundIndex) => { // Assume 16 rounds max for display
                        const roundNum = roundIndex + 1;
                        const isEvenRound = roundNum % 2 === 0;
                        
                        // To map pick to the right column in snake draft, we calculate pick numbers for this round
                        // Round 1: 1, 2, 3... N
                        // Round 2: 2N, 2N-1... N+1
                        const startPick = (roundNum - 1) * settings.totalTeams + 1;
                        
                        return Array.from({ length: settings.totalTeams }, (_, slotIndex) => {
                          const slotNum = slotIndex + 1;
                          
                          // Determine the exact overall pick number that goes in this (Round, Slot) cell
                          let cellPickNum = 0;
                          if (isEvenRound) {
                            cellPickNum = startPick + settings.totalTeams - slotNum;
                          } else {
                            cellPickNum = startPick + slotNum - 1;
                          }
                          
                          const historyItem = draftHistory.find(h => h.pickNumber === cellPickNum);
                          const isCurrentPickCell = currentPick === cellPickNum;
                          const isMyPick = isUserPick(cellPickNum, settings.userPickNumber, settings.totalTeams);
                          
                          let posBg = 'bg-slate-950 border-slate-800';
                          if (historyItem) {
                            switch (historyItem.position) {
                              case 'QB': posBg = 'bg-indigo-900/40 border-indigo-500/50'; break;
                              case 'RB': posBg = 'bg-emerald-900/40 border-emerald-500/50'; break;
                              case 'WR': posBg = 'bg-cyan-900/40 border-cyan-500/50'; break;
                              case 'TE': posBg = 'bg-amber-900/40 border-amber-500/50'; break;
                              case 'K': posBg = 'bg-rose-900/40 border-rose-500/50'; break;
                              case 'DST': posBg = 'bg-purple-900/40 border-purple-500/50'; break;
                              default: posBg = 'bg-slate-800 border-slate-700';
                            }
                          }

                          return (
                            <div 
                              key={`cell-${roundNum}-${slotNum}`}
                              className={`p-2 rounded border relative flex flex-col items-center justify-center min-h-[64px] transition-all ${
                                historyItem
                                  ? isMyPick
                                    ? `${posBg} ring-1 ring-emerald-400 shadow-md`
                                    : posBg
                                  : isCurrentPickCell
                                  ? 'bg-teal-900/20 border-teal-500/50 ring-1 ring-teal-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)] animate-pulse'
                                  : 'bg-slate-900/20 border-slate-800/40 border-dashed'
                              }`}
                            >
                              <span className="absolute top-1 left-1.5 text-[8px] font-mono text-slate-600">
                                {roundNum}.{isEvenRound ? settings.totalTeams - slotNum + 1 : slotNum}
                              </span>
                              
                              {historyItem ? (
                                <>
                                  <div className="font-bold text-[10px] text-white truncate w-full text-center mt-2 px-1">
                                    {historyItem.playerName.split(' ').pop()}
                                  </div>
                                  <div className={`text-[8px] font-mono font-bold mt-0.5 px-1.5 rounded ${
                                    historyItem.position === 'QB' ? 'text-indigo-300' :
                                    historyItem.position === 'RB' ? 'text-emerald-300' :
                                    historyItem.position === 'WR' ? 'text-cyan-300' :
                                    historyItem.position === 'TE' ? 'text-amber-300' :
                                    'text-slate-400'
                                  }`}>
                                    {historyItem.position} - {historyItem.team}
                                  </div>
                                </>
                              ) : (
                                <span className={`text-[9px] font-mono opacity-40 mt-2 ${isCurrentPickCell ? 'text-teal-400' : 'text-slate-700'}`}>
                                  Pick {cellPickNum}
                                </span>
                              )}
                            </div>
                          );
                        });
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTopTab === 'players' && (
              <div className="animate-fade-in flex flex-col gap-4">
                {/* MOCK DRAFT CONTROLLER BANNER */}
            {isMockDraftActive && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shadow-emerald-500/5 animate-fade-in" id="mock-draft-active-banner">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Target className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                      Mock Draft Simulator Mode Active
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">
                      My Slot: <strong className="text-emerald-400">Pick #{settings.userPickNumber}</strong> in a {settings.totalTeams}-team league. Snake order active.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isUserPick(currentPick, settings.userPickNumber, settings.totalTeams) ? (
                    <button
                      onClick={() => simulateCpuPicksUpToUser(currentPick, settings.userPickNumber, settings.totalTeams)}
                      className="flex-1 sm:flex-none rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xxs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      CPU Auto-Simulate
                    </button>
                  ) : (
                    <span className="text-xxs font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg shrink-0">
                      🟢 YOUR TURN TO PICK!
                    </span>
                  )}
                  
                  <button
                    onClick={() => {
                      setIsMockDraftActive(false);
                    }}
                    className="rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white px-3 py-1.5 text-xxs font-mono transition-colors shrink-0"
                  >
                    Exit Sim
                  </button>
                </div>
              </div>
            )}

            {/* PICK-TIME COACH */}
            {coachPanelVisible && coachRecommendations.length > 0 && (
              <div
                className={`rounded-xl border p-3.5 flex flex-col gap-2.5 animate-fade-in ${
                  isUserTurn
                    ? 'border-teal-500/40 bg-teal-950/10 shadow-lg shadow-teal-500/5'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
                id="pick-time-coach"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${isUserTurn ? 'bg-teal-500/15 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">
                        Pick-Time Coach
                        {isUserTurn && <span className="text-teal-400 ml-1.5">• Your Turn</span>}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 mt-1 block leading-tight">
                        {isUserTurn
                          ? 'Here is who I would take right now.'
                          : 'Top targets for your next pick.'}
                      </span>
                    </div>
                  </div>

                  {/* AI Coach read */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={handleAskCoachAi}
                      disabled={coachAiLoading}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xxs font-bold transition-all active:translate-y-px ${
                        geminiApiKey
                          ? 'bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 disabled:opacity-50'
                      }`}
                      title={geminiApiKey ? 'One-tap AI read on who to take' : 'Add your free AI key in Settings to unlock this'}
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      {coachAiLoading ? 'Asking...' : 'Ask AI Coach'}
                    </button>
                    {!geminiApiKey && (
                      <span className="text-[9px] font-mono text-slate-600 leading-none">No AI key — stats only</span>
                    )}
                  </div>
                </div>

                {/* Top 3 recommendations */}
                <div className="flex flex-col gap-1.5">
                  {coachRecommendations.map((rec) => {
                    const p = rec.player;
                    const posColors = {
                      QB: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                      RB: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      WR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                      TE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      K: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                      DST: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                    };
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 sm:gap-3 rounded-lg border p-2 transition-all cursor-pointer ${
                          isUserTurn
                            ? rec.rank === 1
                              ? 'border-teal-500/40 bg-teal-950/20 hover:bg-teal-950/30'
                              : 'border-slate-800/70 bg-slate-950/40 hover:bg-slate-900/50'
                            : 'border-slate-800/50 bg-slate-950/40 hover:bg-slate-900/40'
                        }`}
                        onClick={() => {
                          setSelectedPlayerId(p.id);
                          setActiveRightTab('profile');
                          setShowPlayerInfo(true);
                        }}
                      >
                        <span className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center font-mono text-xs font-black border ${rec.rank === 1 ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {rec.rank}
                        </span>
                        <span className={`inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-lg border text-[9px] font-bold font-mono ${posColors[p.position]}`}>
                          {p.position}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {p.name}
                            <span className="text-slate-500 font-mono text-[10px] ml-1.5">{p.team} • ADP {rec.adp}</span>
                          </span>
                          <span className="text-[10px] text-teal-400/80 font-mono leading-tight">
                            {rec.reasons.join(' · ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                            VORP <strong className={rec.vorp >= 0 ? 'text-teal-400' : 'text-rose-400'}>{rec.vorp >= 0 ? '+' : ''}{rec.vorp.toFixed(1)}</strong>
                          </span>
                          {isUserTurn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDraftPlayer(p.id, 'user');
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xxs font-bold text-white transition-colors active:translate-y-px"
                            >
                              Draft
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI coach response */}
                {coachAiText && (
                  <div className="rounded-lg border border-teal-500/20 bg-slate-950/60 p-2.5">
                    <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                      <strong className="text-teal-400 font-mono text-[10px] uppercase tracking-wider mr-1.5">Coach AI:</strong>
                      {coachAiText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI LIVE DRAFT RUNS & SCARCITY ALERTS */}
            {getPositionRunWarnings().length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5" id="ai-draft-alerts">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
                  <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                    AI Live Board Alerts ({getPositionRunWarnings().length})
                  </h4>
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {getPositionRunWarnings().map((alert) => (
                    <div 
                      key={alert.id}
                      className={`text-[11px] leading-relaxed flex items-start gap-1.5 font-sans p-2 rounded ${
                        alert.severity === 'high'
                          ? 'bg-rose-950/20 border border-rose-500/15 text-rose-300 animate-pulse'
                          : 'bg-amber-950/20 border border-amber-500/15 text-amber-300'
                      }`}
                    >
                      <span className="mt-0.5">•</span>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-[230px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-teal-500/50" />
                  <input
                    type="text"
                    placeholder="Search players and teams"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs font-semibold text-teal-400 placeholder-teal-400/60 placeholder:font-semibold outline-none focus:border-teal-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-teal-500/60 hover:text-teal-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Scoring toggle & Sort toggle & Add Custom Player */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                  
                  {/* Sort By Toggle: ADP vs Proj */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1" title="Select list sorting criteria">
                    <button
                      onClick={() => setSortBy('ADP')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                        sortBy === 'ADP' 
                          ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Sort by Consensus ADP Rank"
                    >
                      ADP
                    </button>
                    <button
                      onClick={() => setSortBy('PROJECTIONS')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                        sortBy === 'PROJECTIONS' 
                          ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Sort by Projected Points"
                    >
                      PROJ
                    </button>
                  </div>

                  {/* Pick-Time Coach button */}
                  <button
                    onClick={() => setShowCoachPanel(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:translate-y-px ${
                      coachPanelVisible
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                        : 'bg-slate-950 border border-teal-500/25 text-teal-400 hover:bg-teal-900/40 hover:text-teal-300'
                    }`}
                    title="Pick-Time Coach — top picks and reasons for your next selection"
                  >
                    <Target className="h-3.5 w-3.5 shrink-0" />
                    <span>Coach</span>
                    {isUserTurn && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>}
                  </button>

                  {/* Add custom button */}
                  <button
                    onClick={() => setShowAddCustomModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-900/40 border border-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-400 hover:bg-teal-900/60 hover:text-teal-300 transition-all active:translate-y-px"
                  >
                    <UserPlus className="h-3.5 w-3.5 shrink-0" />
                    <span>Custom <span className="hidden min-[480px]:inline">Player</span></span>
                  </button>

                </div>

              </div>

              {/* Tier filters row (small, sits up top with the search toolbar) */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 flex-wrap gap-2">
                <div className="flex gap-1 items-center overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none w-full sm:w-auto">
                  <span className="text-[10px] font-mono text-slate-500 uppercase mr-1.5 tracking-wider">Tiers:</span>
                  {(['ALL', 1, 2, 3, 4, 5, 6, 7] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTierFilter(t)}
                      className={`px-2.5 py-1 rounded text-xxs font-mono transition-all border ${
                        activeTierFilter === t
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t === 'ALL' ? 'ALL' : `T${t}`}
                    </button>
                  ))}
                </div>

                {/* Show/Hide drafted toggle */}
                <button
                  onClick={() => setShowDrafted(!showDrafted)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xxs font-mono rounded border transition-all ${
                    showDrafted 
                      ? 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900' 
                      : 'border-teal-500/15 bg-teal-950/20 text-teal-400 hover:bg-teal-950/30'
                  }`}
                >
                  <ListFilter className="h-3 w-3" />
                  {showDrafted ? 'Show Drafted' : 'Hide Drafted'}
                </button>
              </div>

              {/* Position filters row (big, directly above the scrolling selection list) */}
              <div className="flex flex-col gap-2 border-t border-slate-900 pt-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full">
                  {(['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => {
                    const activeStyles = {
                      ALL: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
                      QB: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
                      RB: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                      WR: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
                      TE: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                      K: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                      DST: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
                    };
                    return (
                      <button
                        key={pos}
                        onClick={() => setActivePositionFilter(pos)}
                        className={`flex-1 min-w-[64px] px-3 py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all ${
                          activePositionFilter === pos
                            ? activeStyles[pos]
                            : 'border border-slate-800/60 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {pos === 'ALL' ? 'All' : pos}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* THE PLAYERS LIST */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[560px] lg:max-h-[1200px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              
              {filteredPlayersList.length > 0 ? (
                filteredPlayersList.map((player, index) => {
                  const isSelected = selectedPlayerId === player.id;
                  const posColors = {
                    QB: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                    RB: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    WR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    TE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    K: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    DST: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                  };

                  const projPoints = getPlayerProjectedPoints(player);
                  const vorpValue = getPlayerVorp(player);

                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`group relative rounded-xl border p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 ${
                        player.isDrafted
                          ? 'bg-slate-950/40 border-slate-900/60 opacity-50'
                          : isSelected
                          ? 'bg-teal-950/20 border-teal-500/40 shadow-md'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/30'
                      }`}
                    >
                      {/* Left: Player ID and badge / info */}
                      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 w-full sm:w-auto flex-1">
                        {/* ADP Rank badge */}
                        <div className="h-6 w-6 sm:h-8 sm:w-8 font-mono text-[9px] sm:text-xs font-bold text-slate-500 border border-slate-900 bg-slate-900/60 rounded-lg flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>

                        {/* Position badge */}
                        <span className={`inline-flex h-6 w-7 sm:h-7 sm:w-9 shrink-0 items-center justify-center rounded-lg border text-[9px] sm:text-xs font-bold font-mono ${posColors[player.position]}`}>
                          {player.position}
                        </span>

                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-teal-400 transition-colors flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
                              {player.isSleeperTarget && <span className="text-amber-400 text-xs shrink-0" title="Sleeper Target">★</span>}
                              <span className="truncate">{player.name}</span>
                              {enablePersonalEdge && getPlayerTargetStats(player).isTargetMonster && (
                                <span className="inline-flex rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-400 font-mono tracking-wider items-center gap-0.5 shrink-0" title={`🎯 Projected high-volume targets: ${getPlayerTargetStats(player).estTargets} (+4% formula boost)`}>
                                  🎯 <span className="hidden min-[480px]:inline">{getPlayerTargetStats(player).estTargets} TGTS</span>
                                </span>
                              )}
                              {enablePersonalEdge && TEAM_PACE_STATS[player.team] && TEAM_PACE_STATS[player.team].playsPerGame >= 65.0 && (
                                <span className="inline-flex rounded bg-sky-500/10 border border-sky-500/20 px-1 py-0.2 text-[8px] font-bold text-sky-400 font-mono tracking-wider items-center gap-0.5 shrink-0" title={`⚡ High-tempo play volume: ${TEAM_PACE_STATS[player.team].playsPerGame} plays/game (+${((TEAM_PACE_STATS[player.team].playsPerGame - 63.0)*0.5).toFixed(1)}% formula boost)`}>
                                  ⚡ <span className="hidden min-[480px]:inline">PACE</span>
                                </span>
                              )}
                            </h4>
                            
                            {player.isBpa && !player.isDrafted && (
                              <span className="inline-flex rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-400 font-mono tracking-wider shrink-0">
                                BPA
                              </span>
                            )}

                            {player.tier && (
                              <span className="inline-flex rounded bg-purple-500/10 border border-purple-500/20 px-1 py-0.2 text-[8px] font-bold text-purple-400 font-mono tracking-wider shrink-0">
                                T{player.tier}
                              </span>
                            )}

                            {player.isDrafted && (
                              <span className={`inline-flex rounded px-1.5 py-0.2 text-[8px] font-bold font-mono tracking-wider uppercase shrink-0 ${
                                player.draftedBy === 'user' 
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                              }`}>
                                {player.draftedBy === 'user' ? 'Mine' : 'Opp'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xxs text-slate-500 font-mono flex-wrap">
                            <span>{player.team}</span>
                            <span>•</span>
                            <span>Bye {player.byeWeek}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              ADP {player.manualAdpOverride ?? player.adp}
                              {player.manualAdpOverride && <span className="text-amber-400 text-[8px] font-bold" title="Manually Adjusted">*</span>}
                            </span>
                            {vorpValue !== 0 && (
                              <>
                                <span>•</span>
                                <span className={vorpValue > 0 ? 'text-teal-400 font-bold' : 'text-rose-400/80'}>
                                  VORP {vorpValue > 0 ? '+' : ''}{vorpValue.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Proj points + Draft buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t border-slate-900/40 pt-1.5 sm:border-t-0 sm:pt-0 shrink-0">
                        {/* Projected points */}
                        <div className="text-left sm:text-right shrink-0 flex items-center gap-1.5 sm:block">
                          <span className="text-[8px] sm:text-[10px] font-mono text-slate-500 uppercase leading-none">Proj</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-300 font-mono">
                            {projPoints.toFixed(1)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto sm:ml-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlayerId(player.id);
                              setActiveRightTab('profile');
                              setShowPlayerInfo(true);
                            }}
                            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-mono uppercase text-slate-400 hover:text-teal-400 hover:border-teal-500/30 flex items-center gap-1 shrink-0"
                            title="Open player info panel"
                          >
                            <Info className="h-3 w-3" />
                            <span className="hidden sm:inline">Info</span>
                          </button>
                          {player.isDrafted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUndraftPlayer(player.id);
                              }}
                              className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-mono uppercase text-slate-400 hover:text-white hover:bg-slate-850"
                            >
                              Undraft
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDraftPlayer(player.id, 'user');
                                }}
                                className={`rounded-lg px-2 py-1 text-[10px] font-bold text-white shadow-sm flex items-center gap-0.5 sm:gap-1 transition-all shrink-0 ${
                                  isUserTurn 
                                    ? 'bg-emerald-500 hover:bg-emerald-400 ring-1 ring-emerald-400 ring-offset-1 ring-offset-slate-950 animate-pulse font-extrabold' 
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                              >
                                <User className="h-3 w-3 shrink-0" />
                                <span>Mine</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDraftPlayer(player.id, 'opponent');
                                }}
                                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors flex items-center gap-0.5 sm:gap-1 shrink-0"
                              >
                                <Users className="h-3 w-3 shrink-0" />
                                <span>Opp</span>
                              </button>
                            </>
                          )}

                          <div className="text-slate-600 group-hover:text-slate-400 pl-0.5 sm:pl-1">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
                  <p className="text-xs">No matching fantasy players located on the draft board.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Try resetting the filters or clearing the search query.</p>
                </div>
              )}

            </div>
            {/* END PLAYERS TAB INNER */}
            </div>
            )}
            {/* END LEFT SIDE MAIN CONTENT */}

          </div>

          {/* PLAYER INFO POPUP */}
          {showPlayerInfo && (
            <div
              className="fixed inset-0 z-50 animate-fade-in flex justify-end pointer-events-none"
              onClick={() => setShowPlayerInfo(false)}
              id="player-info-popup"
            >
              <div
                className="relative h-full w-full max-w-md lg:max-w-lg overflow-y-auto bg-slate-950 border-l border-slate-800 shadow-2xl p-4 sm:p-5 flex flex-col gap-4 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                id="right-workspace-panel"
              >
              {/* Popup header with close button */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Player Info
                </span>
                <button
                  onClick={() => setShowPlayerInfo(false)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-500 hover:text-white transition-colors"
                  title="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* PLAYER PROFILE SCREEN */}
              {activeRightTab === 'profile' && (
              <div className="flex flex-col gap-4">
                
                {/* Active Selection Details Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block mb-0.5">
                        Active Target Profile
                      </span>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {selectedPlayer.name} ({selectedPlayer.position})
                      </h3>
                      
                      <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                        <span className="inline-flex rounded-md bg-slate-950/80 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 items-center gap-1">
                          ADP: {selectedPlayer.manualAdpOverride ?? selectedPlayer.adp ?? 'N/A'}
                          {selectedPlayer.manualAdpOverride && (
                            <span className="text-amber-400 font-bold" title="Manually Adjusted">*</span>
                          )}
                        </span>
                        <div className="flex gap-0.5 items-center bg-slate-950/80 border border-slate-800 rounded-md">
                          <button 
                            className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-l-md"
                            onClick={() => handleUpdatePlayerOverride(selectedPlayer.id, { manualAdpOverride: Math.max(1, (selectedPlayer.manualAdpOverride ?? selectedPlayer.adp ?? 100) - 5) })}
                            title="Bump Up Board (Decrease ADP)"
                          >
                            +
                          </button>
                          <button 
                            className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-r-md"
                            onClick={() => handleUpdatePlayerOverride(selectedPlayer.id, { manualAdpOverride: (selectedPlayer.manualAdpOverride ?? selectedPlayer.adp ?? 100) + 5 })}
                            title="Drop Down Board (Increase ADP)"
                          >
                            -
                          </button>
                        </div>
                        <button
                          onClick={() => handleUpdatePlayerOverride(selectedPlayer.id, { isSleeperTarget: !selectedPlayer.isSleeperTarget })}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                            selectedPlayer.isSleeperTarget
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Mark as Sleeper Target"
                        >
                          ★ SLEEPER
                        </button>
                        <span className="inline-flex rounded-md bg-slate-950/80 border border-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                          BYE: {selectedPlayer.byeWeek || 'N/A'}
                        </span>
                        {selectedPlayer.tier && (
                          <span className="inline-flex rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-400">
                            TIER {selectedPlayer.tier}
                          </span>
                        )}
                        <span className="inline-flex rounded-md bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-400">
                          PROJ: {settings.scoring === 'PPR' ? selectedPlayer.projectedPointsPpr : selectedPlayer.projectedPointsStd} PTS
                        </span>
                      </div>

                      {enablePersonalEdge && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {getPlayerTargetStats(selectedPlayer).estTargets > 0 && (
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-mono font-bold items-center gap-1 ${
                              getPlayerTargetStats(selectedPlayer).isTargetMonster 
                                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                                : 'bg-slate-950/80 border border-slate-800/80 text-slate-400'
                            }`} title={getPlayerTargetStats(selectedPlayer).isTargetMonster ? "High-Volume Target Monster gets +4% projection boost" : "Estimated targets based on catch volume"}>
                              🎯 Est. Targets: {getPlayerTargetStats(selectedPlayer).estTargets}
                              {getPlayerTargetStats(selectedPlayer).isTargetMonster && " (Volume Boost)"}
                            </span>
                          )}
                          {TEAM_PACE_STATS[selectedPlayer.team] && (
                            <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-mono font-bold items-center gap-1 ${
                              TEAM_PACE_STATS[selectedPlayer.team].playsPerGame >= 64.0 
                                ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                                : 'bg-slate-950/80 border border-slate-800/80 text-slate-400'
                            }`} title={`Offensive play volume. Plays/game relative to 63.0 NFL baseline gives +${((TEAM_PACE_STATS[selectedPlayer.team].playsPerGame - 63.0)*0.5).toFixed(1)}% projection adjustment`}>
                              ⚡ Team Tempo: {TEAM_PACE_STATS[selectedPlayer.team].playsPerGame} Plays/G ({TEAM_PACE_STATS[selectedPlayer.team].tier})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="inline-flex rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-xxs font-mono text-slate-400">
                      {selectedPlayer.team}
                    </span>
                  </div>

                  <p className="text-xxs text-slate-400 leading-relaxed font-sans bg-slate-950/40 border border-slate-900/80 p-2.5 rounded">
                    <strong className="text-slate-300">Raw Stats: </strong>
                    {selectedPlayer.rawMetrics || 'No raw stats recorded.'}
                  </p>

                  <div className="grid gap-2 grid-cols-2 text-xxs text-slate-400">
                    <div className="bg-slate-950/40 p-2 rounded">
                      <strong className="text-slate-300 block mb-0.5">System Context:</strong>
                      {selectedPlayer.coachingChanges || 'Standard coaching metrics.'}
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded">
                      <strong className="text-slate-300 block mb-0.5">Recent News:</strong>
                      {selectedPlayer.recentNews || 'No recent news recorded.'}
                    </div>
                  </div>

                  {/* Run / Re-Run AI Analysis Action */}
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xxs text-slate-500 font-mono">
                      {selectedPlayer.preCachedAnalysis ? '✓ Report Compiled' : '⚠ Report Pending'}
                    </span>

                    <button
                      onClick={() => handleRunAiAnalysis(selectedPlayer)}
                      disabled={isAiLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xxs font-bold text-white hover:bg-teal-500 disabled:opacity-50 transition-all active:translate-y-px"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      {isAiLoading ? 'Analyzing...' : selectedPlayer.preCachedAnalysis ? 'Re-Analyze' : 'Run Analysis'}
                    </button>
                  </div>
                </div>

                {/* AI Outputs container */}
                {isAiLoading ? (
                  <DiagnosticLoader />
                ) : aiError ? (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-center flex flex-col gap-2">
                    <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
                    <h4 className="text-xs font-bold text-rose-400">Analysis Error</h4>
                    <p className="text-xxs text-slate-400 font-sans leading-relaxed">{aiError}</p>
                    {!geminiApiKey ? (
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">No AI key saved on this device. Add your free key in Settings → AI Analysis Key.</p>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">Check that the key saved in Settings → AI Analysis Key is correct and active.</p>
                    )}
                  </div>
                ) : selectedPlayer.preCachedAnalysis ? (
                  <AnalysisReport result={selectedPlayer.preCachedAnalysis} />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col gap-3 text-slate-500">
                    <Sparkles className="mx-auto h-6 w-6 text-slate-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">No Analysis Yet</p>
                      <p className="text-xxs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                        No report has been compiled for {selectedPlayer.name} yet. Click <strong className="text-teal-400">"Run Analysis"</strong> to generate a stats-based breakdown.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
          </div>
        )}

            {/* MY SQUAD TAB */}
            {activeTopTab === 'squad' && (
              <div className="lg:col-span-12 min-w-0 w-full rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      My Roster Construction
                    </h3>
                    <p className="text-xxs text-slate-400 mt-0.5 leading-relaxed">
                      Track your draft picks and analyze your roster's metrics, stability, and projected points.
                    </p>
                  </div>

                  {/* Sub-tabs: Positions vs Lineup */}
                  <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 self-start">
                    <button
                      onClick={() => setRosterSubView('positions')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                        rosterSubView === 'positions'
                          ? 'bg-slate-800 text-teal-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Positions
                    </button>
                    <button
                      onClick={() => setRosterSubView('lineup')}
                      className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
                        rosterSubView === 'lineup'
                          ? 'bg-slate-800 text-teal-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Lineup Grid
                    </button>
                  </div>
                </div>

                {/* Roster Categories layout */}
                {players.filter(p => p.isDrafted && p.draftedBy === 'user').length > 0 ? (
                  <div className="flex flex-col gap-4">
                    
                    {rosterSubView === 'positions' ? (
                      <div className="flex flex-col gap-4">
                        {/* Roster list divided by position */}
                        {(['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => {
                          const posSquad = players.filter(p => p.position === pos && p.isDrafted && p.draftedBy === 'user');
                          const posColorMap = {
                            QB: 'text-indigo-400',
                            RB: 'text-emerald-400',
                            WR: 'text-cyan-400',
                            TE: 'text-amber-400',
                            K: 'text-rose-400',
                            DST: 'text-teal-400'
                          };

                          return (
                            <div key={pos} className="flex flex-col gap-1.5 border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${posColorMap[pos]}`}>
                                {pos}S ({posSquad.length})
                              </span>

                              {posSquad.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {posSquad.map((player) => {
                                    const points = settings.scoring === 'PPR' ? player.projectedPointsPpr : player.projectedPointsStd;
                                    return (
                                      <div key={player.id} className="rounded bg-slate-950 border border-slate-900 p-2 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xxs font-mono text-slate-500">Pick {player.draftPickNumber}</span>
                                          <span className="font-semibold text-slate-200">{player.name}</span>
                                          <span className="text-[10px] text-slate-500 font-mono uppercase">{player.team}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="text-xxs text-slate-400 font-mono">{points.toFixed(1)} pts</span>
                                          <button
                                            onClick={() => handleUndraftPlayer(player.id)}
                                            className="text-[10px] text-rose-500 hover:text-rose-400 font-mono"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-600 italic">No {pos}s drafted yet.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Bye week warnings */}
                        {(() => {
                          const visual = getLineupVisual();
                          const conflicts = getByeWeekConflicts(visual.lineup);
                          if (conflicts.length > 0) {
                            return (
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex flex-col gap-1 text-xxs text-amber-300">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Bye Week Conflicts Detected</span>
                                </div>
                                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-300">
                                  {conflicts.map((conflict, i) => (
                                    <li key={i}>{conflict}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          return (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2 text-xxs text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Excellent! No bye week overlaps detected in your starting lineup.</span>
                            </div>
                          );
                        })()}

                        {/* Starting Lineup Grid */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                            Starting Lineup
                          </span>
                          <div className="grid gap-1.5">
                            {getLineupVisual().lineup.map((slotItem) => {
                              const p = slotItem.player;
                              return (
                                <div key={slotItem.slot} className="rounded-lg bg-slate-950 border border-slate-900 p-2.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3">
                                    <span className="w-12 text-[10px] font-mono font-bold text-slate-500 uppercase">
                                      {slotItem.slot}
                                    </span>
                                    {p ? (
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-slate-200">{p.name}</span>
                                          <span className="text-[9px] bg-slate-900 px-1 py-0.5 rounded text-slate-400 font-mono uppercase">{p.team}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                          Bye Week: {p.byeWeek || 'N/A'} • ADP: {p.adp || 'N/A'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-600 italic">Empty slot</span>
                                    )}
                                  </div>
                                  {p && (
                                    <div className="flex items-center gap-3">
                                      <span className="text-xxs font-mono text-slate-400">
                                        {(settings.scoring === 'PPR' ? p.projectedPointsPpr : p.projectedPointsStd).toFixed(1)} pts
                                      </span>
                                      <button
                                        onClick={() => handleUndraftPlayer(p.id)}
                                        className="text-[10px] text-rose-500 hover:text-rose-400 font-mono"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Bench Players */}
                        {(() => {
                          const visual = getLineupVisual();
                          if (visual.bench.length > 0) {
                            return (
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                                  Bench ({visual.bench.length})
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {visual.bench.map((p) => (
                                    <div key={p.id} className="rounded bg-slate-950/60 border border-slate-900 p-2 flex items-center justify-between text-xxs">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium text-slate-300">{p.name}</span>
                                          <span className="text-[9px] text-slate-500 font-mono uppercase">{p.position}</span>
                                        </div>
                                        <span className="text-[9px] text-slate-500">
                                          Bye: {p.byeWeek || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-400">
                                          {(settings.scoring === 'PPR' ? p.projectedPointsPpr : p.projectedPointsStd).toFixed(1)}
                                        </span>
                                        <button
                                          onClick={() => handleUndraftPlayer(p.id)}
                                          className="text-[10px] text-rose-500 hover:text-rose-400 font-mono"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {/* Summary Metrics block */}
                    <div className="mt-2 bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg flex flex-col gap-2">
                      <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Roster Quality Check</span>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Projected Season Points:</span>
                        <span className="font-mono font-bold text-teal-400">
                          {players
                            .filter(p => p.isDrafted && p.draftedBy === 'user')
                            .reduce((sum, p) => sum + (settings.scoring === 'PPR' ? p.projectedPointsPpr : p.projectedPointsStd), 0)
                            .toFixed(1)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                        <span className="text-slate-400 font-sans">Avg Stability Score:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {(
                            players
                              .filter(p => p.isDrafted && p.draftedBy === 'user' && p.preCachedAnalysis)
                              .reduce((sum, p) => sum + (p.preCachedAnalysis?.clinicalScore || 0), 0) /
                              (players.filter(p => p.isDrafted && p.draftedBy === 'user' && p.preCachedAnalysis).length || 1)
                          ).toFixed(1)} / 10
                        </span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500 flex flex-col gap-2">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-slate-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Roster is empty</p>
                      <p className="text-xxs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                        Click <strong className="text-emerald-400">"Mine"</strong> on the draft board to add players to your team roster and begin tracking construction.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* DRAFT LOG TAB */}
            {activeTopTab === 'log' && (
              <div className="lg:col-span-12 min-w-0 w-full rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                      <Undo2 className="h-4 w-4 text-purple-400" />
                      Draft History Log
                    </h3>
                    <p className="text-xxs text-slate-400 mt-0.5 leading-relaxed">
                      Auditable feed of completed draft selections with rollbacks.
                    </p>
                  </div>
                  {draftHistory.length > 0 && (
                    <button
                      onClick={handleUndoLastPick}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xxs font-mono font-bold rounded bg-purple-950/40 border border-purple-500/20 text-purple-400 hover:bg-purple-950/60 transition-colors"
                      title="Undo most recent selection"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Undo Last Pick
                    </button>
                  )}
                </div>

                {draftHistory.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-[560px] lg:max-h-[800px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {[...draftHistory].reverse().map((item, index) => {
                      const posColorMap = {
                        QB: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                        RB: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        WR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                        TE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        K: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                        DST: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                      };
                      return (
                        <div
                          key={`${item.pickNumber}-${item.playerId}`}
                          className={`rounded-lg p-2.5 border flex items-center justify-between gap-3 text-xs ${
                            item.draftedBy === 'user'
                              ? 'bg-emerald-950/10 border-emerald-500/10 text-emerald-100'
                              : 'bg-slate-950/60 border-slate-900 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xxs bg-slate-900 border border-slate-800 h-5 w-10 flex items-center justify-center rounded text-slate-400">
                              Pick {item.pickNumber}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${posColorMap[item.position] || 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                              {item.position}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-semibold">{item.playerName}</span>
                              <span className="text-[9px] text-slate-500 font-mono uppercase">{item.team}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold font-mono uppercase tracking-wide px-1.5 py-0.5 rounded ${
                              item.draftedBy === 'user'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {item.draftedBy === 'user' ? 'Mine' : 'Opp'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500 flex flex-col gap-2">
                    <Undo2 className="mx-auto h-6 w-6 text-slate-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">No Draft History</p>
                      <p className="text-xxs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                        Once draft picks are selected on the board (by you or simulated opponent), they will appear here in chronological order.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

        </div>

      </main>

      {/* CUSTOM PLAYER CREATOR MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="custom-player-modal">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-5 shadow-2xl">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-teal-400" />
                Add Custom Player to Board
              </h3>
              <button 
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPlayer} className="flex flex-col gap-4">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Player Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nico Collins"
                    value={customPlayerForm.name}
                    onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400">NFL Team</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HOU"
                      value={customPlayerForm.team}
                      onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, team: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-teal-500"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400">Pos</label>
                    <select
                      value={customPlayerForm.position}
                      onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, position: e.target.value as any }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="QB">QB</option>
                      <option value="RB">RB</option>
                      <option value="WR">WR</option>
                      <option value="TE">TE</option>
                      <option value="K">K</option>
                      <option value="DST">DST</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Numerical details row */}
              <div className="grid gap-3 grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase">Bye</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={customPlayerForm.byeWeek}
                    onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, byeWeek: Number(e.target.value) }))}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-teal-500 text-center font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase">ADP</label>
                  <input
                    type="number"
                    value={customPlayerForm.adp}
                    onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, adp: Number(e.target.value) }))}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-teal-500 text-center font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase">Proj Std</label>
                  <input
                    type="number"
                    value={customPlayerForm.projectedPointsStd}
                    onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, projectedPointsStd: Number(e.target.value) }))}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-teal-500 text-center font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-slate-400 uppercase">Proj PPR</label>
                  <input
                    type="number"
                    value={customPlayerForm.projectedPointsPpr}
                    onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, projectedPointsPpr: Number(e.target.value) }))}
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-teal-500 text-center font-mono"
                  />
                </div>
              </div>

              {/* Raw athletic details */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Raw Metrics / Sustainable stats</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Target share: 24%, TPRR: 25.1%, Expected FP/g: 13.5..."
                  value={customPlayerForm.rawMetrics}
                  onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, rawMetrics: e.target.value }))}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Coaching changes / Offensive System</label>
                <input
                  type="text"
                  placeholder="e.g. Bobby Slowik remains OC. High pass rate, 3-WR spacing."
                  value={customPlayerForm.coachingChanges}
                  onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, coachingChanges: e.target.value }))}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">Recent News</label>
                <input
                  type="text"
                  placeholder="e.g. 'Projected for 115 targets and a top-20 finish.'"
                  value={customPlayerForm.recentNews}
                  onChange={(e) => setCustomPlayerForm(prev => ({ ...prev, recentNews: e.target.value }))}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-md active:translate-y-px"
              >
                Add Player to Board
              </button>

            </form>

          </div>
        </div>
      )}

      {/* DRAFT SETUPS: SAVE NAME MODAL */}
      {showSaveSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="save-setup-modal">
          <div className="w-full max-w-md rounded-xl border border-teal-500/30 bg-slate-900 p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Save className="h-4 w-4 text-teal-400" />
                Save Current Setup
              </h3>
              <button
                onClick={() => setShowSaveSetupModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Give this draft configuration a name so you can load it later and start drafting immediately.
              This saves your scoring rules, team count, draft slot, and team names — not any draft picks.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSaveSetup(); }}
              className="flex flex-col gap-3"
            >
              <label className="text-xs font-medium text-slate-400">Setup Name</label>
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Taco League, Big Money Draft..."
                value={setupNameInput}
                onChange={(e) => setSetupNameInput(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-md"
              >
                Save Setup
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DRAFT SETUPS: LIST & LOAD MODAL */}
      {showSetupListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="setup-list-modal">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Save className="h-4 w-4 text-teal-400" />
                My Draft Setups
              </h3>
              <button
                onClick={() => setShowSetupListModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Load a saved setup to instantly apply its scoring, teams, and draft slot with a clean board.
            </p>

            {savedSetups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center text-sm text-slate-500">
                No saved setups yet.
                <div className="mt-2 text-xs text-slate-600">Use "Save Current Setup" to create your first one.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {savedSetups.map((setup) => (
                  <div
                    key={setup.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-white truncate">{setup.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {setup.settings.totalTeams} teams • Pick #{setup.settings.userPickNumber} • {setup.settings.scoring}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSetupToConfirmLoad(setup)}
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSetup(setup.id)}
                        className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete this setup"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowSetupListModal(false);
                setShowSaveSetupModal(true);
              }}
              className="mt-1 rounded-lg bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-teal-300 transition-colors"
            >
              + Save Current Setup
            </button>
          </div>
        </div>
      )}

      {/* DRAFT SETUPS: LOAD CONFIRMATION MODAL (ask first) */}
      {setupToConfirmLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="load-setup-confirm-modal">
          <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-slate-900 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Load "{setupToConfirmLoad.name}"?
              </h3>
              <button
                onClick={() => setSetupToConfirmLoad(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will replace your current settings and clear the draft board to a clean start. You'll be ready to draft immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSetupToConfirmLoad(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLoadSetup}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-colors"
              >
                Load Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOCK DRAFT: PICK SETUP MODAL */}
      {showMockSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="mock-setup-modal">
          <div className="w-full max-w-md rounded-xl border border-emerald-500/30 bg-slate-900 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Target className="h-4 w-4 text-emerald-400" />
                Start Mock Draft
              </h3>
              <button
                onClick={() => setShowMockSetupModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose which settings to practice with. Standard uses the default league, or pick one of your saved setups.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowMockSetupModal(false);
                  startMockWithSetup(null);
                }}
                className="text-left rounded-lg border border-slate-700 bg-slate-800/60 p-3 hover:bg-slate-700 transition-colors"
              >
                <span className="block text-sm font-bold text-white">Standard</span>
                <span className="block text-[10px] font-mono text-slate-500">12 teams • Pick #5 • Default scoring</span>
              </button>

              {savedSetups.map((setup) => (
                <button
                  key={setup.id}
                  onClick={() => {
                    setShowMockSetupModal(false);
                    startMockWithSetup(setup);
                  }}
                  className="text-left rounded-lg border border-slate-700 bg-slate-800/60 p-3 hover:border-emerald-500/40 hover:bg-slate-700 transition-colors"
                >
                  <span className="block text-sm font-bold text-white">{setup.name}</span>
                  <span className="block text-[10px] font-mono text-slate-500">
                    {setup.settings.totalTeams} teams • Pick #{setup.settings.userPickNumber} • {setup.settings.scoring}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC SCORING CONFIGURATOR DIALOG */}
      {showScoringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="scoring-config-modal">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-teal-400" />
                Custom League Scoring Settings
              </h3>
              <button 
                onClick={() => setShowScoringModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Presets Row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-mono uppercase tracking-widest text-slate-500">Quick Presets</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => {
                      setScoringSettings({
                        ppr: 0.0,
                        passingTd: 4.0,
                        interception: -2.0,
                        tePremium: 0.0,
                        passingBonus300: 0.0,
                        rushingBonus100: 0.0,
                        receivingBonus100: 0.0,
                        rushingTd: 6.0,
                        receivingTd: 6.0
                      });
                      setSettings(prev => ({ ...prev, scoring: 'STD' }));
                    }}
                    className={`px-2 py-1.5 text-xxs font-semibold rounded border transition-all ${
                      scoringSettings.ppr === 0.0 && scoringSettings.passingTd === 4.0 && !(scoringSettings.tePremium > 0)
                        ? 'bg-slate-950 border-teal-500/30 text-teal-400 font-mono'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => {
                      setScoringSettings({
                        ppr: 0.5,
                        passingTd: 4.0,
                        interception: -2.0,
                        tePremium: 0.0,
                        passingBonus300: 0.0,
                        rushingBonus100: 0.0,
                        receivingBonus100: 0.0,
                        rushingTd: 6.0,
                        receivingTd: 6.0
                      });
                      setSettings(prev => ({ ...prev, scoring: 'PPR' }));
                    }}
                    className={`px-2 py-1.5 text-xxs font-semibold rounded border transition-all ${
                      scoringSettings.ppr === 0.5 && scoringSettings.passingTd === 4.0 && !(scoringSettings.tePremium > 0)
                        ? 'bg-slate-950 border-teal-500/30 text-teal-400 font-mono'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                    }`}
                  >
                    Half-PPR
                  </button>
                  <button
                    onClick={() => {
                      setScoringSettings({
                        ppr: 1.0,
                        passingTd: 4.0,
                        interception: -2.0,
                        tePremium: 0.0,
                        passingBonus300: 0.0,
                        rushingBonus100: 0.0,
                        receivingBonus100: 0.0,
                        rushingTd: 6.0,
                        receivingTd: 6.0
                      });
                      setSettings(prev => ({ ...prev, scoring: 'PPR' }));
                    }}
                    className={`px-2 py-1.5 text-xxs font-semibold rounded border transition-all ${
                      scoringSettings.ppr === 1.0 && scoringSettings.passingTd === 4.0 && !(scoringSettings.tePremium > 0)
                        ? 'bg-slate-950 border-teal-500/30 text-teal-400 font-mono'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                    }`}
                  >
                    Full PPR
                  </button>
                  <button
                    onClick={() => {
                      setScoringSettings({
                        ppr: 1.0,
                        passingTd: 4.0,
                        interception: -2.0,
                        tePremium: 0.5,
                        passingBonus300: 3.0,
                        rushingBonus100: 3.0,
                        receivingBonus100: 3.0,
                        rushingTd: 6.0,
                        receivingTd: 6.0
                      });
                      setSettings(prev => ({ ...prev, scoring: 'PPR' }));
                    }}
                    className={`px-2 py-1.5 text-xxs font-semibold rounded border transition-all ${
                      scoringSettings.tePremium > 0
                        ? 'bg-slate-950 border-teal-500/30 text-teal-400 font-mono'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                    }`}
                    title="TE Premium / Advanced High Stakes bracket presets"
                  >
                    TE Prem+
                  </button>
                </div>
              </div>

              {/* Slider for PPR weight */}
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Point Per Reception (PPR)</span>
                  <span className="text-xs font-mono font-bold text-teal-400">{scoringSettings.ppr} pts</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={scoringSettings.ppr}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setScoringSettings(prev => ({ ...prev, ppr: val }));
                    setSettings(prev => ({ ...prev, scoring: val > 0.1 ? 'PPR' : 'STD' }));
                  }}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <span className="text-[10px] text-slate-500">
                  Calculates actual projected value over replacement based on customized reception weights.
                </span>
              </div>

              {/* Slider / Select for Passing TDs */}
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Passing Touchdown (TD)</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{scoringSettings.passingTd} pts</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 rounded-lg p-1 h-9">
                  {[4, 5, 6].map(val => (
                    <button
                      key={val}
                      onClick={() => setScoringSettings(prev => ({ ...prev, passingTd: Number(val) }))}
                      className={`flex-1 h-full text-xxs font-mono font-bold rounded transition-all ${
                        scoringSettings.passingTd === val
                          ? 'bg-slate-800 text-emerald-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {val} PTS
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500">
                  4-pt TD boosts mobile rushing QBs. 6-pt TD shifts weight heavily to pure pocket passers.
                </span>
              </div>

              {/* Interceptions */}
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Passing Interception (INT)</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{scoringSettings.interception} pts</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 rounded-lg p-1 h-9">
                  {[-1, -2, -3].map(val => (
                    <button
                      key={val}
                      onClick={() => setScoringSettings(prev => ({ ...prev, interception: Number(val) }))}
                      className={`flex-1 h-full text-xxs font-mono font-bold rounded transition-all ${
                        scoringSettings.interception === val
                          ? 'bg-slate-800 text-rose-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {val} PTS
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500">
                  Penalty per passing interception. Instantly recalculates VORP rankings on-the-fly.
                </span>
              </div>

              {/* Toggle Advanced Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedScoring(!showAdvancedScoring)}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 text-xxs font-bold uppercase tracking-wider text-teal-400 transition-all select-none cursor-pointer"
              >
                <span className="flex items-center gap-1.5">⚙️ Advanced Bracket &amp; Game Yardage Bonuses</span>
                <span>{showAdvancedScoring ? "Hide ▲" : "Expand ▼"}</span>
              </button>

              {/* Advanced Scoring Settings Accordion */}
              {showAdvancedScoring && (
                <div className="flex flex-col gap-3.5 border-t border-slate-800/80 pt-3.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  
                  {/* TE Premium slider */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Tight End Premium (TEP)</span>
                      <span className="font-mono font-bold text-amber-400">+{scoringSettings.tePremium || 0.0} PPR</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.25"
                      value={scoringSettings.tePremium || 0.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setScoringSettings(prev => ({ ...prev, tePremium: val }));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[9px] text-slate-500 leading-normal">
                      Adds extra points per reception ONLY to Tight Ends (e.g. +0.5 adds 0.5pts, making reception 1.5 total for TEs). Very popular in modern high-stakes leagues.
                    </span>
                  </div>

                  {/* 300yd Passing game Bonus slider */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">300+ Passing Yards Game Bonus</span>
                      <span className="font-mono font-bold text-teal-400">+{scoringSettings.passingBonus300 || 0} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={scoringSettings.passingBonus300 || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setScoringSettings(prev => ({ ...prev, passingBonus300: val }));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <span className="text-[9px] text-slate-500 leading-normal">
                      Award bonus points when a quarterback hits the 300-yard passing threshold.
                    </span>
                  </div>

                  {/* 100yd Rushing bonus slider */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">100+ Rushing Yards Game Bonus</span>
                      <span className="font-mono font-bold text-emerald-400">+{scoringSettings.rushingBonus100 || 0} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={scoringSettings.rushingBonus100 || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setScoringSettings(prev => ({ ...prev, rushingBonus100: val }));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* 100yd Receiving bonus slider */}
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">100+ Receiving Yards Game Bonus</span>
                      <span className="font-mono font-bold text-cyan-400">+{scoringSettings.receivingBonus100 || 0} pts</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={scoringSettings.receivingBonus100 || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setScoringSettings(prev => ({ ...prev, receivingBonus100: val }));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* Custom Touchdown scoring (Rushing TD / Receiving TD) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rushing TD Weight</span>
                      <div className="flex items-center gap-1">
                        {[4, 6, 8].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setScoringSettings(prev => ({ ...prev, rushingTd: Number(val) }))}
                            className={`flex-1 py-1.5 text-xxs font-mono font-bold rounded border transition-all ${
                              (scoringSettings.rushingTd || 6.0) === val
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-900/40 text-slate-500 border-slate-850 hover:text-slate-300'
                            }`}
                          >
                            {val} PTS
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-slate-850 bg-slate-950/25">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receiving TD Weight</span>
                      <div className="flex items-center gap-1">
                        {[4, 6, 8].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setScoringSettings(prev => ({ ...prev, receivingTd: Number(val) }))}
                            className={`flex-1 py-1.5 text-xxs font-mono font-bold rounded border transition-all ${
                              (scoringSettings.receivingTd || 6.0) === val
                                ? 'bg-slate-800 text-cyan-400 border-cyan-500/30'
                                : 'bg-slate-900/40 text-slate-500 border-slate-850 hover:text-slate-300'
                            }`}
                          >
                            {val} PTS
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            <button
              onClick={() => setShowScoringModal(false)}
              className="mt-2 rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-md"
            >
              Apply Live Settings &amp; Re-Project Board
            </button>

          </div>
        </div>
      )}

      {/* DRAFT RECAP MODAL */}
      {showDraftRecap && draftRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" id="draft-recap-modal">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-teal-400" />
                Draft Recap
              </h3>
              <button 
                onClick={() => { setShowDraftRecap(false); setRecapDismissed(true); }}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Grade banner */}
            <div className={`rounded-xl border p-4 flex items-center gap-4 ${
              draftRecap.grade >= 85 ? 'border-emerald-500/30 bg-emerald-950/20' :
              draftRecap.grade >= 70 ? 'border-teal-500/30 bg-teal-950/20' :
              draftRecap.grade >= 55 ? 'border-amber-500/30 bg-amber-950/20' :
              'border-rose-500/30 bg-rose-950/20'
            }`}>
              <div className={`h-16 w-16 shrink-0 rounded-full border-4 flex items-center justify-center font-mono text-2xl font-black ${
                draftRecap.grade >= 85 ? 'border-emerald-500/60 text-emerald-400' :
                draftRecap.grade >= 70 ? 'border-teal-500/60 text-teal-400' :
                draftRecap.grade >= 55 ? 'border-amber-500/60 text-amber-400' :
                'border-rose-500/60 text-rose-400'
              }`}>
                {draftRecap.grade}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Roster Grade</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {draftRecap.grade >= 85 ? 'Elite draft — your projected starters stack up with the best possible lineup.' :
                   draftRecap.grade >= 70 ? 'Solid draft — your starters are close to the ideal lineup.' :
                   draftRecap.grade >= 55 ? 'Average draft — a few gaps, but workable with smart pickups.' :
                   'Tough draft — consider a reset or rethink your pick strategy.'}
                </p>
                <p className="text-[10px] font-mono text-slate-500 mt-1.5">
                  Projected starting lineup: <strong className="text-teal-400">{draftRecap.projectedTotal.toFixed(1)}</strong> pts
                </p>
              </div>
            </div>

            {/* Starting lineup */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold font-mono text-teal-400 uppercase tracking-wider">Projected Starters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {draftRecap.starters.map(s => {
                  const posColors = {
                    QB: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                    RB: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    WR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    TE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    K: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    DST: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                    FLEX: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                  } as any;
                  return (
                    <div key={s.slot} className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/40 p-2">
                      <span className={`inline-flex h-6 w-9 shrink-0 items-center justify-center rounded border text-[9px] font-bold font-mono ${posColors[s.slot as keyof typeof posColors] || posColors[s.player.position]}`}>
                        {s.slot === 'FLEX' ? 'FLEX' : s.player.position}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-100 truncate">{s.player.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{s.player.team} • {getPlayerProjectedPoints(s.player).toFixed(1)} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-slate-500">+ {draftRecap.bench.length} bench player{draftRecap.bench.length === 1 ? '' : 's'}</p>
            </div>

            {/* Best value */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">Best Value Picks</h4>
              <div className="flex flex-col gap-1.5">
                {draftRecap.bestValue.filter(bv => bv.diff > 0).map(bv => (
                  <div key={bv.player.id} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{bv.player.name} <span className="text-slate-500 font-mono text-[10px]">({bv.player.position})</span></span>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">ADP {bv.player.manualAdpOverride ?? bv.player.adp} → picked {bv.player.draftPickNumber} (steal)</span>
                  </div>
                ))}
                {draftRecap.bestValue.filter(bv => bv.diff > 0).length === 0 && (
                  <p className="text-[10px] font-mono text-slate-500">No obvious steals — you drafted close to market value.</p>
                )}
              </div>
            </div>

            {/* Reaches */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">Reaches</h4>
              <div className="flex flex-col gap-1.5">
                {draftRecap.reaches.filter(r => r.diff < 0).map(r => (
                  <div key={r.player.id} className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/20 bg-rose-950/10 p-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{r.player.name} <span className="text-slate-500 font-mono text-[10px]">({r.player.position})</span></span>
                    <span className="text-[10px] font-mono text-rose-400 shrink-0">ADP {r.player.manualAdpOverride ?? r.player.adp} → picked {r.player.draftPickNumber} (reach)</span>
                  </div>
                ))}
                {draftRecap.reaches.filter(r => r.diff < 0).length === 0 && (
                  <p className="text-[10px] font-mono text-slate-500">No reaches — you waited for good value all draft.</p>
                )}
              </div>
            </div>

            <button
              onClick={() => { setShowDraftRecap(false); setRecapDismissed(true); }}
              className="rounded-lg bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-md"
            >
              Close Recap
            </button>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-center">
        <p className="text-xxs text-slate-600 font-mono">
          FIRE © 2026 • DRAFT WORKSPACE
        </p>
      </footer>
      </>
      )}
    </div>
  );
}
