// Accurate chord transposition and enharmonic normalization for live performances

export const ROOT_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const ROOT_NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

// Key mapping to semitone index (0 = C, 1 = C#/Db, ..., 11 = B)
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'DB': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'EB': 3, 'Eb': 3,
  'E': 4, 'FB': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'GB': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'AB': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'BB': 10, 'Bb': 10,
  'B': 11, 'CB': 11, 'Cb': 11,
};

// Regex to capture root note (including sharp/flat) and chord quality + optional bass note
// e.g. "F#m7b5/C#" -> root: "F#", quality: "m7b5", bass: "C#"
const CHORD_REGEX = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/i;

export interface TransposeOptions {
  semitones: number; // e.g. +1, -1, +2
  preferFlats?: boolean; // if true, use Bb instead of A#
  targetKey?: string; // explicit key to transpose to
}

// Determines if a key naturally prefers flats
export function keyPrefersFlats(key: string): boolean {
  if (!key) return false;
  const upper = key.toUpperCase();
  return upper.includes('B') || ['F', 'DM', 'GM', 'CM', 'FM', 'BBM', 'EBM'].some(k => upper.startsWith(k));
}

// Transpose a single note (e.g. "F#" + 2 -> "G#")
export function transposeNote(note: string, semitones: number, preferFlats: boolean = false): string {
  const cleanNote = note.trim();
  const semitone = NOTE_TO_SEMITONE[cleanNote.toUpperCase()] ?? NOTE_TO_SEMITONE[cleanNote];
  if (semitone === undefined) return note;

  const transposedIndex = ((semitone + semitones) % 12 + 12) % 12;
  return preferFlats ? ROOT_NOTES_FLAT[transposedIndex] : ROOT_NOTES_SHARP[transposedIndex];
}

// Transpose a full chord string (e.g., "G/B", "C#m7b5", "Bbadd9", "F#dim7")
export function transposeChord(chord: string, semitones: number, preferFlats: boolean = false): string {
  if (!chord || semitones % 12 === 0) return chord;
  const trimmed = chord.trim();

  const match = trimmed.match(CHORD_REGEX);
  if (!match) return chord;

  const [, root, quality, bass] = match;
  const newRoot = transposeNote(root, semitones, preferFlats);
  const newBass = bass ? `/${transposeNote(bass, semitones, preferFlats)}` : '';

  return `${newRoot}${quality}${newBass}`;
}

// Calculates semitone distance between fromKey and toKey
export function getSemitoneDistance(fromKey: string, toKey: string): number {
  const fromClean = fromKey.replace(/m|maj|min/i, '').trim();
  const toClean = toKey.replace(/m|maj|min/i, '').trim();

  const fromIndex = NOTE_TO_SEMITONE[fromClean.toUpperCase()];
  const toIndex = NOTE_TO_SEMITONE[toClean.toUpperCase()];

  if (fromIndex === undefined || toIndex === undefined) return 0;
  return (toIndex - fromIndex + 12) % 12;
}

// Capo helper: play in PlayKey with Capo N to sound in SoundKey
export function calculateCapo(actualKey: string, capoFret: number): string {
  if (capoFret <= 0) return actualKey;
  return transposeChord(actualKey, -capoFret, keyPrefersFlats(actualKey));
}
