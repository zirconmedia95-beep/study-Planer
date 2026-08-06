// Runs as a Vercel serverless function (Node runtime). Never expose the
// OpenRouter key to the browser — it stays in this file, read from an
// environment variable set in Vercel's dashboard, and is never sent to the client.

const DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it:free';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing OPENROUTER_API_KEY. Add it in Vercel Project Settings -> Environment Variables.' });
    return;
  }

  const { text, today, subjects } = req.body || {};
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing "text" in request body' });
    return;
  }

  const subjectList = subjects && typeof subjects === 'object'
    ? Object.entries(subjects).map(([k, v]) => `${k} = ${v.name}`).join(', ')
    : 's1, s2, s3';

  const systemPrompt = `You convert a student's natural-language planning note into a single JSON object describing a task. Return ONLY the JSON object - no markdown fences, no explanation, no extra text.

Today's date is ${today} (YYYY-MM-DD). Known subject keys: ${subjectList}. If the note doesn't clearly match one of these, use "general". Use "general" and type "personal" for non-study items (meals, breaks, sleep, prayer, etc).

Fields, exactly:
{
  "name": string,
  "subject": one of the known subject keys, or "general",
  "type": "class" | "exam" | "routine" | "personal" | "homework" | "revision",
  "isFixed": boolean (true for class/exam/routine/personal, false for homework/revision),
  "date": "YYYY-MM-DD" or null (required if isFixed is true),
  "startTime": "HH:MM" 24-hour or null (required if isFixed is true),
  "endTime": "HH:MM" 24-hour or null (required if isFixed is true),
  "recurFreq": "daily" | "weekly" | "monthly" | null (only if the note implies it repeats),
  "recurUntil": "YYYY-MM-DD" or null (a sensible end date if recurFreq is set, e.g. one month out if not stated),
  "durationMinutes": number or null (required if isFixed is false; estimate if not stated),
  "deadlineDate": "YYYY-MM-DD" or null (required if isFixed is false),
  "deadlineTime": "HH:MM" or null (default "18:00" if isFixed is false and not stated),
  "energyRequired": "high" | "medium" | "low" (estimate from difficulty if not stated)
}

Resolve relative dates ("Monday", "next week", "tomorrow", "every day") against today's date. Make a reasonable assumption for anything missing rather than leaving a required field null.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers.origin || 'https://vercel.app',
        'X-Title': 'A/L Study Planner',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: `OpenRouter error ${response.status}`, detail: errText });
      return;
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      res.status(502).json({ error: 'Model did not return valid JSON', raw });
      return;
    }

    res.status(200).json({ task: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Request to OpenRouter failed', detail: String(err) });
  }
}
