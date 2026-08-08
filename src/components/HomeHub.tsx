import React from 'react';
import { Gavel, Trophy, ArrowRightLeft, Link2, BookOpen } from 'lucide-react';

// =====================================================================
// HOME HUB / MENU PAGE — FIRE
// Four door tiles (Draft Room, Season Hub, Trades, League Sync).
// Draft Room calls `onOpenDraft`. The other three are "coming soon"
// and are dimmed. How To & Glossary calls `onOpenHowTo`.
// The "FIRE // HUB" back arrow calls `onBackToSplash`.
// =====================================================================

interface HomeHubProps {
  onOpenDraft: () => void;
  onOpenHowTo: () => void;
  onBackToSplash: () => void;
}

export default function HomeHub({ onOpenDraft, onOpenHowTo, onBackToSplash }: HomeHubProps) {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-black relative overflow-hidden">

      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(249, 115, 22, 0.12) 0%, var(--fda-glow-end) 70%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen w-full max-w-4xl px-6 py-8 animate-fade-in">

        {/* Background Grid Pattern Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Header */}
        <header className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-8">
          <button
            onClick={onBackToSplash}
            className="group flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
          >
            <span className="text-orange-500 group-hover:-translate-x-1 transition-transform">←</span>
            <span>FIRE // HUB</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">SYSTEM ONLINE</span>
          </div>
        </header>

        {/* Main Grid Section */}
        <main className="w-full my-auto">
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">

            {/* Tile 1: DRAFT ROOM (Active) */}
            <button
              onClick={onOpenDraft}
              className="group relative aspect-square cursor-pointer rounded-lg bg-slate-900/60 border border-orange-500/50 p-4 transition-all duration-300 hover:border-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 flex flex-col items-center justify-center gap-3 text-center"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full pointer-events-none group-hover:bg-orange-500/20 transition-colors" />

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <Gavel className="w-9 h-9" />
              </div>

              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                ACTIVE
              </span>

              <h3 className="text-base font-bold tracking-wider text-slate-100 group-hover:text-orange-400 transition-colors uppercase">
                Draft Room
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Enter the live draft tool
              </p>
            </button>

            {/* Tile 2: SEASON HUB (Coming Soon) */}
            <div className="relative aspect-square rounded-lg bg-slate-900/30 border border-slate-800/80 p-4 flex flex-col items-center justify-center gap-3 text-center opacity-60 grayscale-[30%]">
              <div className="p-4 rounded-xl bg-slate-800/50 text-slate-500 border border-slate-700/50">
                <Trophy className="w-9 h-9" />
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-800 text-orange-500/80 border border-orange-500/30">
                SOON
              </span>
              <h3 className="text-base font-bold tracking-wider text-slate-400 uppercase">
                Season Hub
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                In-season management
              </p>
            </div>

            {/* Tile 3: TRADES (Coming Soon) */}
            <div className="relative aspect-square rounded-lg bg-slate-900/30 border border-slate-800/80 p-4 flex flex-col items-center justify-center gap-3 text-center opacity-60 grayscale-[30%]">
              <div className="p-4 rounded-xl bg-slate-800/50 text-slate-500 border border-slate-700/50">
                <ArrowRightLeft className="w-9 h-9" />
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-800 text-orange-500/80 border border-orange-500/30">
                SOON
              </span>
              <h3 className="text-base font-bold tracking-wider text-slate-400 uppercase">
                Trades
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Trade & waiver advice
              </p>
            </div>

            {/* Tile 4: LEAGUE SYNC (Coming Soon) */}
            <div className="relative aspect-square rounded-lg bg-slate-900/30 border border-slate-800/80 p-4 flex flex-col items-center justify-center gap-3 text-center opacity-60 grayscale-[30%]">
              <div className="p-4 rounded-xl bg-slate-800/50 text-slate-500 border border-slate-700/50">
                <Link2 className="w-9 h-9" />
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-slate-800 text-orange-500/80 border border-orange-500/30">
                SOON
              </span>
              <h3 className="text-base font-bold tracking-wider text-slate-400 uppercase">
                League Sync
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Connect & sync a league
              </p>
            </div>

          </div>

          {/* How To & Glossary door */}
          <div className="flex justify-center mt-5">
            <button
              onClick={onOpenHowTo}
              className="group flex items-center gap-3 rounded-lg bg-slate-900/60 border border-orange-500/50 px-6 py-4 text-left transition-all hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:-translate-y-0.5 cursor-pointer w-full max-w-2xl"
            >
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-base font-bold text-orange-300 uppercase tracking-wider">How To &amp; Glossary</span>
                <span className="block text-[10px] font-mono text-slate-400">Plain-English guides &amp; key terms</span>
              </div>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full flex justify-between items-center border-t border-slate-800/80 pt-4 mt-8">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            FIRE ENGINE v1.0
          </span>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            A CRACKERBOX APP
          </span>
        </footer>
      </div>
    </div>
  );
}
