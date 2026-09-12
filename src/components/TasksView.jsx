import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { COLORS } from '../lib/constants.js';
import { Section, Empty } from './ui.jsx';
import TaskCard from './TaskCard.jsx';

export default function TasksView({ upcomingTasks, doneTasks, atRiskTasks, subjects, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onAdd, onStart, onStop }) {
  const [filter, setFilter] = useState('all');
  const cardProps = { subjects, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onStart, onStop };

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All subjects' },
      { value: 's1', label: subjects.s1.name },
      { value: 's2', label: subjects.s2.name },
      { value: 's3', label: subjects.s3.name },
      { value: 'general', label: 'General / other' },
    ],
    [subjects]
  );

  const matches = (t) => filter === 'all' || t.subject === filter;
  const fAtRisk = atRiskTasks.filter(matches);
  const fUpcoming = upcomingTasks.filter(matches);
  const fDone = doneTasks.filter(matches);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo }}>
          <Plus size={15} /> Add task
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {filterOptions.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: active ? COLORS.indigo : COLORS.paperAlt,
                color: active ? '#FFFFFF' : COLORS.inkSoft,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {fAtRisk.length > 0 && (
        <Section title="At risk">
          {fAtRisk.map((t) => (
            <TaskCard key={t.id} task={t} {...cardProps} />
          ))}
        </Section>
      )}

      <Section title="Upcoming">
        {fUpcoming.length === 0 ? (
          <Empty text={filter === 'all' ? 'No upcoming tasks.' : 'No upcoming tasks for this subject.'} />
        ) : (
          fUpcoming.map((t) => <TaskCard key={t.id} task={t} {...cardProps} />)
        )}
      </Section>

      <Section title="Done">
        {fDone.length === 0 ? (
          <Empty text={filter === 'all' ? 'Nothing completed yet.' : 'Nothing completed yet for this subject.'} />
        ) : (
          fDone.map((t) => <TaskCard key={t.id} task={t} {...cardProps} />)
        )}
      </Section>
    </div>
  );
}
