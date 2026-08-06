import { COLORS } from '../lib/constants.js';

export function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs mb-1" style={{ color: COLORS.inkSoft }}>
        {label}
      </div>
      {children}
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: COLORS.inkSoft }}>
        {title}
      </div>
      <div className="rounded-xl px-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
        {children}
      </div>
    </div>
  );
}

export function Empty({ text }) {
  return (
    <div className="py-6 text-center text-sm" style={{ color: COLORS.inkSoft }}>
      {text}
    </div>
  );
}

export function StatBox({ label, value, color }) {
  return (
    <div className="p-4 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, boxShadow: '0 1px 3px rgba(31,36,40,0.05)' }}>
      <div className="text-2xl font-semibold tabular-nums" style={{ color, fontFamily: 'ui-monospace, monospace' }}>
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: COLORS.inkSoft }}>
        {label}
      </div>
    </div>
  );
}
