import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

// =====================================================================
// SPLASH SCREEN — FIRE (Gemini "The Forge" design)
// Full-screen cover with the logo + one "Enter" button.
// The Enter button must call `onEnter` exactly as wired below.
// =====================================================================

interface SplashScreenProps {
  onEnter: () => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <div className="w-full min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-orange-500 selection:text-black flex flex-col justify-between items-center relative overflow-hidden">
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(249, 115, 22, 0.12) 0%, rgba(10, 10, 12, 0.95) 70%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-between min-h-screen w-full max-w-md px-6 py-12 text-center animate-fade-in">

        {/* Top Spacer / Minimal Brand Header */}
        <div className="pt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs tracking-wider uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Next-Gen Fantasy</span>
          </div>
        </div>

        {/* Hero Center - Branding */}
        <div className="flex flex-col items-center justify-center my-auto w-full">
          {/* Logo Container with Ambient Backlight */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />

            <h1 className="relative text-7xl sm:text-8xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              FIRE
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase max-w-xs leading-relaxed">
            The draft room where numbers beat hype
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="w-full flex flex-col items-center gap-8 pb-4">
          {/* Enter Button */}
          <button
            onClick={onEnter}
            className="group relative w-full py-4 px-8 rounded-lg bg-transparent border border-orange-500/80 text-orange-400 font-bold tracking-widest uppercase text-sm transition-all duration-300 ease-out hover:bg-orange-500 hover:text-black hover:border-orange-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ENTER</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Footer Note */}
          <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
}
