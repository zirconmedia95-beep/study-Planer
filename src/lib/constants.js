export const COLORS = {
  paper: '#F3F4F1',
  paperAlt: '#EAEBE6',
  card: '#FFFFFF',
  ink: '#1F2428',
  inkSoft: '#5B6570',
  line: '#DDDFDA',
  indigo: '#2B3A67',
  indigoSoft: '#E8EAF2',
  rust: '#B15A3D',
  rustSoft: '#F6E7E1',
  teal: '#2C7A7B',
  tealSoft: '#E2EEEE',
  green: '#3F7D5C',
  greenSoft: '#E5EFE9',
  amber: '#C4432B',
  amberSoft: '#F8E5E0',
};

export const SUBJECT_HUES = [COLORS.teal, COLORS.indigo, COLORS.rust];

// `recurring: true` types can repeat daily/weekly/monthly (see TaskModal + scheduler isOccurring).
// `hiddenFromCalendar: true` keeps a type out of the Calendar view's blocks (it still blocks
// scheduling time for flexible tasks) — used for personal time like meals/breaks.
// `noSubject: true` hides the subject picker for that type in the form.
export const TYPE_CONFIG = {
  class: { label: 'Class / lecture', fixed: true },
  exam: { label: 'Exam / test', fixed: true },
  routine: { label: 'Routine', fixed: true, recurring: true },
  personal: { label: 'Personal / break', fixed: true, recurring: true, hiddenFromCalendar: true, noSubject: true },
  homework: { label: 'Homework', fixed: false },
  revision: { label: 'Revision', fixed: false },
};

export const TYPE_WEIGHT = { exam: 1.5, homework: 1.2, revision: 1.1, routine: 0.8, class: 1 };

export const DEFAULT_SUBJECTS = {
  s1: { name: 'Subject 1', weight: 6 },
  s2: { name: 'Subject 2', weight: 6 },
  s3: { name: 'Subject 3', weight: 6 },
};

export const DEFAULT_SETTINGS = {
  examDate: '2027-08-01',
  studyStart: '08:00',
  studyEnd: '20:00',
};
