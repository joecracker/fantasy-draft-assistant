import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950 px-6 py-5" id="app-header">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/20 text-teal-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">
                NFL Fantasy Hype Filter
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-xs font-medium text-teal-400">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Clinical Engine Active
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm font-sans">
              Clinical sports analytics that strips media narrative, training camp fluff, and emotional bias.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 border-l border-slate-800 pl-4 sm:border-l-0 sm:pl-0">
          <div className="text-left sm:text-right">
            <span className="block font-mono text-xxs text-slate-500 uppercase tracking-widest">
              Analytical Protocol
            </span>
            <span className="text-xs font-medium text-slate-300">
              Quantify over Qualify v3.5
            </span>
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400 md:flex">
            <Activity className="h-5 w-5 text-teal-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
