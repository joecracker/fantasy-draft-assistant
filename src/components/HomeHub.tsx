import React from 'react';
import { Flame, Trophy, CalendarRange, ArrowLeftRight, Link2, BookOpen } from 'lucide-react';

// =====================================================================
// HOME HUB / MENU PAGE — FIRE branding
// Four door tiles (Draft Room, Season Hub, Trades, League Sync).
// Draft Room calls `onOpenDraft`. The other three are "coming soon"
// and are dimmed. How To & Glossary calls `onOpenHowTo`.
// =====================================================================

interface HomeHubProps {
  onOpenDraft: () => void;
  onOpenHowTo: () => void;
}

const DOORS = [
  {
    id: 'draft',
    icon: Trophy,
    title: 'Draft Room',
    desc: 'Live draft board, player pool, roster & settings.',
    soon: false,
  },
  {
    id: 'season',
    icon: CalendarRange,
    title: 'Season Hub',
    desc: 'In-season management, trends & matchups.',
    soon: true,
  },
  {
    id: 'trades',
    icon: ArrowLeftRight,
    title: 'Trades',
    desc: 'Trade & waiver advice powered by AI.',
    soon: true,
  },
  {
    id: 'league',
    icon: Link2,
    title: 'League Sync',
    desc: 'Connect and sync your real league.',
    soon: true,
  },
];

export default function HomeHub({ onOpenDraft, onOpenHowTo }: HomeHubProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 lg:p-12 flex flex-col gap-8">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-orange-500/40 bg-orange-500/10 text-orange-400">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            FIRE
          </h1>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-200">
          Welcome to your draft room
        </h2>
        <p className="text-slate-400 text-sm">Pick a door to get started.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {DOORS.map((door) => {
          const Icon = door.icon;
          return (
            <button
              key={door.id}
              type="button"
              onClick={door.id === 'draft' ? onOpenDraft : undefined}
              disabled={door.soon}
              className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-8 min-h-[180px] text-center transition-all cursor-pointer ${
                door.soon
                  ? 'border-slate-800/60 bg-slate-900/20 text-slate-600 opacity-60'
                  : 'border-orange-500/40 bg-slate-900/60 text-white hover:border-orange-400 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-orange-500/10 active:translate-y-px'
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
                  door.soon
                    ? 'border-slate-800 bg-slate-950/40 text-slate-600'
                    : 'border-orange-500/30 bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20'
                }`}
              >
                <Icon className="h-8 w-8" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className={`font-bold ${door.soon ? 'text-slate-500' : 'text-white'}`}>{door.title}</span>
                <span className="text-[10px] text-slate-500 leading-snug max-w-[140px]">{door.desc}</span>
              </div>
              {door.soon && (
                <span className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* How To & Glossary door — explains each page + plain-English glossary */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onOpenHowTo}
          className="group flex items-center gap-3 rounded-2xl border-2 border-teal-500/30 bg-slate-900/60 px-6 py-4 text-white transition-all hover:border-teal-400 hover:bg-slate-800/80 active:translate-y-px"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="block font-bold">How To &amp; Glossary</span>
            <span className="block text-[11px] text-slate-400">Plain-English guides for every page, plus key terms.</span>
          </div>
        </button>
      </div>
    </div>
  );
}
