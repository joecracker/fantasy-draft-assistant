import { useState } from 'react';
import { ArrowLeft, Settings, Target, Sparkles, Undo2, Search, Bomb, Users, RotateCcw } from 'lucide-react';
import { DraftPlayer } from '../types';

export interface BoomCoachRec {
  rank: number;
  player: DraftPlayer;
  vorp: number;
  reasons: string[];
}

interface BoomBoomRoomProps {
  players: DraftPlayer[];
  currentPick: number;
  currentRound: number;
  totalTeams: number;
  userPickNumber: number;
  teamNames?: Record<number, string>;
  scoringLabel: string;
  isUserTurn: boolean;
  coachRecommendations: BoomCoachRec[];
  coachAiText: string | null;
  coachAiLoading: boolean;
  hasAiKey: boolean;
  onAskCoachAi: () => void;
  onDraftPlayer: (playerId: string) => void;
  onUndoLastPick: () => void;
  onResetDraft: () => void;
  canUndo: boolean;
  projectedPoints: (p: DraftPlayer) => number;
  onOpenSettings: () => void;
  onBack: () => void;
}

const POS_FILTERS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const;

const posColors: Record<string, string> = {
  QB: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  RB: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  WR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  TE: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  K: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  DST: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

function slotForPick(pickNo: number, totalTeams: number): number {
  const round = Math.floor((pickNo - 1) / totalTeams) + 1;
  const pickInRound = ((pickNo - 1) % totalTeams) + 1;
  return round % 2 === 0 ? totalTeams - pickInRound + 1 : pickInRound;
}

function isUsersPick(pickNo: number, slot: number, totalTeams: number): boolean {
  const round = Math.floor((pickNo - 1) / totalTeams) + 1;
  const pickInRound = ((pickNo - 1) % totalTeams) + 1;
  return round % 2 === 0 ? pickInRound === totalTeams - slot + 1 : pickInRound === slot;
}

export default function BoomBoomRoom({
  players,
  currentPick,
  currentRound,
  totalTeams,
  userPickNumber,
  teamNames,
  scoringLabel,
  isUserTurn,
  coachRecommendations,
  coachAiText,
  coachAiLoading,
  hasAiKey,
  onAskCoachAi,
  onDraftPlayer,
  onUndoLastPick,
  onResetDraft,
  canUndo,
  projectedPoints,
  onOpenSettings,
  onBack,
}: BoomBoomRoomProps) {
  const [posFilter, setPosFilter] = useState<(typeof POS_FILTERS)[number]>('ALL');
  const [search, setSearch] = useState('');
  const [showMyTeam, setShowMyTeam] = useState(true);

  const available = players
    .filter((p) => !p.isDrafted)
    .sort((a, b) => (a.manualAdpOverride ?? a.adp) - (b.manualAdpOverride ?? b.adp));

  const filtered = available.filter((p) => {
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const onClockSlot = slotForPick(currentPick, totalTeams);
  const onClockName = teamNames?.[onClockSlot] || `Team ${onClockSlot}`;

  let nextPickNum = -1;
  let picksUntilYou = -1;
  for (let p = currentPick; p <= totalTeams * 16; p++) {
    if (isUsersPick(p, userPickNumber, totalTeams)) {
      nextPickNum = p;
      picksUntilYou = p - currentPick;
      break;
    }
  }

  const mySquad = players.filter((p) => p.isDrafted && p.draftedBy === 'user');
  const starterTargets: Record<string, number> = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 };
  const posCounts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };
  mySquad.forEach((p) => { posCounts[p.position] += 1; });

  const draftComplete = available.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-black">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(249,115,22,0.10) 0%, var(--fda-glow-end) 70%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400 hover:text-orange-400 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            FIRE
          </button>

          <div className="flex items-center gap-2">
            <Bomb className="h-5 w-5 text-orange-500" />
            <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-white">
              Boom Boom Room
            </h1>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-orange-500/40 hover:text-orange-400 transition-colors cursor-pointer"
            title="Open full settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2 sm:gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Round</span>
              <span className="text-3xl font-black text-orange-400 font-mono leading-none">{currentRound}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Pick #</span>
              <span className="text-3xl font-black text-white font-mono leading-none">{currentPick}</span>
              <span className="block text-[9px] font-mono text-slate-500 mt-1 truncate">{onClockName} on the clock</span>
            </div>
            <div className={`rounded-xl border px-3 py-2 text-center ${isUserTurn ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/60'}`}>
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Your Next Pick</span>
              <span className={`text-3xl font-black font-mono leading-none ${isUserTurn ? 'text-emerald-400 animate-pulse' : 'text-orange-400'}`}>
                {isUserTurn ? 'NOW' : nextPickNum >= 0 ? nextPickNum : '—'}
              </span>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">
                {isUserTurn ? 'you are on the clock' : picksUntilYou > 0 ? `in ${picksUntilYou} ${picksUntilYou === 1 ? 'pick' : 'picks'}` : ''}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-center">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider">Picked</span>
              <span className="text-3xl font-black text-white font-mono leading-none">{mySquad.length}</span>
              <span className="block text-[9px] font-mono text-slate-500 mt-1">players</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowMyTeam((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
                  showMyTeam
                    ? 'border-orange-500/60 bg-orange-500/15 text-orange-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
                title="Toggle your draft squad"
              >
                <Users className="h-4 w-4" />
                My Team ({mySquad.length})
              </button>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                {scoringLabel}
              </span>
            </div>
            <button
              onClick={onUndoLastPick}
              disabled={!canUndo}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
                canUndo
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-slate-800 bg-slate-900/20 text-slate-600 cursor-not-allowed'
              }`}
              title="Take back the most recent pick"
            >
              <Undo2 className="h-4 w-4" />
              Undo Last Pick
            </button>
            <button
              onClick={onResetDraft}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold font-mono uppercase tracking-wider text-rose-300 hover:bg-rose-500/20 transition-colors"
              title="Clear the entire draft board"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          {showMyTeam && (
            <div className="rounded-xl border border-orange-500/30 bg-slate-900/40 p-3.5 flex flex-col gap-3" id="boom-my-team">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  My Squad
                </h4>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  {mySquad.length} picked
                </span>
              </div>

              {posCounts.QB === 0 && currentRound >= 4 && mySquad.length >= 2 && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 animate-pulse">
                  ⚠️ You haven't drafted a quarterback yet!
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {(['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => {
                  const n = posCounts[pos];
                  const need = starterTargets[pos];
                  const short = n < need;
                  return (
                    <div
                      key={pos}
                      className={`rounded-lg border px-2.5 py-1.5 flex flex-col items-center min-w-[58px] ${
                        short
                          ? 'border-rose-500/50 bg-rose-500/10'
                          : n > 0
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/60'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">{pos}</span>
                      <span className="text-sm font-black text-white leading-none mt-0.5">{n}<span className="text-slate-500 text-[10px] font-mono">/{need}</span></span>
                      {short && <span className="text-[9px] font-mono text-rose-400 uppercase leading-tight mt-0.5">need {need - n}</span>}
                    </div>
                  );
                })}
              </div>

              {mySquad.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-2">
                  No one yet — your first pick comes at pick #{userPickNumber}.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {(['QB', 'RB', 'WR', 'TE', 'K', 'DST'] as const).map((pos) => {
                    const squad = mySquad
                      .filter((p) => p.position === pos)
                      .sort((a, b) => (a.draftPickNumber ?? 0) - (b.draftPickNumber ?? 0));
                    if (squad.length === 0) return null;
                    return (
                      <div key={pos} className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{pos} ({squad.length})</span>
                        {squad.map((p) => (
                          <div key={p.id} className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-mono text-[10px] w-8 shrink-0">#{p.draftPickNumber}</span>
                            <span className="font-semibold text-slate-100 truncate">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {coachRecommendations.length > 0 && (
          <div
            className={`rounded-xl border p-3.5 flex flex-col gap-2.5 ${
              isUserTurn
                ? 'border-orange-500/40 bg-orange-950/10 shadow-lg shadow-orange-500/5'
                : 'border-slate-800 bg-slate-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${isUserTurn ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">
                    Pick-Time Coach
                    {isUserTurn && <span className="text-orange-400 ml-1.5">• Your Turn</span>}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block leading-tight">
                    {isUserTurn ? 'Here is who I would take right now.' : 'Top targets for your next pick.'}
                  </span>
                </div>
              </div>
              <button
                onClick={onAskCoachAi}
                disabled={coachAiLoading}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all active:translate-y-px ${
                  hasAiKey
                    ? 'bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 disabled:opacity-50'
                }`}
                title={hasAiKey ? 'One-tap AI read on who to take' : 'Add your free AI key in Settings to unlock this'}
              >
                <Sparkles className="h-3 w-3 animate-pulse" />
                {coachAiLoading ? 'Asking...' : 'Ask AI Coach'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {coachRecommendations.map((rec) => {
                const p = rec.player;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 sm:gap-3 rounded-lg border p-2 ${
                      isUserTurn
                        ? rec.rank === 1
                          ? 'border-orange-500/40 bg-orange-950/20'
                          : 'border-slate-800/70 bg-slate-950/40'
                        : 'border-slate-800/50 bg-slate-950/40'
                    }`}
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center font-mono text-xs font-black border ${rec.rank === 1 ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {rec.rank}
                    </span>
                    <span className={`inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-lg border text-[9px] font-bold font-mono ${posColors[p.position]}`}>
                      {p.position}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {p.name}
                        <span className="text-slate-500 font-mono text-[10px] ml-1.5">{p.team} • ADP {p.manualAdpOverride ?? p.adp}</span>
                      </span>
                      <span className="text-[10px] text-orange-400/80 font-mono leading-tight truncate">
                        {rec.reasons.join(' · ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        VORP <strong className={rec.vorp >= 0 ? 'text-orange-400' : 'text-rose-400'}>{rec.vorp >= 0 ? '+' : ''}{rec.vorp.toFixed(1)}</strong>
                      </span>
                      {isUserTurn && (
                        <button
                          onClick={() => onDraftPlayer(p.id)}
                          className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 px-2.5 py-1 text-xs font-bold transition-all active:translate-y-px"
                        >
                          DRAFT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {coachAiText && (
              <div className="rounded-lg border border-orange-500/20 bg-slate-950/60 p-2.5">
                <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                  <strong className="text-orange-400 font-mono text-[10px] uppercase tracking-wider mr-1.5">Coach AI:</strong>
                  {coachAiText}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {POS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setPosFilter(f)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  posFilter === f
                    ? 'border-orange-500/50 bg-orange-500/15 text-orange-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
            <div className="relative ml-auto min-w-[130px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-orange-500/40"
              />
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {available.length} available
          </div>

          {draftComplete ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <Bomb className="mx-auto h-8 w-8 text-orange-500 mb-2" />
              <div className="text-sm font-bold text-white">Draft Complete!</div>
              <div className="text-xs text-slate-400 mt-1">Every player has been picked.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((p) => {
                const proj = projectedPoints(p);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 sm:gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-2 transition-colors hover:border-slate-700"
                  >
                    <span className={`inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-lg border text-[9px] font-bold font-mono ${posColors[p.position]}`}>
                      {p.position}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {p.name}
                        <span className="text-slate-500 font-mono text-[10px] ml-1.5">{p.team}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 leading-tight">
                        ADP {p.manualAdpOverride ?? p.adp} • Bye {p.byeWeek}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-300 font-mono shrink-0">
                      {proj.toFixed(1)}
                    </span>
                    <button
                      onClick={() => onDraftPlayer(p.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide transition-all shrink-0 active:translate-y-px ${
                        isUserTurn
                          ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400 ring-1 ring-orange-500/40 ring-offset-1 ring-offset-slate-950 animate-pulse'
                          : 'border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      DRAFT
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}