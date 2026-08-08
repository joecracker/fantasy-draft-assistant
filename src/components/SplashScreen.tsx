import React from 'react';
import { Flame } from 'lucide-react';

// =====================================================================
// SPLASH SCREEN — FIRE branding
// Full-screen cover with the logo + one "Enter" button.
// The Enter button must call `onEnter` exactly as wired below.
// =====================================================================

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-slate-950 text-slate-100 p-8 text-center relative overflow-hidden">
      {/* Soft flame glow behind the logo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-orange-600/10 blur-3xl"></div>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-orange-500/40 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-600/20">
          <Flame className="h-10 w-10" />
        </div>
        <div className="text-7xl font-black tracking-tight text-white">
          FIRE
        </div>
        <p className="max-w-md text-slate-400 text-sm leading-relaxed">
          The draft room where numbers beat hype.
        </p>
      </div>

      <button
        type="button"
        onClick={onEnter}
        className="relative rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold px-10 py-3.5 text-base shadow-lg shadow-orange-600/20 transition-all cursor-pointer active:translate-y-px"
      >
        Enter
      </button>
      <p className="text-[10px] text-slate-600 mt-8">Powered by AI</p>
    </div>
  );
}
