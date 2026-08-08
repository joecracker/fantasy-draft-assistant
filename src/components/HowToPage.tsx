import React from 'react';
import { BookOpen, ChevronDown, Home, Settings, Target, Sparkles, MonitorSmartphone, Sun, Moon } from 'lucide-react';

// =====================================================================
// HOW TO & GLOSSARY
// A plain-English guide to every part of the app, plus a glossary of
// fantasy-draft terms. Written for people who know football, not code.
// =====================================================================

interface HowToPageProps {
  onBack: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 md:p-6 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-col gap-3 text-sm text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Term({ term, def }: { term: string; def: string }) {
  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
      <span className="text-xs font-bold text-teal-300 font-mono">{term}</span>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{def}</p>
    </div>
  );
}

export default function HowToPage({ onBack }: HowToPageProps) {
  const [openSection, setOpenSection] = React.useState<string | null>('getting-started');

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
  };

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      body: (
        <>
          <p>
            This app is a <strong className="text-white">fantasy football draft assistant</strong>. It helps you run a draft
            and make smart picks — either in a real league or a practice "mock" draft with fake computer opponents.
          </p>
          <p>
            When you open the app you'll see a start screen. Click through to the <strong className="text-white">Home menu</strong>, which
            is your doorway to everything. The main place you'll work is the <strong className="text-white">Draft Room</strong>.
          </p>
          <p>
            <strong className="text-white">The golden rule:</strong> set up your league's rules first (scoring, number of teams, your
            draft slot) in <strong className="text-teal-400">Settings</strong>, then everything else in the app — the coach, the alerts, the
            practice drafts — uses <em>your</em> rules automatically.
          </p>
          <p>
            <strong className="text-white">No API key is required to use the app.</strong> Everything you need for a draft works out of the
            box — rankings, the coach, mock drafts, alerts. The only thing that needs a key is the optional <em>AI analysis</em> layer,
            explained in its own section below. If you never touch a key, the app is 100% ready.
          </p>
        </>
      ),
    },
    {
      id: 'draft-room',
      title: 'The Draft Room (Main Screen)',
      body: (
        <>
          <p>
            The Draft Room is split into sections. From top to bottom:
          </p>
          <ul className="flex flex-col gap-2 list-none">
            <li>
              <strong className="text-white">Top bar</strong> — the <Home className="inline h-3.5 w-3.5 text-teal-400" />{" "}
              Home button opens a menu (return to Home, open this How-To, or peek at "Coming Soon" pages). The tabs
              (Board, Players, Settings, etc.) switch between views.
            </li>
            <li>
              <strong className="text-white">Round / Pick bar</strong> — shows which round and pick you're on, and when your turn is.
              It turns bright green with "YOUR TURN TO PICK!" when it's your moment.
            </li>
            <li>
              <strong className="text-white">The workspace</strong> — the draft board and player lists live here.
            </li>
          </ul>
          <p>
            On the <strong className="text-teal-400">Players</strong> tab you'll find the player pool — every available player,
            searchable and filterable. The <strong className="text-teal-400">Board</strong> tab shows the full draft grid of who went
            when. The <strong className="text-teal-400">Settings</strong> tab holds your league setup.
          </p>
        </>
      ),
    },
    {
      id: 'set-up-league',
      title: 'Set Up Your League',
      body: (
        <>
          <p>Open <Settings className="inline h-3.5 w-3.5 text-teal-400" /> <strong className="text-white">Settings → Draft Setup</strong> and set:</p>
          <ul className="flex flex-col gap-2 list-none">
            <li><strong className="text-white">Scoring Format</strong> — Standard, PPR, or your custom scoring rules.</li>
            <li><strong className="text-white">Total Teams</strong> — 8, 10, 12, 14, or 16.</li>
            <li><strong className="text-white">My Draft Slot</strong> — your pick number in the first round.</li>
            <li><strong className="text-white">Team Names</strong> — optional. Add a name to each spot so the board reads like your real league.</li>
          </ul>
          <p>
            <strong className="text-white">Draft Setups</strong> lets you save all of this as a named snapshot — perfect if you play in
            multiple leagues. Save one per league, then load it whenever you draft. Loading a setup always asks first and clears the board.
          </p>
        </>
      ),
    },
    {
      id: 'the-coach',
      title: 'The Pick-Time Coach (Your Secret Weapon)',
      body: (
        <>
          <p>
            The <Target className="inline h-3.5 w-3.5 text-teal-400" /> <strong className="text-white">Coach</strong> button sits right next to the
            search bar on the Players tab. It's a personal assistant that watches the draft and tells you who to take.
          </p>
          <p>
            Click <strong className="text-teal-400">Coach</strong> to open the panel anytime. It also pops open on its own one pick before
            your turn, so you have your shortlist ready. It shows the <strong className="text-white">top 3 players</strong> for your next pick,
            ranked by what actually scores points in <em>your</em> league:
          </p>
          <ul className="flex flex-col gap-2 list-none">
            <li><strong className="text-white">VORP</strong> — how much better a player is than the last guy you could start.</li>
            <li><strong className="text-white">Your roster needs</strong> — "you still need 2 WR starters."</li>
            <li><strong className="text-white">Scarcity</strong> — "only 3 startable RBs left!"</li>
            <li><strong className="text-white">Value</strong> — a player who fell past their expected spot.</li>
          </ul>
          <p>
            Want a second opinion? Hit <Sparkles className="inline h-3.5 w-3.5 text-teal-400" />{" "}
            <strong className="text-white">Ask AI Coach</strong> for a one-line read from Gemini on who to take. That needs your free AI key in
            Settings (see below). Everything else works without it.
          </p>
        </>
      ),
    },
    {
      id: 'ai-key',
      title: 'The AI Key (Optional)',
      body: (
        <>
          <p>
            The app can talk to Google's Gemini AI for deeper help, but you bring your own key. It's free, quick, and saved only on your device.
          </p>
          <p>
            In <strong className="text-teal-400">Settings → AI Analysis Key</strong>, paste a Gemini API key and save. Once set, you get:
          </p>
          <ul className="flex flex-col gap-2 list-none">
            <li>The <Sparkles className="inline h-3.5 w-3.5 text-teal-400" /> <strong className="text-white">Ask AI Coach</strong> button in the coach panel.</li>
            <li><strong className="text-white">Run Analysis</strong> on any player — an "anti-hype" deep dive that separates real stats from media hype.</li>
          </ul>
          <p>
            <strong className="text-white">You don't need the key to draft.</strong> All rankings, the coach's top-3, scarcity alerts, and mock drafts run on the
            app's own numbers. The key just adds the AI commentary layer.
          </p>
        </>
      ),
    },
    {
      id: 'appearance',
      title: 'Change the Theme (Dark & Dimmer)',
      body: (
        <>
          <p>
            Want the app a little easier on your eyes in a bright room? Open{" "}
            <Settings className="inline h-3.5 w-3.5 text-teal-400" /> <strong className="text-white">Settings → Appearance</strong> and
            flip the <strong className="text-teal-400">Theme Mode</strong> switch:
          </p>
          <ul className="flex flex-col gap-2 list-none">
            <li>
              <Moon className="inline h-3.5 w-3.5 text-indigo-300" />{" "}
              <strong className="text-white">Dark Mode</strong> — the classic near-black "night" look. The default.
            </li>
            <li>
              <Sun className="inline h-3.5 w-3.5 text-amber-400" />{" "}
              <strong className="text-white">Dimmer Mode</strong> — a softer, lighter "twilight" look that's friendlier in daylight.
            </li>
          </ul>
          <p>
            Your choice is remembered on that device, and the whole app — draft room, menus, splash screen, everything — switches
            together. It's just a look; it never changes your data or settings.
          </p>
        </>
      ),
    },
    {
      id: 'mock-draft',
      title: 'Practice With a Mock Draft',
      body: (
        <>
          <p>
            Want to practice before the real thing? Start a <strong className="text-white">Mock Draft</strong> from the Players tab (or from a saved setup).
          </p>
          <p>
            The computer opponents now draft like real managers — they know their own roster needs, react to position runs, and grab steals. You pick
            for yourself when your turn comes. The practice clock runs during mock drafts so you get used to the pressure of a timed pick.
          </p>
          <p>
            When the mock finishes, the <strong className="text-white">Draft Recap</strong> grades your roster and shows your best-value picks and reaches.
          </p>
        </>
      ),
    },
    {
      id: 'alerts',
      title: 'Live Alerts During the Draft',
      body: (
        <>
          <p>
            The app watches the board and warns you about what matters, in plain English:
          </p>
          <ul className="flex flex-col gap-2 list-none">
            <li><strong className="text-white">AI Live Board Alerts</strong> — position runs ("4 straight QBs went — QBs are flying!") and scarcity ("only 2 startable RBs left").</li>
            <li><strong className="text-white">Clock & alarm</strong> — the app chimes when your turn approaches and when it's your pick. Use the timer controls to set your pace.</li>
            <li><strong className="text-white">BPA / Tier badges</strong> — Best Player Available flags and tier labels (T1, T2...) on the player list.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'board-controls',
      title: 'Drafting & Undoing',
      body: (
        <>
          <p>
            To draft a player: select them in the list and use the <strong className="text-white">Draft</strong> button (mark them for you or for an
            opponent as picks happen). The board fills in as you go.
          </p>
          <p>
            Made a mistake? Use <strong className="text-white">Undo</strong> to take back the most recent pick, or <strong className="text-white">Reset / Clear</strong> to
            start the board over. Remember: in a real draft, track the opponents' picks as they happen — or use a mock draft to simulate them.
          </p>
        </>
      ),
    },
    {
      id: 'glossary',
      title: 'Glossary',
      body: (
        <>
          <p className="text-xs text-slate-500 mb-1">Tap each section below to expand it. Every term in plain English.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Term term="ADP" def="Average Draft Position. Where players are typically taken, on average, across many drafts. Lower ADP = usually picked earlier." />
            <Term term="VORP" def="Value Over Replacement Player. How many more points a player scores than the last guy you could realistically start. Higher VORP = more valuable pick." />
            <Term term="PPR" def="Points Per Reception. A scoring style where each catch earns an extra point (usually 0.5 or 1). Receiving backs and slot receivers get a boost." />
            <Term term="Standard" def="Traditional scoring: no points for catches. Touchdowns, yards, and turnovers only." />
            <Term term="Snake Draft" def="Draft order that flips each round. If you pick 12th in round 1, you pick 1st in round 2 — keeps it fair." />
            <Term term="Mock Draft" def="A practice draft against computer opponents, using your league's settings. Great for testing strategies." />
            <Term term="Draft Slot" def="Your position in the draft order for round 1." />
            <Term term="BPA" def="Best Player Available. The highest-rated player still on the board, ignoring roster needs." />
            <Term term="Tier" def="A group of players seen as roughly equal in value. Once a tier is gone, you often reach a big drop-off." />
            <Term term="Scarcity" def="When few good players remain at a position. If only a couple of startable RBs are left, RBs become more valuable." />
            <Term term="Reach" def="Taking a player much earlier than their ADP. Sometimes needed for a target player, usually a risk." />
            <Term term="Steal" def="Getting a player much later than their ADP. Drafting value." />
            <Term term="FLEX" def="A lineup spot that can be filled by an RB, WR, or TE." />
            <Term term="Bye Week" def="The week a team doesn't play. You need cover for players sharing the same bye week." />
            <Term term="Handcuff" def="A backup running back who takes over if the starter gets hurt. Drafting both secures the position." />
            <Term term="Stack" def="Drafting players from the same offense (e.g., a QB and his top WR) to capture big scoring games." />
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-6 pb-16">
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
      >
        ← Back to Home
      </button>

      <div className="rounded-2xl border border-teal-500/30 bg-slate-900/60 p-8 flex flex-col items-center text-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-400">
          <BookOpen className="h-8 w-8" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
          How To &amp; Glossary
        </h2>
        <p className="text-sm text-slate-400 max-w-md leading-relaxed">
          Everything in the app, explained in plain English — plus the fantasy-draft terms you might run into.
        </p>
      </div>

      {/* Designed-for-split-screen callout */}
      <div className="rounded-2xl border border-teal-500/25 bg-teal-950/20 p-5 flex flex-col gap-2.5 animate-fade-in">
        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
          <MonitorSmartphone className="h-4 w-4" />
          Best on Split Screen & Phone
        </span>
        <p className="text-sm text-slate-300 leading-relaxed">
          This app works in full screen, but it's <strong className="text-white">designed for split screen</strong> and{" "}
          <strong className="text-white">cell phones</strong>. Picture your league's draft on one side of your screen and this app on
          the other — that's where it feels at home. On a phone, everything stacks into one clean column you can scroll. It runs
          fine in full screen too; just don't be surprised if the layout spreads out to fill the extra space.
        </p>
      </div>

      {sections.map(section => (
        <section key={section.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors cursor-pointer ${
              openSection === section.id ? 'bg-teal-500/5' : 'hover:bg-slate-800/40'
            }`}
          >
            <span className="text-sm font-bold text-white flex items-center gap-2">
              {section.id === 'glossary' ? <BookOpen className="h-4 w-4 text-teal-400 shrink-0" /> : null}
              {section.title}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${openSection === section.id ? 'rotate-180' : ''}`} />
          </button>
          {openSection === section.id && (
            <div className="px-5 pb-5 pt-1 text-sm text-slate-300 leading-relaxed flex flex-col gap-3">
              {section.body}
            </div>
          )}
        </section>
      ))}

      {/* Sign-off disclaimer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 flex flex-col items-center text-center gap-2">
        <p className="text-sm font-bold text-white">
          Built for one guy, shared with everyone.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
          This app was designed for my own drafts — if it happens to help you out, that's a bonus. It's not a product,
          it's a hobby, so no promises and no warranty. Hope you enjoy it, and happy drafting.
        </p>
      </div>
    </div>
  );
}
