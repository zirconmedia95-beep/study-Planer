import { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { COLORS, TYPE_CONFIG } from '../lib/constants.js';
import { dateStr } from '../lib/scheduler.js';
import { Field } from './ui.jsx';

export default function TaskModal({ subjects, editingTask, onAdd, onSave, onClose }) {
  const isEdit = !!editingTask;
  const [nlText, setNlText] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState('');

  const [type, setType] = useState(editingTask?.type || 'homework');
  const [name, setName] = useState(editingTask?.name || '');
  const [subject, setSubject] = useState(editingTask?.subject || 's1');
  const [date, setDate] = useState(editingTask?.date || '');
  const [startTime, setStartTime] = useState(editingTask?.startTime || '');
  const [endTime, setEndTime] = useState(editingTask?.endTime || '');
  const [recurEnabled, setRecurEnabled] = useState(!!editingTask?.recurrence);
  const [recurFreq, setRecurFreq] = useState(editingTask?.recurrence?.freq || 'daily');
  const [recurUntil, setRecurUntil] = useState(editingTask?.recurrence?.until || '');
  const [duration, setDuration] = useState(editingTask?.durationMinutes || 45);
  const [deadlineDate, setDeadlineDate] = useState(editingTask?.deadlineDate || '');
  const [deadlineTime, setDeadlineTime] = useState(editingTask?.deadlineTime || '18:00');
  const [energy, setEnergy] = useState(editingTask?.energyRequired || 'medium');

  const cfg = TYPE_CONFIG[type];

  function applyParsed(t) {
    if (t.type && TYPE_CONFIG[t.type]) setType(t.type);
    if (t.name) setName(t.name);
    if (t.subject) setSubject(t.subject);
    if (t.date) setDate(t.date);
    if (t.startTime) setStartTime(t.startTime);
    if (t.endTime) setEndTime(t.endTime);
    if (t.recurFreq) {
      setRecurEnabled(true);
      setRecurFreq(t.recurFreq);
      if (t.recurUntil) setRecurUntil(t.recurUntil);
    }
    if (t.durationMinutes) setDuration(t.durationMinutes);
    if (t.deadlineDate) setDeadlineDate(t.deadlineDate);
    if (t.deadlineTime) setDeadlineTime(t.deadlineTime);
    if (t.energyRequired) setEnergy(t.energyRequired);
  }

  async function parseWithAI() {
    if (!nlText.trim()) return;
    setNlLoading(true);
    setNlError('');
    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlText, today: dateStr(new Date()), subjects }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');
      applyParsed(data.task || {});
    } catch (e) {
      setNlError(e.message || 'Something went wrong — fill the form manually below.');
    } finally {
      setNlLoading(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const base = {
      name: name.trim(),
      subject: cfg.noSubject ? 'general' : subject,
      type,
      isFixed: cfg.fixed,
      energyRequired: energy,
    };
    let payload;
    if (cfg.fixed) {
      if (!date || !startTime || !endTime) return;
      payload = {
        ...base,
        date,
        startTime,
        endTime,
        recurrence: cfg.recurring && recurEnabled ? { freq: recurFreq, until: recurUntil || null } : null,
        durationMinutes: null,
        deadlineDate: null,
        deadlineTime: null,
      };
    } else {
      if (!deadlineDate) return;
      payload = { ...base, durationMinutes: Number(duration), deadlineDate, deadlineTime, date: null, startTime: null, endTime: null, recurrence: null };
    }
    if (isEdit) onSave(editingTask.id, payload);
    else onAdd(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(31,36,40,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: COLORS.card, boxShadow: '0 20px 50px rgba(31,36,40,0.25)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit task' : 'New task'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:opacity-70 transition-opacity" style={{ color: COLORS.inkSoft }}>
            <X size={18} />
          </button>
        </div>

        {!isEdit && (
          <div className="mb-5 p-3 rounded-xl" style={{ background: COLORS.paperAlt }}>
            <div className="text-xs font-medium mb-2" style={{ color: COLORS.inkSoft }}>
              Describe it in your own words (optional)
            </div>
            <div className="flex gap-2">
              <input
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder="e.g. Combined maths online class Monday 8-10am"
                className="flex-1 text-sm px-2.5 py-2 rounded-lg border min-w-0"
                style={{ borderColor: COLORS.line }}
              />
              <button
                type="button"
                onClick={parseWithAI}
                disabled={nlLoading}
                className="px-3 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 shrink-0 transition-opacity"
                style={{ background: COLORS.indigo, opacity: nlLoading ? 0.7 : 1 }}
              >
                {nlLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Fill
              </button>
            </div>
            {nlError && (
              <div className="text-xs mt-1.5" style={{ color: COLORS.amber }}>
                {nlError}
              </div>
            )}
            <div className="text-[11px] mt-1.5" style={{ color: COLORS.inkSoft }}>
              Fills the fields below — check them before saving.
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Field label="Name">
            <input
              autoFocus={isEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Combined maths — past paper 2023"
              className="w-full text-sm px-2.5 py-2 rounded-lg border"
              style={{ borderColor: COLORS.line }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {!cfg.noSubject && (
              <Field label="Subject">
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }}>
                  <option value="s1">{subjects.s1.name}</option>
                  <option value="s2">{subjects.s2.name}</option>
                  <option value="s3">{subjects.s3.name}</option>
                  <option value="general">General / other</option>
                </select>
              </Field>
            )}
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {cfg.fixed ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
                <Field label="Start">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
                <Field label="End">
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
              </div>
              {cfg.recurring && (
                <div className="p-3 rounded-xl" style={{ background: COLORS.paperAlt }}>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <input type="checkbox" checked={recurEnabled} onChange={(e) => setRecurEnabled(e.target.checked)} />
                    Repeats
                  </label>
                  {recurEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Frequency">
                        <select value={recurFreq} onChange={(e) => setRecurFreq(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </Field>
                      <Field label="Until (optional)">
                        <input type="date" value={recurUntil} onChange={(e) => setRecurUntil(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                      </Field>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (minutes)">
                  <input type="number" min="10" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
                <Field label="Focus needed">
                  <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Deadline date">
                  <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
                <Field label="Deadline time">
                  <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: COLORS.line }} />
                </Field>
              </div>
            </>
          )}
        </div>

        <button type="submit" className="w-full mt-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo }}>
          {isEdit ? 'Save changes' : 'Add task'}
        </button>
      </form>
    </div>
  );
}
