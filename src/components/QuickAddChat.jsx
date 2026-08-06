import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { COLORS, TYPE_CONFIG } from '../lib/constants.js';
import { dateStr } from '../lib/scheduler.js';

export default function QuickAddChat({ subjects, onAdd }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([
    { role: 'assistant', text: 'Tell me what\'s up — e.g. "Physics revision, 1 hour, due Thursday 6pm" — and I\'ll add it straight to your schedule.' },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log, loading]);

  async function submit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || loading) return;
    setLog((l) => [...l, { role: 'user', text: value }]);
    setText('');
    setLoading(true);
    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, today: dateStr(new Date()), subjects }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reach the parser');
      const t = data.task || {};
      if (!t.name) throw new Error('Missing a task name — try rephrasing');

      const validType = TYPE_CONFIG[t.type] ? t.type : 'homework';
      const cfg = TYPE_CONFIG[validType];
      const payload = {
        name: t.name,
        subject: cfg.noSubject ? 'general' : t.subject || 'general',
        type: validType,
        isFixed: cfg.fixed,
        energyRequired: t.energyRequired || 'medium',
      };

      if (cfg.fixed) {
        if (!t.date || !t.startTime || !t.endTime) throw new Error('Missing a date/time — try being more specific');
        payload.date = t.date;
        payload.startTime = t.startTime;
        payload.endTime = t.endTime;
        payload.recurrence = t.recurFreq ? { freq: t.recurFreq, until: t.recurUntil || null } : null;
      } else {
        if (!t.deadlineDate) throw new Error('Missing a deadline — try including one');
        payload.durationMinutes = t.durationMinutes || 30;
        payload.deadlineDate = t.deadlineDate;
        payload.deadlineTime = t.deadlineTime || '18:00';
      }

      onAdd(payload);
      const subjLabel = subjects[payload.subject]?.name || (payload.subject === 'general' ? 'General' : payload.subject);
      const when = payload.isFixed ? `${payload.date} ${payload.startTime}–${payload.endTime}` : `due ${payload.deadlineDate}`;
      setLog((l) => [...l, { role: 'assistant', text: `Added "${payload.name}" (${subjLabel}, ${when}) and rebuilt the schedule.` }]);
    } catch (err) {
      setLog((l) => [...l, { role: 'assistant', error: true, text: `Couldn't add that — ${err.message}. You can also use "Add task" for the full form.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: COLORS.inkSoft }}>
        <Sparkles size={13} style={{ color: COLORS.indigo }} />
        Quick add
      </div>
      <div ref={scrollRef} className="px-4 pb-2 max-h-40 overflow-y-auto space-y-2 scroll-thin">
        {log.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : ''}`}>
            <span
              className="inline-block px-3 py-1.5 rounded-lg max-w-[85%]"
              style={{
                background: m.role === 'user' ? COLORS.indigoSoft : m.error ? COLORS.amberSoft : COLORS.paperAlt,
                color: m.role === 'user' ? COLORS.indigo : m.error ? COLORS.amber : COLORS.ink,
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
              <Loader2 size={12} className="animate-spin" /> thinking…
            </span>
          </div>
        )}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 px-3 py-2.5 border-t" style={{ borderColor: COLORS.line }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Chemistry homework, 1hr, due Friday 6pm"
          className="flex-1 text-sm px-3 py-2 rounded-lg border min-w-0"
          style={{ borderColor: COLORS.line }}
        />
        <button type="submit" disabled={loading} className="p-2.5 rounded-lg text-white shrink-0 hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo, opacity: loading ? 0.7 : 1 }}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
