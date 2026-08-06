import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import ProgressView from './components/ProgressView.jsx';
import SettingsView from './components/SettingsView.jsx';
import TaskModal from './components/TaskModal.jsx';
import { COLORS, DEFAULT_SETTINGS, DEFAULT_SUBJECTS } from './lib/constants.js';
import { dateStr, daysBetween, isOccurring, runScheduler, uid } from './lib/scheduler.js';
import { loadState, saveState } from './lib/storage.js';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [now, setNow] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState('checking'); // 'checking' | 'synced' | 'local'

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { state: saved, synced } = await loadState();
      if (saved) {
        if (saved.tasks) setTasks(saved.tasks);
        if (saved.subjects) setSubjects(saved.subjects);
        if (saved.settings) setSettings(saved.settings);
      }
      setSyncStatus(synced ? 'synced' : 'local');
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      const ok = await saveState({ tasks, subjects, settings });
      setSyncStatus(ok ? 'synced' : 'local');
    })();
  }, [tasks, subjects, settings, loaded]);

  const plannedTasks = useMemo(() => runScheduler(tasks, subjects, settings, now), [tasks, subjects, settings, now]);

  const today = dateStr(now);
  const todayTasks = plannedTasks
    .filter((t) => (t.isFixed ? isOccurring(t, today) : t.date === today))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  const atRiskTasks = plannedTasks.filter((t) => t.status === 'AT_RISK');
  const upcomingTasks = plannedTasks
    .filter((t) => t.status !== 'DONE' && t.status !== 'AT_RISK')
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const doneTasks = plannedTasks.filter((t) => t.status === 'DONE');

  function addTask(task) {
    setTasks((prev) => [...prev, { id: uid(), status: 'PENDING', missedCount: 0, createdAt: Date.now(), ...task }]);
  }
  function addTaskAndClose(task) {
    addTask(task);
    closeModal();
  }
  function saveTask(id, fields) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
    closeModal();
  }
  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }
  function markDone(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'DONE', completedAt: Date.now(), startedAt: null } : t)));
  }
  function undoDone(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'PENDING', completedAt: null } : t)));
  }
  function markMissed(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, missedCount: (t.missedCount || 0) + 1, startedAt: null } : t)));
  }
  function needMoreTime(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, durationMinutes: (t.durationMinutes || 30) + 30 } : t)));
  }
  function startTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, startedAt: Date.now() } : t)));
  }
  function stopTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, startedAt: null } : t)));
  }
  function forceRefresh() {
    setNow(new Date());
  }
  function openAdd() {
    setEditingTask(null);
    setModalOpen(true);
  }
  function openEdit(task) {
    setEditingTask(task);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditingTask(null);
  }

  const examDays = daysBetween(today, settings.examDate);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.paper, color: COLORS.inkSoft }}>
        <div className="text-sm tracking-wide">Loading your planner…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: COLORS.paper, color: COLORS.ink }}>
      <Sidebar view={view} setView={setView} examDays={examDays} atRiskCount={atRiskTasks.length} />
      <main className="flex-1 px-5 py-6 md:px-10 md:py-10 max-w-5xl w-full">
        {view === 'dashboard' && (
          <Dashboard
            todayTasks={todayTasks}
            atRiskTasks={atRiskTasks}
            subjects={subjects}
            onDone={markDone}
            onUndo={undoDone}
            onMissed={markMissed}
            onDelete={deleteTask}
            onMoreTime={needMoreTime}
            onEdit={openEdit}
            onAdd={openAdd}
            onQuickAdd={addTask}
            onRefresh={forceRefresh}
            onStart={startTask}
            onStop={stopTask}
          />
        )}
        {view === 'calendar' && <CalendarView tasks={plannedTasks} today={today} now={now} onEdit={openEdit} />}
        {view === 'tasks' && (
          <TasksView
            upcomingTasks={upcomingTasks}
            doneTasks={doneTasks}
            atRiskTasks={atRiskTasks}
            subjects={subjects}
            onDone={markDone}
            onUndo={undoDone}
            onMissed={markMissed}
            onDelete={deleteTask}
            onMoreTime={needMoreTime}
            onEdit={openEdit}
            onAdd={openAdd}
            onStart={startTask}
            onStop={stopTask}
          />
        )}
        {view === 'progress' && <ProgressView tasks={plannedTasks} subjects={subjects} />}
        {view === 'settings' && (
          <SettingsView subjects={subjects} setSubjects={setSubjects} settings={settings} setSettings={setSettings} syncStatus={syncStatus} />
        )}
      </main>
      {modalOpen && <TaskModal subjects={subjects} editingTask={editingTask} onAdd={addTaskAndClose} onSave={saveTask} onClose={closeModal} />}
    </div>
  );
}
