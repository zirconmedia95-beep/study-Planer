import { CalendarDays, CalendarRange, ListChecks, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { COLORS } from '../lib/constants.js';

export default function Sidebar({ view, setView, examDays, atRiskCount }) {
  const items = [
    { id: 'dashboard', label: 'Today', icon: CalendarDays },
    { id: 'calendar', label: 'Calendar', icon: CalendarRange },
    { id: 'tasks', label: 'Tasks', icon: ListChecks },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];
  return (
    <aside
      className="md:w-56 w-full flex md:flex-col justify-between md:justify-start border-b md:border-b-0 md:border-r relative z-20"
      style={{ borderColor: COLORS.line, background: COLORS.paperAlt, boxShadow: '1px 0 0 rgba(31,36,40,0.02)' }}
    >
      <div className="px-5 py-5">
        <div className="text-sm font-semibold tracking-tight hidden md:flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full" style={{ background: COLORS.indigo }} />
          Study Planner
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: COLORS.inkSoft }}>
          A/L countdown
        </div>
        <div
          className="text-4xl font-semibold mt-1 tabular-nums"
          style={{ color: COLORS.indigo, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
        >
          {examDays >= 0 ? examDays : 0}
        </div>
        <div className="text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>
          days left
        </div>
      </div>
      <nav className="flex md:flex-col md:px-3 md:pb-6 md:gap-1 px-2 pb-2 md:pb-6">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all"
              style={{
                background: active ? COLORS.indigo : 'transparent',
                color: active ? '#FFFFFF' : COLORS.ink,
                boxShadow: active ? '0 2px 8px rgba(43,58,103,0.25)' : 'none',
              }}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{it.label}</span>
              {it.id === 'tasks' && atRiskCount > 0 && (
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : COLORS.amberSoft, color: active ? '#fff' : COLORS.amber }}
                >
                  {atRiskCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
