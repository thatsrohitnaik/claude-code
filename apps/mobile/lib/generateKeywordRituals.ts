// Generate keyword-based rituals using Gemini

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyCLreKOn7QANaxz01I3jNdZeuOH7ZWsaRQ';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export type GeneratedRitual = {
  title: string;
  emoji: string;
  frequency: string;
  preferred_day: string | null;
  preferred_time: string | null;
  why: string;
  category: string;
};

export async function generateKeywordRituals(
  keyword: string,
  clarification: string | null
): Promise<GeneratedRitual[]> {
  const context = clarification
    ? `Keyword: "${keyword}", Context: "${clarification}"`
    : `Keyword: "${keyword}"`;

  const prompt = `
${context}

Generate 8-10 practical rituals/reminders for someone
who wants to stay on top of "${keyword}".

Make them specific and genuinely useful — not generic.
Mix frequencies (daily, weekly, monthly, yearly).
Use relevant emojis.

Return ONLY a JSON array in this exact format:
[
  {
    "title": "Short action title (max 6 words)",
    "emoji": "single relevant emoji",
    "frequency": "daily|every_2_days|every_3_days|weekly|every_2_weeks|monthly|every_3_months|every_6_months|yearly",
    "preferred_day": "mon|tue|wed|thu|fri|sat|sun or null",
    "preferred_time": "morning|afternoon|evening or null",
    "why": "One sentence — why this matters",
    "category": "${keyword}"
  }
]

Now generate for: ${context}
Return ONLY the JSON array.
`;

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed;
  } catch (error) {
    console.error('Gemini generation error:', error);
    return getFallbackItems(keyword);
  }
}

// Generate "while you're at it" suggestion
export async function generateWhileYoureAtIt(
  keyword: string,
  clarification: string | null
): Promise<GeneratedRitual | null> {
  const context = clarification
    ? `Keyword: "${keyword}", Context: "${clarification}"`
    : `Keyword: "${keyword}"`;

  const prompt = `
User is setting up rituals for: "${keyword}"
(context: "${clarification || 'none'}").

Suggest ONE related ritual they probably haven't
thought of. Must be genuinely useful and slightly
unexpected — not an obvious one.

Return ONLY JSON (no markdown):
{
  "title": "Short title",
  "emoji": "single emoji",
  "why": "One sentence — why this is easy to forget but important",
  "frequency": "daily|weekly|monthly|yearly",
  "preferred_day": "mon|tue|wed|thu|fri|sat|sun or null",
  "preferred_time": "morning|afternoon|evening or null"
}
`;

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      ...parsed,
      category: keyword,
    };
  } catch (error) {
    console.error('While you\'re at it error:', error);
    return null;
  }
}

// Fallback if AI fails
function getFallbackItems(keyword: string): GeneratedRitual[] {
  return [
    {
      title: `Weekly ${keyword} check`,
      emoji: '✅',
      frequency: 'weekly',
      preferred_day: 'sun',
      preferred_time: 'morning',
      why: `Stay on top of your ${keyword}`,
      category: keyword,
    },
    {
      title: `Monthly ${keyword} review`,
      emoji: '📋',
      frequency: 'monthly',
      preferred_day: null,
      preferred_time: null,
      why: `Regular review keeps things running smoothly`,
      category: keyword,
    },
  ];
}