import { COLORS, SUBJECT_HUES } from '../lib/constants.js';
import { StatBox } from './ui.jsx';

export default function ProgressView({ tasks, subjects }) {
  const real = tasks.filter((t) => t.type !== 'routine' && t.type !== 'personal');
  const total = real.length;
  const done = real.filter((t) => t.status === 'DONE').length;
  const atRisk = real.filter((t) => t.status === 'AT_RISK').length;
  const missed = real.reduce((sum, t) => sum + (t.missedCount || 0), 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const subjKeys = ['s1', 's2', 's3'];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Progress</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBox label="Completed" value={done} color={COLORS.green} />
        <StatBox label="At risk" value={atRisk} color={COLORS.amber} />
        <StatBox label="Missed" value={missed} color={COLORS.rust} />
        <StatBox label="Total tasks" value={total} color={COLORS.indigo} />
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1.5">
          <span style={{ color: COLORS.inkSoft }}>Overall completion</span>
          <span className="tabular-nums font-medium">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: COLORS.paperAlt }}>
          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: COLORS.indigo }} />
        </div>
      </div>

      <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: COLORS.inkSoft }}>
        By subject
      </div>
      <div className="space-y-4">
        {subjKeys.map((k, i) => {
          const subjTasks = real.filter((t) => t.subject === k);
          const subjDone = subjTasks.filter((t) => t.status === 'DONE').length;
          const subjPct = subjTasks.length ? Math.round((subjDone / subjTasks.length) * 100) : 0;
          return (
            <div key={k}>
              <div className="flex justify-between text-sm mb-1.5">
                <span>{subjects[k]?.name || k}</span>
                <span className="tabular-nums" style={{ color: COLORS.inkSoft }}>
                  {subjDone}/{subjTasks.length}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: COLORS.paperAlt }}>
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${subjPct}%`, background: SUBJECT_HUES[i] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
