import React, { useRef, useState, useEffect } from 'react';
import { Home, Database, BookOpen, CalendarRange, ArrowLeftRight, Link2 } from 'lucide-react';

interface HeaderProps {
  onHomeClick: () => void;
  onDraftClick?: () => void;
  onHowToClick?: () => void;
}

export default function Header({ onHomeClick, onDraftClick, onHowToClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const navItem = (label: string, sub: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onClick(); }}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-slate-200 hover:bg-slate-800 transition-colors"
    >
      {icon}
      <span>
        <span className="block text-xs font-bold">{label}</span>
        <span className="block text-[10px] text-slate-500">{sub}</span>
      </span>
    </button>
  );

  return (
    <header className="border-b border-slate-800 bg-slate-950 px-6 py-4" id="app-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 transition-transform active:scale-95 cursor-pointer group"
            title="Jump to a page"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/20 text-teal-400 group-hover:border-teal-400/60 group-hover:bg-teal-900/40 transition-colors">
              <Home className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl">
              FIRE
            </h1>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-2 z-50 w-60 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl animate-fade-in overflow-hidden">
              <div className="px-3.5 pt-2.5 pb-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Pages</div>
              {onDraftClick && navItem('Draft Room', 'Live draft board & players', <Database className="h-4 w-4 text-teal-400" />, onDraftClick)}
              {navItem('Home Hub (Menu)', 'Main menu page', <Home className="h-4 w-4 text-teal-400" />, onHomeClick)}
              {onHowToClick && navItem('How To & Glossary', 'Guides for every page', <BookOpen className="h-4 w-4 text-teal-400" />, onHowToClick)}

              <div className="px-3.5 pt-2 pb-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Coming Soon</div>
              {[
                { icon: CalendarRange, label: 'Season Hub' },
                { icon: ArrowLeftRight, label: 'Trades' },
                { icon: Link2, label: 'League Sync' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-600 select-none">
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
      </div>
    </header>
  );
}
