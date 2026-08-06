import { Plus } from 'lucide-react';
import { COLORS } from '../lib/constants.js';
import { Section, Empty } from './ui.jsx';
import TaskCard from './TaskCard.jsx';

export default function TasksView({ upcomingTasks, doneTasks, atRiskTasks, subjects, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onAdd, onStart, onStop }) {
  const cardProps = { subjects, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onStart, onStop };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo }}>
          <Plus size={15} /> Add task
        </button>
      </div>

      {atRiskTasks.length > 0 && (
        <Section title="At risk">
          {atRiskTasks.map((t) => (
            <TaskCard key={t.id} task={t} {...cardProps} />
          ))}
        </Section>
      )}

      <Section title="Upcoming">
        {upcomingTasks.length === 0 ? <Empty text="No upcoming tasks." /> : upcomingTasks.map((t) => <TaskCard key={t.id} task={t} {...cardProps} />)}
      </Section>

      <Section title="Done">
        {doneTasks.length === 0 ? <Empty text="Nothing completed yet." /> : doneTasks.map((t) => <TaskCard key={t.id} task={t} {...cardProps} />)}
      </Section>
    </div>
  );
}
