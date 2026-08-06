import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnalysisReport from './components/AnalysisReport';
import DiagnosticLoader from './components/DiagnosticLoader';
import { PlayerInput, FilterResult, DraftPlayer, DraftSettings, DraftHistoryItem } from './types';
import { INITIAL_DRAFT_PLAYERS } from './data';
import { getFullPlayerPool, assignTiers } from './additionalPlayers';
import { 
  Activity, Sliders, ChevronRight, AlertCircle, 
  X, Info, Database, BarChart3, TrendingDown, Target,
  Clock, Play, Pause, RotateCcw, Search, UserPlus,
  Sparkles, CheckCircle2, User, Users, ChevronDown, ListFilter,
  PlusCircle, Undo2, AlertTriangle, Trash2, Settings, Calendar
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

  // Sleeper Sync State
  const [sleeperDraftId, setSleeperDraftId] = useState<string>(() => {
    try {
      return localStorage.getItem('sleeperDraftId') || '';
    } catch {
      return '';
    }
  });
  const [sleeperLeagueId, setSleeperLeagueId] = useState<string>(() => {
    try {
      return localStorage.getItem('sleeperLeagueId') || '';
    } catch {
      return '';
    }
  });
  const [isSleeperSyncing, setIsSleeperSyncing] = useState<boolean>(false);
  const [isPublicSleeperAdpLoading, setIsPublicSleeperAdpLoading] = useState<boolean>(false);
  const [sleeperError, setSleeperError] = useState<string | null>(null);
  const [isLivePolling, setIsLivePolling] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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
  
  // Help Onboarding Guide & Glossary Definition Board state
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('showHelpGuide');
      return saved === 'true'; // Default is false now, only open if explicitly saved as 'true'
    } catch {
      return false;
    }
  });

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(true);

  // Sleeper Sync Accordion State
  const [isSleeperSyncOpen, setIsSleeperSyncOpen] = useState<boolean>(false);

  // Personal Edge Accordion State
  const [showPersonalEdgePanel, setShowPersonalEdgePanel] = useState<boolean>(false);
  const [enablePersonalEdge, setEnablePersonalEdge] = useState<boolean>(true);

  // Core backup handcuff mapping for high-value running backs
  const [activeMainTab, setActiveMainTab] = useState<'players' | 'board' | 'advanced'>('players');

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
  const [draftHistory, setDraftHistory] = useState<DraftHistoryItem[]>([]);
  const [rosterSubView, setRosterSubView] = useState<'positions' | 'lineup'>('positions');

  // AI Hype Filter API state
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

  // Sleeper Sync handlers & effect
  const syncSleeperDraftPicks = async (draftId: string, showLoading = true, showAlert = true) => {
    if (!draftId) return;
    if (showLoading) setIsSleeperSyncing(true);
    setSleeperError(null);

    try {
      const draftRes = await fetch(`/api/sleeper/draft/${draftId}`);
      if (!draftRes.ok) throw new Error('Could not find a Sleeper draft with that ID.');
      const draftData = await draftRes.json();
      
      const totalTeamsFromSleeper = Number(draftData.teams) || settings.totalTeams;
      const scoringType = draftData.metadata?.scoring_type === 'std' ? 'STD' : 'PPR';
      
      setSettings(prev => ({
        ...prev,
        totalTeams: totalTeamsFromSleeper,
        scoring: scoringType
      }));

      // Fetch picks if we want to use pick order as custom ranking order / ADP
      const picksRes = await fetch(`/api/sleeper/draft/${draftId}/picks`);
      let picksData = [];
      if (picksRes.ok) {
        picksData = await picksRes.json();
      }

      setPlayers((currentPlayers) => {
        // We will adjust ADPs based on Sleeper picks if there are any
        let basePlayers = currentPlayers.map(p => ({
          ...p,
          // We preserve the manual draft status of the user so they do not lose progress in Yahoo
        }));

        if (picksData && picksData.length > 0) {
          picksData.forEach((pick: any) => {
            const rawPos = pick.metadata?.position || 'RB';
            const normalizedPos = rawPos === 'DEF' ? 'DST' : rawPos;
            const fullName = `${pick.metadata?.first_name || ''} ${pick.metadata?.last_name || ''}`.trim() || `Player ${pick.player_id}`;
            
            // Update player's ADP to match the pick number from Sleeper
            const foundIdx = basePlayers.findIndex(p => 
              p.name.toLowerCase() === fullName.toLowerCase() && p.position === normalizedPos
            );
            if (foundIdx !== -1) {
              basePlayers[foundIdx] = {
                ...basePlayers[foundIdx],
                adp: pick.pick_no
              };
            } else {
              // Add player as they might be a very deep sleeper not in the pool yet
              basePlayers.push({
                id: `sleeper_add_${pick.player_id}`,
                name: fullName,
                team: pick.metadata?.team || 'FA',
                position: normalizedPos as any,
                byeWeek: 9,
                adp: pick.pick_no,
                projectedPointsStd: 80,
                projectedPointsPpr: 100,
                isDrafted: false,
                rawMetrics: 'Sleeper live-synced athlete profile.',
                coachingChanges: 'System stats derived from Sleeper board sync.',
                recentNews: 'Synced via Sleeper API during active draft.'
              });
            }
          });
        }

        // Re-calculate tiers using the new ADPs
        return assignTiers(basePlayers);
      });

      setLastSyncTime(new Date().toLocaleTimeString());
      if (showAlert) {
        alert('Sleeper settings, player rankings, and tiers successfully synchronized! Manual draft tracking is fully active.');
      }
    } catch (err: any) {
      console.error(err);
      setSleeperError(err.message || 'An error occurred during Sleeper integration.');
    } finally {
      if (showLoading) setIsSleeperSyncing(false);
    }
  };

  // Persist Sleeper Draft ID and League ID changes to localStorage
  useEffect(() => {
    try {
      if (sleeperDraftId) {
        localStorage.setItem('sleeperDraftId', sleeperDraftId);
      } else {
        localStorage.removeItem('sleeperDraftId');
      }
    } catch (e) {
      console.warn('Failed to set sleeperDraftId in localStorage:', e);
    }
  }, [sleeperDraftId]);

  useEffect(() => {
    try {
      if (sleeperLeagueId) {
        localStorage.setItem('sleeperLeagueId', sleeperLeagueId);
      } else {
        localStorage.removeItem('sleeperLeagueId');
      }
    } catch (e) {
      console.warn('Failed to set sleeperLeagueId in localStorage:', e);
    }
  }, [sleeperLeagueId]);

  // Startup Auto-Sync: if a saved draft ID exists on mount, auto-trigger a background sync
  useEffect(() => {
    try {
      const savedDraftId = localStorage.getItem('sleeperDraftId');
      if (savedDraftId) {
        // Run silent sync on start (shows loading state but suppresses intrusive modal popups)
        syncSleeperDraftPicks(savedDraftId, true, false);
      }
    } catch (e) {
      console.warn('Sleeper startup auto-sync blocked:', e);
    }
  }, []);

  const handleResolveLeagueId = async () => {
    if (!sleeperLeagueId) return;
    setIsSleeperSyncing(true);
    setSleeperError(null);
    try {
      const res = await fetch(`/api/sleeper/league/${sleeperLeagueId}/drafts`);
      if (!res.ok) throw new Error('Could not find any drafts associated with this League ID.');
      const drafts = await res.json();
      if (Array.isArray(drafts) && drafts.length > 0) {
        const activeDraft = drafts[0];
        setSleeperDraftId(activeDraft.draft_id);
        await syncSleeperDraftPicks(activeDraft.draft_id, true);
      } else {
        throw new Error('No draft boards found for this league.');
      }
    } catch (err: any) {
      console.error(err);
      setSleeperError(err.message || 'Failed to resolve league ID.');
    } finally {
      setIsSleeperSyncing(false);
    }
  };

  const handleFetchPublicSleeperAdp = async () => {
    setIsPublicSleeperAdpLoading(true);
    setSleeperError(null);
    try {
      const res = await fetch('/api/sleeper/public-adp');
      if (!res.ok) throw new Error('Could not calculate public Sleeper ADP.');
      const data = await res.json();
      if (data.success && data.adpMap) {
        const adpMap = data.adpMap;
        let updateCount = 0;
        setPlayers((currentPlayers) => {
          const updated = currentPlayers.map((p) => {
            const key = `${p.name.toLowerCase().trim()}_${p.position}`;
            if (adpMap[key] !== undefined) {
              updateCount++;
              return {
                ...p,
                adp: adpMap[key],
              };
            }
            return p;
          });
          return assignTiers(updated);
        });
        setLastSyncTime(new Date().toLocaleTimeString());
        alert(`Successfully calculated live ADP from ${data.draftsSynced} active Sleeper public drafts! Updated ADPs for ${updateCount} players on your board.`);
      } else {
        throw new Error('Sleeper ADP mapping data was empty or invalid.');
      }
    } catch (err: any) {
      console.error(err);
      setSleeperError(err.message || 'Failed to fetch free public Sleeper ADP.');
    } finally {
      setIsPublicSleeperAdpLoading(false);
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    if (isLivePolling && sleeperDraftId) {
      pollInterval = setInterval(() => {
        syncSleeperDraftPicks(sleeperDraftId, false);
      }, 5000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isLivePolling, sleeperDraftId, settings.userPickNumber, settings.totalTeams]);

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

  // Simulate CPU draft picks up to the user's turn
  const simulateCpuPicksUpToUser = (startPick: number, slot: number, totalTeams: number) => {
    setPlayers((currentPlayers) => {
      let tempPlayers = [...currentPlayers];
      let historyAddition: DraftHistoryItem[] = [];
      let pickNo = startPick;

      while (!isUserPick(pickNo, slot, totalTeams) && pickNo <= totalTeams * 15) {
        const available = tempPlayers
          .filter(p => !p.isDrafted)
          .sort((a, b) => (a.manualAdpOverride ?? a.adp ?? 999) - (b.manualAdpOverride ?? b.adp ?? 999));
        
        if (available.length === 0) break;

        // Choose from the top 3 available to simulate real draft variability
        const poolSize = Math.min(3, available.length);
        const randomIndex = Math.floor(Math.random() * poolSize);
        const chosen = available[randomIndex];

        const chosenIdx = tempPlayers.findIndex(p => p.id === chosen.id);
        if (chosenIdx !== -1) {
          tempPlayers[chosenIdx] = {
            ...tempPlayers[chosenIdx],
            isDrafted: true,
            draftedBy: 'opponent',
            draftPickNumber: pickNo,
          };

          historyAddition.push({
            pickNumber: pickNo,
            playerId: chosen.id,
            playerName: chosen.name,
            position: chosen.position,
            team: chosen.team,
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

  // Run Hype Filter analysis with Gemini
  const handleRunAiAnalysis = async (player: DraftPlayer) => {
    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: player.name,
          team: player.team,
          position: player.position,
          rawMetrics: player.rawMetrics || 'No prior stats provided.',
          coachingChanges: player.coachingChanges || 'Standard coaching scheme.',
          recentNews: player.recentNews || 'Standard off-season routine.'
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const analyzedResult = await response.json();
      
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
      setAiError(err.message || 'The narrative-stripping protocol failed to parse these metrics.');
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

  // Stats Counters
  const undraftedCount = players.filter(p => !p.isDrafted).length;
  const userDraftedCount = players.filter(p => p.isDrafted && p.draftedBy === 'user').length;
  const qbLeft = players.filter(p => p.position === 'QB' && !p.isDrafted).length;
  const rbLeft = players.filter(p => p.position === 'RB' && !p.isDrafted).length;
  const wrLeft = players.filter(p => p.position === 'WR' && !p.isDrafted).length;
  const teLeft = players.filter(p => p.position === 'TE' && !p.isDrafted).length;
  const kLeft = players.filter(p => p.position === 'K' && !p.isDrafted).length;
  const dstLeft = players.filter(p => p.position === 'DST' && !p.isDrafted).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden max-w-full">
      <Header />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6" id="draft-assistant-main">
        
        {/* HELP / GETTING STARTED BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/10 border border-slate-800 rounded-xl p-4 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="text-xs text-slate-300 font-sans font-medium">
              First time drafting? Need a quick refresher on VORP, PPR scoring, or live Sleeper syncs?
            </span>
          </div>
          <button
            onClick={() => {
              const nextState = !showHelpGuide;
              setShowHelpGuide(nextState);
              try {
                localStorage.setItem('showHelpGuide', String(nextState));
              } catch {}
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md select-none border ${
              showHelpGuide 
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" 
                : "bg-teal-500 border-teal-400 text-slate-950 font-extrabold hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <Info className="h-4 w-4" />
            <span>{showHelpGuide ? "Close Draft Guide" : "How to Start & Glossary"}</span>
          </button>
        </div>

        {/* DETAILED ONBOARDING GUIDE & GLOSSARY BOARD */}
        {showHelpGuide && (
          <div className="relative border border-slate-800 bg-slate-900/30 rounded-2xl p-5 md:p-6 overflow-hidden transition-all shadow-xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-teal-400">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-base font-bold text-white font-sans">
                    NFL Fantasy Hype Filter — Onboarding & Analytical Manual
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-4xl">
                  This assistant strips out emotional hype, media chatter, and training camp rumors. By processing raw targets, route shares, and historical positional baselines, it calculates a real-time **Value Over Replacement Player (VORP)** value index to optimize your draft selections in real time.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHelpGuide(false);
                  try {
                    localStorage.setItem('showHelpGuide', 'false');
                  } catch {}
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                title="Hide guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Getting Started Guide */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                  🚀 Step-by-Step Onboarding Guide
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-500/10 font-bold text-teal-400 font-mono">1</span>
                    <p className="text-slate-300 leading-normal">
                      <strong className="text-white">Adjust Settings First:</strong> Go to the <span className="text-teal-400 font-semibold">Draft Setup</span> panel. Select your snake draft slot (e.g., 5th overall) and total league teams to set accurate baselines.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-500/10 font-bold text-teal-400 font-mono">2</span>
                    <p className="text-slate-300 leading-normal">
                      <strong className="text-white">Configure Scoring Formats:</strong> Select between PPR, Half-PPR, or Standard. Click <span className="text-teal-400 font-semibold">Scoring</span> to modify custom passing or interception rules, recalculating projected points instantly.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-500/10 font-bold text-teal-400 font-mono">3</span>
                    <p className="text-slate-300 leading-normal">
                      <strong className="text-white">Sync Live Board:</strong> Expand the <span className="text-indigo-400 font-semibold">Sleeper Sync</span> panel, paste your League ID/Draft ID, and load your draft. Once saved, it will <strong className="text-white">auto-refresh silently in the background</strong> upon opening the app.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-teal-500/10 font-bold text-teal-400 font-mono">4</span>
                    <p className="text-slate-300 leading-normal">
                      <strong className="text-white">Draft Track & Simulate:</strong> Press <span className="text-emerald-400 font-semibold">Mine</span> to add players to your team, or <span className="text-rose-400 font-semibold">Opponent</span>. Or trigger <span className="text-amber-400 font-semibold">Mock Draft mode</span> to let automatic CPU engines run picks up to your turn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Glossary Definitions Board */}
              <div className="space-y-3.5 border-t border-slate-800/50 pt-5 md:border-t-0 md:pt-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
                  🧠 Clinical Metrics & Fantasy Glossary
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3">
                    <span className="text-xs font-bold text-teal-400 block font-mono">VORP / VOR</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Value Over Replacement</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Calculates how many more points an athlete scores compared to a baseline "replacement-level" option at their same position. High VORP indicates critical roster equity.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">PPR Scoring</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Points Per Reception</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      A league scoring system awarding 1 point per catch. Elevates target-heavy wide receivers and pass-catching backfield weapons above standard ground rushers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3">
                    <span className="text-xs font-bold text-cyan-400 block font-mono">ADP Rank</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Average Draft Position</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      The consensus draft placement across active mock environments. Contrasting ADP with our math uncovers immense values and overhyped media trap picks.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3">
                    <span className="text-xs font-bold text-rose-400 block font-mono">Hype Index Diagnostic</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Overhype Protection</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Flags players whose ADP is extremely inflated relative to their objective clinical VORP projection (e.g. pre-season coach praise without backing stats).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOP COUNTERS & TIMER SUB-BAR */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6" id="stats-dashboard">
          
          {/* Counters Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 min-[420px]:grid-cols-4 gap-2 md:grid-cols-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">Available</span>
              <span className="text-base font-bold text-teal-400 font-mono">{undraftedCount}</span>
            </div>
            
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">My Squad</span>
              <span className="text-base font-bold text-white font-mono">{userDraftedCount}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">QB Left</span>
              <span className="text-base font-bold text-indigo-400 font-mono">{qbLeft}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">RB Left</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{rbLeft}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">WR Left</span>
              <span className="text-base font-bold text-cyan-400 font-mono">{wrLeft}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">TE Left</span>
              <span className="text-base font-bold text-amber-400 font-mono">{teLeft}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">K Left</span>
              <span className="text-base font-bold text-rose-400 font-mono">{kLeft}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">DST Left</span>
              <span className="text-base font-bold text-teal-400 font-mono">{dstLeft}</span>
            </div>
          </div>

          {/* Clock controls (Col-span 2) */}
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
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

            {/* Reset Board Button next to clock */}
            <button
              onClick={handleResetDraft}
              className="flex h-[58px] px-3.5 items-center justify-center gap-1.5 rounded-xl border border-rose-950 bg-rose-950/10 text-rose-400 hover:bg-rose-950/20 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors shrink-0"
              title="Reset entire draft board"
            >
              Reset
            </button>
          </div>

        </div>

        {/* DRAFT ROUND & SELECTION STATUS BAR */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 flex flex-col gap-4 shadow-xl" id="draft-round-progress-status-bar">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Round & Pick Prominent Display */}
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center shadow-lg min-w-[110px]">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Round</span>
                <span className="text-3xl font-black text-teal-400 font-mono leading-none">{currentRound}</span>
                <span className="block text-[9px] font-mono text-slate-600 mt-1">of 15 Rounds</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center shadow-lg min-w-[110px]">
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Pick</span>
                <span className="text-3xl font-black text-white font-mono leading-none">{currentPick}</span>
                <span className="block text-[9px] font-mono text-slate-600 mt-1">Pick #{(currentPick - 1) % settings.totalTeams + 1} in Rd</span>
              </div>

              <div className="hidden sm:flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <span>Snake Flow:</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    currentRound % 2 === 0 
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' 
                      : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {currentRound % 2 === 0 ? '← Reverse order (12 to 1)' : '→ Standard order (1 to 12)'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Draft Slot: Pick #{settings.userPickNumber} of {settings.totalTeams} Teams
                </p>
              </div>
            </div>

            {/* Who is Drafting Now & Next */}
            <div className="flex-1 md:max-w-md bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Turn</span>
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
              </div>
              <div className="flex items-center justify-between">
                {isUserPick(currentPick, settings.userPickNumber, settings.totalTeams) ? (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-sm font-black text-emerald-400 uppercase tracking-wide">👉 YOUR TURN TO PICK!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold">
                      {((currentPick - 1) % settings.totalTeams) + 1}
                    </div>
                    <span className="text-xs font-medium text-slate-300">
                      Team #{((currentPick - 1) % settings.totalTeams) + 1} is on the clock
                    </span>
                  </div>
                )}
                
                {/* Visual indicator of how many picks until the User's next pick */}
                {(() => {
                  if (isUserPick(currentPick, settings.userPickNumber, settings.totalTeams)) {
                    return (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Draft Now
                      </span>
                    );
                  }
                  
                  // Calculate next user pick overall
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
                      <span className="text-[10px] font-mono text-slate-400">
                        Your pick in <strong className="text-teal-400">{diff} {diff === 1 ? 'pick' : 'picks'}</strong> (Pick #{nextUserPick})
                      </span>
                    );
                  }
                  return <span className="text-[10px] font-mono text-slate-500">Draft Finished</span>;
                })()}
              </div>
            </div>

          </div>

          {/* Visual Round Progress Grid (15 Dots, representing each Round) */}
          <div className="border-t border-slate-900 pt-3">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1.5 px-0.5">
              <span>Draft Timeline (15 Rounds)</span>
              <span className="text-slate-400">Round {currentRound} Active</span>
            </div>
            <div className="grid gap-1 md:gap-1.5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((roundNum) => {
                const isCurrent = roundNum === currentRound;
                const isPast = roundNum < currentRound;
                
                // Calculate user's overall pick number in this round
                const isRoundEven = roundNum % 2 === 0;
                const userPickInThisRound = isRoundEven 
                  ? (settings.totalTeams - settings.userPickNumber + 1) 
                  : settings.userPickNumber;
                const userOverallPick = (roundNum - 1) * settings.totalTeams + userPickInThisRound;

                // Has user drafted in this round?
                const isDraftedInThisRound = players.some(p => p.isDrafted && p.draftedBy === 'user' && p.draftPickNumber && Math.floor((p.draftPickNumber - 1) / settings.totalTeams) + 1 === roundNum);

                return (
                  <div key={roundNum} className="relative group">
                    <div 
                      className={`h-2.5 rounded-md transition-all ${
                        isCurrent 
                          ? 'bg-teal-400 shadow-md shadow-teal-500/20 ring-2 ring-teal-500/30' 
                          : isPast 
                          ? isDraftedInThisRound
                            ? 'bg-emerald-600/70 border border-emerald-500/20'
                            : 'bg-slate-800'
                          : 'bg-slate-900/60 border border-slate-850'
                      }`}
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none min-w-[120px] animate-fade-in">
                      <div className="bg-slate-900 border border-slate-800 text-slate-200 text-[9px] font-mono rounded px-2 py-1.5 shadow-xl text-center">
                        <div className="font-bold text-white mb-0.5">Round {roundNum}</div>
                        <div className="text-slate-400">Your pick: #{userOverallPick}</div>
                        {isCurrent && <div className="text-teal-400 font-bold mt-0.5">⭐ Current Round</div>}
                        {isPast && (
                          <div className="text-slate-500 mt-0.5">
                            {isDraftedInThisRound ? '✅ Selected' : 'Completed'}
                          </div>
                        )}
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-800 transform rotate-45 -mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WORKSPACE DIVIDER GRID */}
        <div className="grid gap-6 lg:grid-cols-12 items-start w-full max-w-full overflow-hidden">
          
          {/* LEFT SIDE: THE DRAFT BOARD (span 7 in lg) */}
          <div className="lg:col-span-7 min-w-0 w-full flex flex-col gap-4 bg-slate-900/30 border border-slate-900 rounded-xl p-3.5 sm:p-5 overflow-hidden" id="draft-board-panel">
            
            {/* WORKSPACE NAVIGATION TABS */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveMainTab('players')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainTab === 'players'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-300 border border-slate-800'
                }`}
              >
                <ListFilter className="h-4 w-4" />
                Player Pool
              </button>
              <button
                onClick={() => setActiveMainTab('board')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMainTab === 'board'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-300 border border-slate-800'
                }`}
              >
                <Database className="h-4 w-4" />
                Draft Board Grid
              </button>
              <button
                onClick={() => setActiveMainTab('advanced')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ml-auto flex items-center gap-1.5 ${
                  activeMainTab === 'advanced'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                    : 'bg-transparent text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced Tools</span>
              </button>
            </div>

            {activeMainTab === 'advanced' && (
              <div className="animate-fade-in flex flex-col gap-4">
                {/* DRAFT SETUP AND SYNC HUB */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-4 shadow-inner" id="draft-settings-and-sync-hub">
                  <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 border-b border-slate-800/60 pb-2">
                    <Settings className="h-4 w-4" />
                    League Configuration & Integrations
                  </h3>
                  
                  {/* Draft Slot & Teams Config */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          handleStartMockDraft(5, 12);
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
                      <span>Sleeper Sync Integration</span>
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
                        <span className="block text-xs font-bold text-white">Free Public Sleeper ADP</span>
                        <span className="block text-[10px] text-slate-400 leading-normal">
                          Queries active redraft boards on Sleeper and averages player draft ranks. No login or League ID needed!
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

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Draft ID */}
                    <div className="flex items-center justify-between gap-2 border border-slate-800/80 bg-slate-950 px-2.5 py-1.5 rounded-lg">
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">Draft ID:</span>
                      <input
                        type="text"
                        placeholder="e.g. 1118151322045583360"
                        value={sleeperDraftId}
                        onChange={(e) => setSleeperDraftId(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-0 px-1 text-xs font-mono text-slate-300 outline-none focus:ring-0 placeholder-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => syncSleeperDraftPicks(sleeperDraftId)}
                        disabled={isSleeperSyncing || !sleeperDraftId}
                        className="rounded bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/20 px-2.5 py-1 text-xxs font-semibold text-indigo-300 transition-colors disabled:opacity-30"
                      >
                        {isSleeperSyncing ? '...' : 'Sync'}
                      </button>
                    </div>

                    {/* League ID */}
                    <div className="flex items-center justify-between gap-2 border border-slate-800/80 bg-slate-950 px-2.5 py-1.5 rounded-lg">
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">League ID:</span>
                      <input
                        type="text"
                        placeholder="e.g. 1115509174987722752"
                        value={sleeperLeagueId}
                        onChange={(e) => setSleeperLeagueId(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-0 px-1 text-xs font-mono text-slate-300 outline-none focus:ring-0 placeholder-slate-700"
                      />
                      <button
                        type="button"
                        onClick={handleResolveLeagueId}
                        disabled={isSleeperSyncing || !sleeperLeagueId}
                        className="rounded bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/20 px-2.5 py-1 text-xxs font-semibold text-indigo-300 transition-colors disabled:opacity-30"
                      >
                        {isSleeperSyncing ? '...' : 'Load'}
                      </button>
                    </div>
                  </div>

                  {sleeperError && (
                    <div className="rounded border border-rose-500/10 bg-rose-500/5 p-1.5 text-center text-[9px] text-rose-400 font-mono">
                      Error: {sleeperError}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-900 pt-2 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${isLivePolling ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span>{isLivePolling ? 'Auto-polling board (5s)' : 'Manual sync mode'}</span>
                    </div>
                    {sleeperDraftId && (
                      <button
                        onClick={() => setIsLivePolling(!isLivePolling)}
                        className={`px-2 py-0.5 rounded border ${
                          isLivePolling
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {isLivePolling ? 'Disable Polling' : 'Enable Polling'}
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                          Targets represent pure opportunity. Receivers who earn heavy target volume are mathematically proven to deliver a much higher fantasy floor, regardless of league news or training camp hype.
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
          )}
            
            {activeMainTab === 'board' && (
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
                                  ? 'bg-teal-900/20 border-teal-500/50 ring-1 ring-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.1)] animate-pulse'
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

            {activeMainTab === 'players' && (
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
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search players or teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-teal-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Scoring toggle & Sort toggle & Add Custom Player */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                  
                  {/* Scoring Standard vs PPR Toggle */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1" title="Select scoring settings">
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, scoring: 'STD' }))}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        settings.scoring === 'STD' 
                          ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      STD
                    </button>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, scoring: 'PPR' }))}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        settings.scoring === 'PPR' 
                          ? 'bg-slate-800 text-teal-400 font-mono shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      PPR
                    </button>
                  </div>

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

              {/* Position filters row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-900 pt-3">
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0 w-full sm:w-auto">
                  {(['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => {
                    const activeStyles = {
                      ALL: 'bg-teal-500/10 border border-teal-500/20 text-teal-400',
                      QB: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400',
                      RB: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
                      WR: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400',
                      TE: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
                      K: 'bg-rose-500/10 border border-rose-500/20 text-rose-400',
                      DST: 'bg-teal-500/10 border border-teal-500/20 text-teal-400',
                    };
                    return (
                      <button
                        key={pos}
                        onClick={() => setActivePositionFilter(pos)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          activePositionFilter === pos
                            ? activeStyles[pos]
                            : 'border border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {pos === 'ALL' ? 'All' : pos}
                      </button>
                    );
                  })}
                </div>

                {/* Show/Hide drafted toggle & View My Squad Shortcut */}
                <div className="flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
                  <button
                    onClick={() => {
                      setActiveRightTab('roster');
                      document.getElementById('right-workspace-panel')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xxs font-semibold rounded border transition-all ${
                      userDraftedCount > 0
                        ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-950/20 shadow-sm shadow-emerald-500/5'
                        : 'border-slate-850 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                    title="Click to view your drafted players by position/lineup"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>My Squad ({userDraftedCount})</span>
                  </button>

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
              </div>

              {/* Tier filters row */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-1 flex-wrap gap-2">
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

          {/* RIGHT SIDE: PROFILE DETAIL PANEL & ROSTER TABS (span 5 in lg) */}
          <div className="lg:col-span-5 min-w-0 w-full flex flex-col gap-4 overflow-hidden" id="right-workspace-panel">
            
             {/* TABS SELECTOR */}
            <div className="flex border-b border-slate-900 bg-slate-900/20 p-1 rounded-xl gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveRightTab('profile')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                  activeRightTab === 'profile'
                    ? 'bg-slate-900 text-teal-400 shadow-sm border-b border-teal-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-500/80" />
                <span className="hidden min-[480px]:inline">Narrative Deflator</span>
                <span className="min-[480px]:hidden">Profile</span>
              </button>
              
              <button
                onClick={() => setActiveRightTab('roster')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                  activeRightTab === 'roster'
                    ? 'bg-slate-900 text-teal-400 shadow-sm border-b border-teal-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500/80" />
                <span className="hidden min-[480px]:inline">My Squad ({userDraftedCount})</span>
                <span className="min-[480px]:hidden">Squad ({userDraftedCount})</span>
              </button>

              <button
                onClick={() => setActiveRightTab('history')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                  activeRightTab === 'history'
                    ? 'bg-slate-900 text-teal-400 shadow-sm border-b border-teal-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Undo2 className="h-3.5 w-3.5 shrink-0 text-teal-500/80" />
                <span className="hidden min-[480px]:inline">Draft Log ({draftHistory.length})</span>
                <span className="min-[480px]:hidden">Log ({draftHistory.length})</span>
              </button>
            </div>

            {/* TAB 1: PLAYER PROFILE DEFLECTION SCREEN */}
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
                    {selectedPlayer.rawMetrics || 'No clinical metrics recorded.'}
                  </p>

                  <div className="grid gap-2 grid-cols-2 text-xxs text-slate-400">
                    <div className="bg-slate-950/40 p-2 rounded">
                      <strong className="text-slate-300 block mb-0.5">System Context:</strong>
                      {selectedPlayer.coachingChanges || 'Standard coaching metrics.'}
                    </div>
                    <div className="bg-slate-950/40 p-2 rounded">
                      <strong className="text-rose-400 block mb-0.5">Narrative Source:</strong>
                      {selectedPlayer.recentNews || 'No media hype records.'}
                    </div>
                  </div>

                  {/* Run / Re-Run Hype Filter Action */}
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
                      {isAiLoading ? 'Scrubbing...' : selectedPlayer.preCachedAnalysis ? 'Re-Analyze with Live AI' : 'Run Hype Filter'}
                    </button>
                  </div>
                </div>

                {/* AI Outputs container */}
                {isAiLoading ? (
                  <DiagnosticLoader />
                ) : aiError ? (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-center flex flex-col gap-2">
                    <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
                    <h4 className="text-xs font-bold text-rose-400">Filtering Error</h4>
                    <p className="text-xxs text-slate-400 font-sans leading-relaxed">{aiError}</p>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">Make sure GEMINI_API_KEY is configured correctly in secrets.</p>
                  </div>
                ) : selectedPlayer.preCachedAnalysis ? (
                  <AnalysisReport result={selectedPlayer.preCachedAnalysis} />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col gap-3 text-slate-500">
                    <Sparkles className="mx-auto h-6 w-6 text-slate-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Hype Filter Report Empty</p>
                      <p className="text-xxs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                        We have not executed the narrative parsing protocol on {selectedPlayer.name} yet. Click <strong className="text-teal-400">"Run Hype Filter"</strong> to deconstruct the media noise.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: MY DRAFTED ROSTER SCREEN */}
            {activeRightTab === 'roster' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 flex flex-col gap-5">
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
                        <span className="text-slate-400 font-sans">Avg Clinical Stability Score:</span>
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

            {/* TAB 3: DRAFT LOG / HISTORY SCREEN */}
            {activeRightTab === 'history' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 flex flex-col gap-4">
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
                <label className="text-xs font-medium text-slate-400">Training Camp Hype Narrative</label>
                <input
                  type="text"
                  placeholder="e.g. 'Looking totally unstoppable and in the best shape of his career.'"
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-center">
        <p className="text-xxs text-slate-600 font-mono">
          FANTASY DRAFT ASSISTANT &amp; CLINICAL HYPE FILTER © 2026 • WORKSPACE PROTOTYPE
        </p>
      </footer>
    </div>
  );
}
