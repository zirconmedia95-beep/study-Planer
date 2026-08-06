import { TYPE_WEIGHT } from './constants.js';

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function toTimeStr(mins) {
  mins = Math.max(0, Math.round(mins));
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function parseLocalDate(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateStr(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(ds, n) {
  const d = parseLocalDate(ds);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

export function daysBetween(a, b) {
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
}

export function fmtDate(ds) {
  if (!ds) return '';
  return parseLocalDate(ds).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function isOccurring(task, ds) {
  if (!task.isFixed) return false;
  if (!task.recurrence) return task.date === ds;
  if (ds < task.date) return false;
  if (task.recurrence.until && ds > task.recurrence.until) return false;
  const { freq } = task.recurrence;
  if (freq === 'weekly') return parseLocalDate(ds).getDay() === parseLocalDate(task.date).getDay();
  if (freq === 'monthly') return parseLocalDate(ds).getDate() === parseLocalDate(task.date).getDate();
  return true; // daily
}

// `extraBlocks` are additional [start,end] minute ranges to treat as occupied for this
// day — used to pin tasks the user has explicitly started (see runScheduler).
function occupiedIntervals(tasks, ds, extraBlocks) {
  const fixed = tasks
    .filter((t) => t.isFixed && isOccurring(t, ds))
    .map((t) => [toMinutes(t.startTime), toMinutes(t.endTime)]);
  return [...fixed, ...(extraBlocks || [])].sort((a, b) => a[0] - b[0]);
}

export function energyBand(minuteOfDay, studyStart, studyEnd) {
  const s = toMinutes(studyStart), e = toMinutes(studyEnd);
  const span = Math.max(e - s, 1);
  const pos = (minuteOfDay - s) / span;
  if (pos < 1 / 3) return 'high';
  if (pos < 2 / 3) return 'medium';
  return 'low';
}

function freeIntervals(tasks, ds, studyStart, studyEnd, now, extraBlocks) {
  let start = toMinutes(studyStart);
  const end = toMinutes(studyEnd);
  if (ds === dateStr(now)) {
    start = Math.max(start, now.getHours() * 60 + now.getMinutes() + 5);
  }
  if (start >= end) return [];
  const occ = occupiedIntervals(tasks, ds, extraBlocks);
  const merged = [];
  for (const [s, e] of occ) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }
  const free = [];
  let cursor = start;
  for (const [s, e] of merged) {
    if (s > cursor) free.push([cursor, Math.min(s, end)]);
    cursor = Math.max(cursor, e);
    if (cursor >= end) break;
  }
  if (cursor < end) free.push([cursor, end]);
  return free.filter(([s, e]) => e > s);
}

export function computeScore(task, subjects, now) {
  if (!task.deadlineDate) return 1;
  const deadline = new Date(`${task.deadlineDate}T${task.deadlineTime || '23:59'}`);
  const hoursUntil = Math.max((deadline - now) / 3600000, 0.1);
  const hoursNeeded = (task.durationMinutes || 30) / 60;
  const urgency = hoursNeeded / hoursUntil;
  const subj = subjects[task.subject];
  const subjWeight = subj ? subj.weight : 3;
  const typeWeight = TYPE_WEIGHT[task.type] ?? 1;
  return Math.round((urgency * 40 * typeWeight + subjWeight * 3) * 10) / 10;
}

export function runScheduler(tasksIn, subjects, settings, now) {
  const tasks = tasksIn.map((t) => ({ ...t }));
  const today = dateStr(now);

  const flexible = tasks.filter((t) => !t.isFixed && t.status !== 'DONE');
  flexible.forEach((t) => {
    t.score = computeScore(t, subjects, now);
  });

  // Tasks the user explicitly started stay pinned to when they were started, and block
  // that time like a fixed event — this is what stops everything else from getting
  // crammed into "now" when you come back mid-task without having touched the app.
  const inProgress = flexible.filter((t) => t.startedAt);
  const toSchedule = flexible.filter((t) => !t.startedAt);
  toSchedule.sort((a, b) => b.score - a.score);

  const pinned = {}; // ds -> [[s,e], ...]
  inProgress.forEach((t) => {
    const started = new Date(t.startedAt);
    const ds = dateStr(started);
    const startMin = started.getHours() * 60 + started.getMinutes();
    const estEnd = startMin + (t.durationMinutes || 30);
    const nowMin = ds === today ? now.getHours() * 60 + now.getMinutes() : estEnd;
    const endMin = Math.min(Math.max(estEnd, nowMin), 24 * 60 - 1);
    t.date = ds;
    t.startTime = toTimeStr(startMin);
    t.endTime = toTimeStr(endMin);
    t.status = 'IN_PROGRESS';
    if (!pinned[ds]) pinned[ds] = [];
    pinned[ds].push([startMin, endMin]);
  });

  let maxDeadline = today;
  toSchedule.forEach((t) => {
    if (t.deadlineDate && t.deadlineDate > maxDeadline) maxDeadline = t.deadlineDate;
  });
  const horizonDays = Math.min(90, Math.max(7, daysBetween(today, maxDeadline) + 2));

  const dayCache = {};
  function getFree(ds) {
    if (!dayCache[ds]) dayCache[ds] = freeIntervals(tasks, ds, settings.studyStart, settings.studyEnd, now, pinned[ds]);
    return dayCache[ds];
  }

  for (const task of toSchedule) {
    const deadline = task.deadlineDate || addDays(today, horizonDays);
    const lastDay = Math.max(0, daysBetween(today, deadline));
    let placed = false;
    for (let pass = 0; pass < 2 && !placed; pass++) {
      for (let d = 0; d <= lastDay && !placed; d++) {
        const ds = addDays(today, d);
        if (ds > deadline) break;
        const free = getFree(ds);
        for (let i = 0; i < free.length && !placed; i++) {
          const [s, e] = free[i];
          const needed = task.durationMinutes || 30;
          if (e - s < needed) continue;
          if (ds === task.deadlineDate) {
            const deadlineMin = toMinutes(task.deadlineTime || '23:59');
            if (s + needed > deadlineMin) continue;
          }
          if (pass === 0 && energyBand(s, settings.studyStart, settings.studyEnd) !== task.energyRequired) continue;
          task.date = ds;
          task.startTime = toTimeStr(s);
          task.endTime = toTimeStr(s + needed);
          task.status = 'SCHED';
          free[i] = [s + needed, e];
          dayCache[ds] = free.filter(([fs, fe]) => fe > fs);
          placed = true;
        }
      }
    }
    if (!placed) {
      task.status = 'AT_RISK';
      task.date = null;
      task.startTime = null;
      task.endTime = null;
    }
  }

  const nowStr = `${dateStr(now)}T${toTimeStr(now.getHours() * 60 + now.getMinutes())}`;
  return tasks.map((t) => {
    if (t.isFixed) {
      if (t.status === 'DONE') return t;
      const pastDue = !t.recurrence && t.date && `${t.date}T${t.endTime}` < nowStr;
      return { ...t, status: pastDue ? 'MISSED' : 'LOCKED' };
    }
    return flexible.find((f) => f.id === t.id) || t;
  });
}

export function statusMeta(status, COLORS) {
  switch (status) {
    case 'LOCKED':
      return { label: 'Fixed', bg: COLORS.indigoSoft, fg: COLORS.indigo };
    case 'SCHED':
      return { label: 'Scheduled', bg: COLORS.tealSoft, fg: COLORS.teal };
    case 'IN_PROGRESS':
      return { label: 'In progress', bg: COLORS.tealSoft, fg: COLORS.teal };
    case 'DONE':
      return { label: 'Done', bg: COLORS.greenSoft, fg: COLORS.green };
    case 'AT_RISK':
      return { label: 'At risk', bg: COLORS.amberSoft, fg: COLORS.amber };
    case 'MISSED':
      return { label: 'Missed', bg: COLORS.rustSoft, fg: COLORS.rust };
    default:
      return { label: status, bg: COLORS.paperAlt, fg: COLORS.inkSoft };
  }
}
