import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS, SUBJECT_HUES, TYPE_CONFIG } from '../lib/constants.js';
import { addDays, dateStr, fmtDate, isOccurring, parseLocalDate, toMinutes } from '../lib/scheduler.js';

const DAY_START = 0; // 00:00 — full day, scrollable
const DAY_END = 24 * 60; // 24:00
const PX_PER_MIN = 1;

function startOfWeek(ds) {
  const d = parseLocalDate(ds);
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday-based week
  d.setDate(d.getDate() + diff);
  return dateStr(d);
}

export default function CalendarView({ tasks, today, now, onEdit }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const hours = [];
  for (let m = DAY_START; m <= DAY_END; m += 60) hours.push(m);
  const scrollRef = useRef(null);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Jump the view to roughly "now" whenever the visible week changes (including first mount) —
  // without this a full 24h grid would open at midnight, which is the wrong default.
  useEffect(() => {
    if (scrollRef.current && days.includes(today)) {
      const target = Math.max(0, (nowMinutes - DAY_START - 120) * PX_PER_MIN);
      scrollRef.current.scrollTop = target;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  function tasksForDay(ds) {
    return tasks.filter((t) => {
      if (!t.startTime || !t.endTime) return false;
      if (TYPE_CONFIG[t.type]?.hiddenFromCalendar) return false;
      return t.isFixed ? isOccurring(t, ds) : t.date === ds;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(today))} className="px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
            This week
          </button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.line}`, background: COLORS.card, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
          <div />
          {days.map((ds) => (
            <div
              key={ds}
              className="text-center py-2 text-xs font-medium border-l"
              style={{ borderColor: COLORS.line, background: ds === today ? COLORS.indigoSoft : 'transparent', color: ds === today ? COLORS.indigo : COLORS.ink }}
            >
              {fmtDate(ds)}
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="relative overflow-y-auto scroll-thin" style={{ maxHeight: '65vh' }}>
          <div className="grid" style={{ gridTemplateColumns: '52px repeat(7, 1fr)', height: (DAY_END - DAY_START) * PX_PER_MIN }}>
            <div className="relative">
              {hours.map((m) => (
                <div key={m} className="absolute w-full text-right pr-1.5 text-[10px]" style={{ top: (m - DAY_START) * PX_PER_MIN - 6, color: COLORS.inkSoft }}>
                  {String(Math.floor(m / 60) % 24).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {days.map((ds) => (
              <div key={ds} className="relative border-l" style={{ borderColor: COLORS.line }}>
                {hours.map((m) => (
                  <div key={m} className="absolute w-full border-t" style={{ top: (m - DAY_START) * PX_PER_MIN, borderColor: COLORS.paperAlt }} />
                ))}
                {ds === today && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
                  <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none" style={{ top: (nowMinutes - DAY_START) * PX_PER_MIN }}>
                    <div className="w-2 h-2 rounded-full -ml-1 shrink-0" style={{ background: COLORS.amber }} />
                    <div className="flex-1 h-px" style={{ background: COLORS.amber }} />
                  </div>
                )}
                {tasksForDay(ds).map((t) => {
                  const s = Math.max(toMinutes(t.startTime), DAY_START);
                  const e = Math.min(toMinutes(t.endTime), DAY_END);
                  if (e <= s) return null;
                  const hueIdx = ['s1', 's2', 's3'].indexOf(t.subject);
                  const hue = hueIdx >= 0 ? SUBJECT_HUES[hueIdx] : COLORS.inkSoft;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t, ds)}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 overflow-hidden text-left text-[10px] leading-tight hover:brightness-95 transition-[filter]"
                      style={{
                        top: (s - DAY_START) * PX_PER_MIN,
                        height: Math.max((e - s) * PX_PER_MIN, 16),
                        background: t.status === 'DONE' ? COLORS.greenSoft : t.isFixed ? COLORS.indigoSoft : COLORS.tealSoft,
                        borderLeft: `3px solid ${hue}`,
                        color: COLORS.ink,
                      }}
                      title={`${t.name} (${t.startTime}-${t.endTime}) — click to edit`}
                    >
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="truncate" style={{ color: COLORS.inkSoft }}>
                        {t.startTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs flex-wrap" style={{ color: COLORS.inkSoft }}>
        <LegendDot color={COLORS.indigo} label="Fixed" />
        <LegendDot color={COLORS.teal} label="Scheduled" />
        <LegendDot color={COLORS.green} label="Done" />
        <LegendDot color={COLORS.amber} label="Now" />
        <span>Personal/break blocks are hidden here but still reserve the time.</span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
