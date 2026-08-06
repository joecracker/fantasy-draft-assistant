import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Layers, Gauge } from 'lucide-react';

const MESSAGES = [
  'DECONSTRUCTING TRAINING CAMP NARRATIVES...',
  'CALIBRATING HISTORICAL NEUTRAL PASS RATES...',
  'SCRUBBING PUFF-PIECE ADJECTIVES...',
  'CALCULATING CORRELATION OF TOUCHDOWN REGRESSION...',
  'AUDITING OFFENSIVE COORDINATOR DESIGN SYSTEMS...',
  'EXTRACTING RAW STICKY TARGET SHARE METRICS...',
  'CALCULATING SUSTAINABLE YARDS PER TOUCH RATIOS...',
  'DEFLATING BEST-SHAPE-OF-HIS-LIFE STATEMENTS...'
];

export default function DiagnosticLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // cap until finished
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center" id="diagnostic-loader">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-teal-500/10 border-t-teal-500 animate-spin" />
        <RefreshCw className="h-6 w-6 text-teal-400 animate-pulse" />
      </div>

      <div className="mt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 font-mono uppercase tracking-wider">
          Diagnostic Protocol Running
        </span>
      </div>

      <h3 className="mt-4 text-base font-bold text-white font-sans">
        Filtering Narratives...
      </h3>

      <div className="mt-3 min-h-[1.5rem] max-w-sm px-4">
        <p className="text-xs font-mono text-teal-400/80 tracking-wide animate-pulse">
          {MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-8 w-full max-w-xs">
        <div className="flex items-center justify-between text-xxs font-mono text-slate-500 uppercase tracking-widest mb-1.5">
          <span>Signal Scrubbing</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-teal-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Subtext clinical indicators */}
      <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-900 pt-6 w-full max-w-md">
        <div className="text-center">
          <Layers className="mx-auto h-4 w-4 text-slate-600 mb-1" />
          <span className="block text-xxs font-mono text-slate-500 uppercase">Input Noise</span>
          <span className="text-xs font-medium text-rose-400 font-mono">Deflating</span>
        </div>
        <div className="text-center border-x border-slate-900 px-2">
          <Gauge className="mx-auto h-4 w-4 text-slate-600 mb-1" />
          <span className="block text-xxs font-mono text-slate-500 uppercase">Regression</span>
          <span className="text-xs font-medium text-amber-500 font-mono">Calibrating</span>
        </div>
        <div className="text-center">
          <ShieldAlert className="mx-auto h-4 w-4 text-slate-600 mb-1" />
          <span className="block text-xxs font-mono text-slate-500 uppercase">Volatility</span>
          <span className="text-xs font-medium text-teal-400 font-mono">Scanned</span>
        </div>
      </div>
    </div>
  );
}
