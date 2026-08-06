import { useEffect, useState } from 'react';
import { Check, Clock, Pencil, Play, RotateCcw, Square, Trash2, XCircle } from 'lucide-react';
import { COLORS, SUBJECT_HUES, TYPE_CONFIG } from '../lib/constants.js';
import { fmtDate, statusMeta } from '../lib/scheduler.js';

function Timer({ task }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const durationSec = (task.durationMinutes || 30) * 60;
  const elapsedSec = Math.floor((Date.now() - task.startedAt) / 1000);
  const remaining = durationSec - elapsedSec;
  const overtime = remaining < 0;
  const abs = Math.abs(remaining);
  const mm = Math.floor(abs / 60).toString().padStart(2, '0');
  const ss = Math.floor(abs % 60).toString().padStart(2, '0');
  return (
    <span className="tabular-nums text-xs font-medium px-1" style={{ color: overtime ? COLORS.amber : COLORS.teal, fontFamily: 'ui-monospace, monospace' }}>
      {overtime ? '+' : ''}
      {mm}:{ss} {overtime ? 'over' : 'left'}
    </span>
  );
}

export default function TaskCard({ task, subjects, onDone, onUndo, onMissed, onDelete, onMoreTime, onEdit, onStart, onStop }) {
  const meta = statusMeta(task.status, COLORS);
  const subjName = subjects[task.subject]?.name || (task.subject === 'general' ? 'General' : task.subject);
  const hueIdx = ['s1', 's2', 's3'].indexOf(task.subject);
  const hue = hueIdx >= 0 ? SUBJECT_HUES[hueIdx] : COLORS.inkSoft;
  const isDone = task.status === 'DONE';
  const isStarted = !!task.startedAt;

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0 -mx-2 px-2 rounded-lg hover:bg-black/[0.015] transition-colors" style={{ borderColor: COLORS.line }}>
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: hue }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{task.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.fg }}>
            {meta.label}
          </span>
          {task.missedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: COLORS.rustSoft, color: COLORS.rust }}>
              missed ×{task.missedCount}
            </span>
          )}
        </div>
        <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: COLORS.inkSoft }}>
          <span>{subjName}</span>
          <span>&middot;</span>
          <span>{TYPE_CONFIG[task.type]?.label || task.type}</span>
          {task.date && (
            <>
              <span>&middot;</span>
              <span>
                {fmtDate(task.date)}
                {task.startTime ? `, ${task.startTime}` : ''}
                {task.endTime ? `–${task.endTime}` : ''}
              </span>
            </>
          )}
          {task.status === 'AT_RISK' && <span style={{ color: COLORS.amber }}>&middot; no free slot before deadline</span>}
          {!task.isFixed && task.score != null && task.status !== 'DONE' && (
            <>
              <span>&middot;</span>
              <span className="tabular-nums" style={{ fontFamily: 'ui-monospace, monospace' }}>
                score {task.score}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!task.isFixed && !isDone && (
          isStarted ? (
            <>
              <Timer task={task} />
              <button onClick={() => onStop(task.id)} title="Stop tracking" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.tealSoft, color: COLORS.teal }}>
                <Square size={13} />
              </button>
            </>
          ) : (
            <button onClick={() => onStart(task.id)} title="Start — blocks this time so it can't get bumped" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.tealSoft, color: COLORS.teal }}>
              <Play size={14} />
            </button>
          )
        )}
        {isDone ? (
          <button onClick={() => onUndo(task.id)} title="Undo — mark not done" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.greenSoft, color: COLORS.green }}>
            <RotateCcw size={14} />
          </button>
        ) : (
          task.type !== 'routine' && (
            <button onClick={() => onDone(task.id)} title="Mark done" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.greenSoft, color: COLORS.green }}>
              <Check size={14} />
            </button>
          )
        )}
        {!isDone && task.type !== 'routine' && (
          <button onClick={() => onMissed(task.id)} title="Mark missed" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.rustSoft, color: COLORS.rust }}>
            <XCircle size={14} />
          </button>
        )}
        {!task.isFixed && !isDone && (
          <button onClick={() => onMoreTime(task.id)} title="Need more time (+30 min)" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.tealSoft, color: COLORS.teal }}>
            <Clock size={14} />
          </button>
        )}
        <button onClick={() => onEdit(task)} title="Edit" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.indigoSoft, color: COLORS.indigo }}>
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(task.id)} title="Delete" className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
