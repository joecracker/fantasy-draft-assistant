import React from 'react';
import { FilterResult } from '../types';
import { 
  FileText, Trash2, TrendingDown, ClipboardList, 
  Settings, Zap, AlertTriangle, Play, HelpCircle, ArrowRight
} from 'lucide-react';

interface AnalysisReportProps {
  result: FilterResult;
}

export default function AnalysisReport({ result }: AnalysisReportProps) {
  const {
    playerName,
    team,
    position,
    objectiveMetrics,
    narrativeTrashBin,
    trueRangeOfOutcomes,
    regressionFlags,
    systemAnalysis,
    varianceAssessment,
    clinicalScore,
  } = result;

  // Stability scoring details
  const getStabilityLevel = (score: number) => {
    if (score >= 7.5) {
      return {
        label: 'High Stability',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        barColor: 'bg-emerald-500',
        text: 'Metrics support a highly resilient, high-floor volume profile.'
      };
    } else if (score >= 4.5) {
      return {
        label: 'Moderate/Conditional',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        barColor: 'bg-amber-500',
        text: 'A mixture of favorable system changes and volume stability, but carries mild risk profiles.'
      };
    } else {
      return {
        label: 'High Volatility',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        barColor: 'bg-rose-500',
        text: 'Extremely volatile profile. Heavily reliant on unsustainable efficiency metrics.'
      };
    }
  };

  const stability = getStabilityLevel(clinicalScore);

  // Math helper for PPG slider percentage (ranges from 0 to 25 ppg)
  const getPercentage = (val: number) => {
    return Math.max(0, Math.min(100, (val / 25) * 100));
  };

  const floorPercent = getPercentage(trueRangeOfOutcomes.floorValue);
  const ceilingPercent = getPercentage(trueRangeOfOutcomes.ceilingValue);

  return (
    <div className="flex flex-col gap-6 animate-fade-in" id="analysis-report-root">
      
      {/* Player Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 md:p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center rounded-md bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-400 font-mono">
              {position}
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-wide font-mono">
              {team}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight font-sans">
            {playerName}
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500"></span>
            Profile Analysis Complete
          </p>
        </div>

        {/* Clinical Rating Circle */}
          <div className="flex items-center gap-4 border-t border-slate-900 pt-4 sm:border-t-0 sm:pt-0">
            <div className="flex flex-col text-right">
              <span className="text-xxs font-mono uppercase tracking-widest text-slate-500">
                Stability Rating
              </span>
              <span className={`text-xs font-semibold ${stability.color.split(' ')[0]}`}>
                {stability.label}
              </span>
            </div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 font-mono">
              <div className="absolute top-1 left-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">ST</div>
            <div className="text-center">
              <span className="text-xl font-black text-white">{clinicalScore}</span>
              <span className="text-slate-500 text-[10px]">/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing metrics profile, range of outcomes, and trash-bin */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Left Column: Metrics & Range */}
        <div className="flex flex-col gap-6">
          
          {/* Objective Metrics Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
              <ClipboardList className="h-4 w-4" />
              Objective Metric Profile
            </h3>
            <div className="flex flex-col gap-3">
              {objectiveMetrics.map((metric, idx) => (
                <div key={idx} className="flex gap-2.5 items-start bg-slate-950/40 border border-slate-800/50 rounded-lg p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-950/50 border border-teal-500/20 text-teal-400 text-xxs font-mono font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{metric}</p>
                </div>
              ))}
            </div>
          </div>

          {/* True Range of Outcomes Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
              <Zap className="h-4 w-4" />
              True Range of Outcomes ({trueRangeOfOutcomes.metricType})
            </h3>

            {/* Visual Gauge */}
            <div className="mt-2 flex flex-col gap-4 bg-slate-950/50 border border-slate-800/80 p-4 rounded-lg">
              <div className="relative h-6 w-full rounded-md bg-slate-900 flex items-center">
                
                {/* Visual Shaded Range */}
                <div 
                  className="absolute h-3 rounded-sm bg-teal-500/20 border-y border-teal-500/30"
                  style={{ 
                    left: `${floorPercent}%`, 
                    width: `${Math.max(4, ceilingPercent - floorPercent)}%` 
                  }}
                />

                {/* Left/Floor handle marker */}
                <div 
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${floorPercent}%` }}
                >
                  <div className="h-4 w-1.5 rounded-full bg-rose-400" />
                  <span className="absolute -top-5 text-[10px] font-bold font-mono text-rose-400">
                    {trueRangeOfOutcomes.floorValue}
                  </span>
                </div>

                {/* Right/Ceiling handle marker */}
                <div 
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${ceilingPercent}%` }}
                >
                  <div className="h-4 w-1.5 rounded-full bg-emerald-400" />
                  <span className="absolute -top-5 text-[10px] font-bold font-mono text-emerald-400">
                    {trueRangeOfOutcomes.ceilingValue}
                  </span>
                </div>
              </div>

              {/* Axis Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
                <span>0 PPG (Replacement)</span>
                <span>12.5 PPG</span>
                <span>25.0 PPG (Elite)</span>
              </div>

              <div className="h-px bg-slate-800 my-1" />

              {/* Floor vs Ceiling details */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                    Low-Floor Scenario
                  </span>
                  <p className="text-slate-400 leading-relaxed text-xxs font-sans">
                    {trueRangeOfOutcomes.floorDescription}
                  </p>
                </div>
                
                <div className="rounded border border-slate-800 bg-slate-900/60 p-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Realistic Ceiling Scenario
                  </span>
                  <p className="text-slate-400 leading-relaxed text-xxs font-sans">
                    {trueRangeOfOutcomes.ceilingDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Trash-Bin & Regression & Play-Caller */}
        <div className="flex flex-col gap-6">
          
          {/* Narrative Trash-Bin */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-2 font-mono">
              <Trash2 className="h-4 w-4" />
              Narrative Trash-Bin
            </h3>

            <div className="flex flex-col gap-3">
              {/* Crossed out Narrative */}
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 relative overflow-hidden">
                <div className="absolute top-1 right-2 font-mono text-[8px] uppercase tracking-widest text-slate-600">
                  Discarded Narrative
                </div>
                <p className="text-xs text-slate-500 line-through italic leading-relaxed pr-8 font-sans">
                  "{narrativeTrashBin}"
                </p>
              </div>

              <div className="rounded-lg border border-rose-500/15 bg-rose-500/5 p-3.5">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1.5 font-mono">
                  Analysis Note
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  This narrative layer has been set aside. The remaining report is strictly metrics-backed.
                </p>
              </div>
            </div>
          </div>

          {/* Sustainable Regression Monitor */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
                <TrendingDown className="h-4 w-4" />
                Regression Flag Monitor
              </h3>
              <span className="text-xxs font-mono text-slate-500">Sustainability Check</span>
            </div>

            {regressionFlags && regressionFlags.length > 0 ? (
              <div className="flex flex-col gap-3">
                {regressionFlags.map((flag, idx) => {
                  const isHigh = flag.severity.toLowerCase() === 'high';
                  const isMed = flag.severity.toLowerCase() === 'medium';
                  const badgeColor = isHigh 
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                    : isMed 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

                  return (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0">
                        <AlertTriangle className={`h-4 w-4 ${isHigh ? 'text-rose-500' : isMed ? 'text-amber-500' : 'text-blue-400'}`} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 font-mono">
                            {flag.metric}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[8px] font-bold uppercase font-mono tracking-wider ${badgeColor}`}>
                            {flag.severity} RISK
                          </span>
                        </div>
                        <p className="text-xxs text-slate-400 leading-relaxed font-sans">
                          {flag.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-center">
                <p className="text-xs text-slate-500 italic">No critical statistical regression flagged.</p>
              </div>
            )}
          </div>
          
          {/* Play-Caller System Support Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
              <Settings className="h-4 w-4" />
              Play-Caller System Support
            </h3>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xxs text-slate-500 uppercase font-mono block">Play-Caller / OC</span>
                  <span className="text-xs font-bold text-slate-200 font-sans">{systemAnalysis.playCaller}</span>
                </div>
                <div className="text-right">
                  <span className="text-xxs text-slate-500 uppercase font-mono block">System Impact Score</span>
                  <span className="text-xs font-extrabold text-teal-400 font-mono">{systemAnalysis.impactScore}/100</span>
                </div>
              </div>

              {/* Progress Bar of impact */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                <div 
                  className="h-full bg-teal-400 rounded-full"
                  style={{ width: `${systemAnalysis.impactScore}%` }}
                />
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/40 p-2 text-xxs text-slate-400 leading-relaxed font-sans">
                <strong className="text-slate-300">Historical Tendency: </strong>
                {systemAnalysis.tendency}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stability Verdict Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col gap-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
          <HelpCircle className="h-4 w-4" />
          Variance Assessment
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {varianceAssessment}
        </p>
        <div className="h-px bg-slate-900 my-1" />
        <p className="text-xxs text-slate-500 leading-relaxed font-sans">
          <strong className="text-slate-400 font-medium">Diagnostic Note:</strong> {stability.text} Range projections assume a standard 12-game sample minimum without catastrophic injury regression.
        </p>
      </div>
    </div>
  );
}
