import { useState } from 'react';
import { COLORS, SUBJECT_HUES } from '../lib/constants.js';
import { getPasscode, setPasscode } from '../lib/storage.js';
import { Field } from './ui.jsx';

export default function SettingsView({ subjects, setSubjects, settings, setSettings, syncStatus }) {
  const [passcode, setPasscodeInput] = useState(getPasscode());
  const [justSaved, setJustSaved] = useState(false);

  function savePasscode() {
    setPasscode(passcode.trim());
    setJustSaved(true);
    // Simplest reliable way to make the rest of the app pick up the new passcode
    // immediately and re-attempt a sync with it.
    setTimeout(() => window.location.reload(), 600);
  }

  const statusLabel =
    syncStatus === 'synced' ? 'Synced ✓' : syncStatus === 'checking' ? 'Checking…' : 'Not synced — saving to this device only';
  const statusColor = syncStatus === 'synced' ? COLORS.green : syncStatus === 'checking' ? COLORS.inkSoft : COLORS.amber;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="mb-8 p-5 rounded-xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        <div className="text-sm font-medium mb-2">Sync across devices</div>
        <p className="text-xs mb-3" style={{ color: COLORS.inkSoft }}>
          Enter the same passcode here and on your other device (e.g. your phone and your laptop) to share one set of
          tasks between them. This must match the <code>APP_PASSCODE</code> environment variable you set in Vercel — see
          the README for the one-time setup.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="Sync passcode"
            className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border min-w-0"
            style={{ borderColor: COLORS.line }}
          />
          <button type="button" onClick={savePasscode} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shrink-0 hover:opacity-90 transition-opacity" style={{ background: COLORS.indigo }}>
            Save
          </button>
        </div>
        <div className="text-xs mt-2" style={{ color: statusColor }}>
          {statusLabel}
          {justSaved && ' · saved, reloading…'}
        </div>
      </div>

      <div className="mb-8 p-5 rounded-xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        <div className="text-sm font-medium mb-3">Exam & study window</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Exam date">
            <input type="date" value={settings.examDate} onChange={(e) => setSettings({ ...settings, examDate: e.target.value })} className="w-full text-sm px-2.5 py-1.5 rounded-lg border" style={{ borderColor: COLORS.line }} />
          </Field>
          <Field label="Study day starts">
            <input type="time" value={settings.studyStart} onChange={(e) => setSettings({ ...settings, studyStart: e.target.value })} className="w-full text-sm px-2.5 py-1.5 rounded-lg border" style={{ borderColor: COLORS.line }} />
          </Field>
          <Field label="Study day ends">
            <input type="time" value={settings.studyEnd} onChange={(e) => setSettings({ ...settings, studyEnd: e.target.value })} className="w-full text-sm px-2.5 py-1.5 rounded-lg border" style={{ borderColor: COLORS.line }} />
          </Field>
        </div>
        <p className="text-xs mt-3" style={{ color: COLORS.inkSoft }}>
          The first third of this window counts as high-energy, the middle third medium, the last third low — used to place harder tasks earlier.
        </p>
      </div>

      <div className="p-5 rounded-xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        <div className="text-sm font-medium mb-3">Your three subjects</div>
        <div className="space-y-3">
          {['s1', 's2', 's3'].map((k, i) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SUBJECT_HUES[i] }} />
              <input
                value={subjects[k].name}
                onChange={(e) => setSubjects({ ...subjects, [k]: { ...subjects[k], name: e.target.value } })}
                className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border min-w-0"
                style={{ borderColor: COLORS.line }}
              />
              <input
                type="range"
                min="1"
                max="10"
                value={subjects[k].weight}
                onChange={(e) => setSubjects({ ...subjects, [k]: { ...subjects[k], weight: Number(e.target.value) } })}
                className="w-24 sm:w-28 shrink-0"
              />
              <span className="text-xs w-5 text-right tabular-nums shrink-0" style={{ color: COLORS.inkSoft }}>
                {subjects[k].weight}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: COLORS.inkSoft }}>
          Higher weight means that subject's tasks get scheduled sooner when things compete for time.
        </p>
      </div>
    </div>
  );
}
