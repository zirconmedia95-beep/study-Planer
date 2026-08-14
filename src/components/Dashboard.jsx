import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { COLORS } from '../lib/constants.js';
import TaskCard from './TaskCard.jsx';
import QuickAddChat from './QuickAddChat.jsx';

export default function Dashboard({ todayTasks, atRiskTasks, subjects, today, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onAdd, onQuickAdd, onRefresh, onStart, onStop }) {
  const editWithToday = (t) => onEdit(t, today);
  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm" style={{ color: COLORS.inkSoft }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} title="Recalculate schedule now" className="p-2.5 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo }}>
            <Plus size={15} /> Add task
          </button>
        </div>
      </div>

      <QuickAddChat subjects={subjects} onAdd={onQuickAdd} />

      {atRiskTasks.length > 0 && (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: COLORS.amberSoft }}>
          <AlertTriangle size={18} style={{ color: COLORS.amber }} className="mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium" style={{ color: COLORS.amber }}>
              {atRiskTasks.length} task{atRiskTasks.length > 1 ? 's' : ''} won't fit before its deadline
            </div>
            <div className="text-xs mt-0.5">{atRiskTasks.map((t) => t.name).join(', ')} — free up time or push the deadline.</div>
          </div>
        </div>
      )}

      <div className="rounded-xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        {todayTasks.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: COLORS.inkSoft }}>
            Nothing scheduled today. Add a task to get started.
          </div>
        ) : (
          <div className="px-4">
            {todayTasks.map((t) => (
              <TaskCard key={t.id} task={t} subjects={subjects} onDone={onDone} onUndo={onUndo} onMissed={onMissed} onDelete={onDelete} onMoreTime={onMoreTime} onEdit={editWithToday} onStart={onStart} onStop={onStop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
