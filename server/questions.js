import { readFileSync } from 'node:fs';
import he from 'he';

export const TEAMS = ['A', 'B', 'C'];

// Open Trivia DB exports contain HTML entities (&quot;, &eacute;, ...) which React would render
// literally, so decode once at load. Trim because the file has stray leading spaces.
const clean = (s) => he.decode(String(s)).trim();

const raw = JSON.parse(readFileSync(new URL('../questions.JSON', import.meta.url), 'utf8'));

export const questions = raw.map((q, id) => ({
  id,
  team: q.team,
  category: clean(q.category),
  question: clean(q.question),
  correctAnswer: clean(q.correct_answer),
  incorrectAnswers: q.incorrect_answers.map(clean),
}));

const untagged = questions.filter((q) => !TEAMS.includes(q.team));
if (untagged.length > 0) {
  console.error(
    `questions.JSON: ${untagged.length} Einträge ohne gültiges "team" (A/B/C) an Index ` +
      untagged.map((q) => `${q.id} (${JSON.stringify(q.team)})`).join(', '),
  );
  process.exit(1);
}

console.log(
  'Fragen geladen: ' +
    TEAMS.map((t) => `${t}=${questions.filter((q) => q.team === t).length}`).join(' '),
);

// mulberry32 – tiny seedable PRNG so a player's question order is random but stable across requests.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function isTeam(team) {
  return TEAMS.includes(team);
}

// The team's questions in an order that is fixed per seed (use the player's id).
export function questionsForPlayer(team, seed) {
  return shuffle(
    questions.filter((q) => q.team === team),
    seededRandom(seed),
  );
}

// What the phone gets to see: no correct flag, answers in fresh random order.
export function publicView(q) {
  return {
    id: q.id,
    category: q.category,
    question: q.question,
    answers: shuffle([q.correctAnswer, ...q.incorrectAnswers]),
  };
}
