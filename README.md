# A/L Study Planner

A personal study planner with an auto-rescheduling engine for A/L exam prep.

## Local development

```bash
npm install
npm run dev
```

Visit the URL Vite prints (usually http://localhost:5173).

## Natural-language task input (optional)

The "Fill" button in the Add Task form uses a free model on OpenRouter to turn a sentence
like "combined maths class Monday 8 to 10am" into a filled-in task. Everything else in the
app works without this — you just type into the form fields directly instead.

To turn it on:

1. Get a free key at https://openrouter.ai/keys
2. Copy `.env.example` to `.env` and paste your key in
3. Restart `npm run dev`

The key is only ever read on the server (`api/parse-task.js`) — it's never sent to the browser.

Free OpenRouter models are rate-limited (roughly 20 requests/minute) and the specific free
model available changes over time. The default here is `google/gemma-4-26b-a4b-it:free`; if
it ever stops working, check https://openrouter.ai/models (filter for $0 pricing) and set
`OPENROUTER_MODEL` in your `.env` / Vercel environment variables to the new slug — no code
changes needed.

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new and import the repo — Vercel auto-detects Vite, no build
   config needed
3. Before (or after) the first deploy, go to Project Settings -> Environment Variables and add:
   - `OPENROUTER_API_KEY` = your key
4. Deploy

## Where your data lives

Tasks, subjects, and settings are stored in your browser's local storage — there's no
database. That means:
- Your data stays on whichever device/browser you actually use the app on (no sync between
  your phone and laptop unless you use the same browser profile)
- Clearing site data / browser storage for the deployed site will erase it
- If you want real cross-device sync later, the natural upgrade is a small database (Vercel
  Postgres or Supabase both have free tiers) — ask if you want that added

## How the scheduler works

- **Fixed** tasks (class, exam, routine) occupy a specific time and are never moved
  automatically
- **Flexible** tasks (homework, revision) have a duration and a deadline; the engine scores
  every flexible task by urgency (time needed vs. time left), your subject weight, and task
  type, then greedily places the highest-scoring ones into free time around your fixed
  commitments — preferring slots that match the task's energy/focus requirement
- The whole schedule is recalculated fresh every time something changes (task added, marked
  done, deleted, extended, or just time passing). That single mechanism is what makes "new
  task," "ran over," "finished early," and "missed" all work correctly without separate
  code paths for each
