// Pre-LLM denylist — the first, free safeguard. Runs before any paid model
// call so obviously-bad submissions never cost an LLM token. It is NOT the
// whole defense: it only catches listed terms; the generation-time `safe` flag
// (prompt.js) is the semantic net for coded/novel stuff a word list can't see.
//
// Two sources, matched together:
//   1. CURATED hand-list below — the incidents we've had to pull (atrocities,
//      hate symbols, dogwhistles). Our record, kept in the repo on purpose.
//   2. VENDORED google-profanity-words (profanity-words.js, MIT) — broad
//      obvious-profanity coverage, incl. leetspeak ("5h1t", "a55").
//
// Matching:
//   - single words → normalized (lowercase, alphanumerics only) and checked
//     against a Set per input word. So "isis" does NOT fire inside "crisis"
//     (whole-word), and "a55" matches "a55" regardless of surrounding punctuation.
//   - multi-word phrases → word-boundary regex tolerant of the punctuation /
//     spacing between words ("9/11", "9-11", "9 11" all match the "9 11" entry).
import { PROFANITY } from './profanity-words.js';

// Curated incidents / coded references — kept separate so it stays hand-owned.
const CURATED = [
  // real-world atrocities / terrorism (the twin-towers class we've had to pull)
  'twin towers', 'twin tower', 'world trade center', '9 11', 'nine eleven',
  'plane fire', 'school shooting', 'mass shooting', 'columbine',
  'bin laden', 'al qaeda', 'isis', 'jihad', 'suicide bomber',
  // hate symbols / groups
  'swastika', 'nazi', 'heil hitler', 'hitler', 'kkk', 'ku klux klan', 'white power',
  // coded sexual / illicit references (the pineapple class)
  'upside down pineapple',
];

// normalize a token to lowercase alphanumerics (drops punctuation/leetspeak seps)
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

function buildPhrasePattern(phrase) {
  const words = phrase.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/gi, ''));
  // words joined by "any run of non-alphanumerics", whole thing on \b edges
  return new RegExp(`\\b${words.join('[^a-z0-9]*')}\\b`, 'i');
}

// Split each source into single words (fast Set lookup) vs multi-word phrases.
const ALL = [...CURATED, ...PROFANITY];
const SINGLES = new Set(ALL.filter((t) => !/\s/.test(t)).map(norm).filter(Boolean));
const PHRASE_PATTERNS = ALL.filter((t) => /\s/.test(t)).map(buildPhrasePattern);

// True when the text hits a banned term. Cheap: one tokenize + N phrase regexes.
export function denylistHit(text) {
  if (typeof text !== 'string') return false;
  for (const token of text.split(/\s+/)) {
    if (SINGLES.has(norm(token))) return true;
  }
  return PHRASE_PATTERNS.some((re) => re.test(text));
}
