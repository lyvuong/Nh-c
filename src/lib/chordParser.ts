import { transposeChord } from './chordTransposer';

export interface ChordToken {
  type: 'chord_lyric';
  chord?: string; // Transposed or original chord
  originalChord?: string;
  lyric: string; // The lyric text aligned directly below this chord
}

export interface SongLine {
  type: 'lyric_line' | 'comment' | 'empty' | 'section_header';
  tokens?: ChordToken[];
  commentText?: string;
  headerText?: string;
  hasChords?: boolean;
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'solo' | 'general';
  title?: string;
  lines: SongLine[];
}

export interface SongMetadata {
  title: string;
  subtitle?: string;
  artist?: string;
  key?: string;
  capo?: number;
  tempo?: string;
  time?: string;
  tags?: string[];
  originalKey?: string;
  duration?: string;
  ccli?: string;
}

export interface ParsedSong {
  metadata: SongMetadata;
  sections: SongSection[];
  rawText: string;
  allChords: string[];
}

// Parses raw ChordPro text into a structured AST
export function parseChordPro(text: string): ParsedSong {
  const lines = text.split(/\r?\n/);
  
  const metadata: SongMetadata = {
    title: 'Untitled Song',
  };

  const sections: SongSection[] = [];
  let currentSection: SongSection = {
    type: 'general',
    lines: [],
  };

  const allChordsSet = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for ChordPro Directives: {directive: value} or {directive}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inside = trimmed.slice(1, -1).trim();
      const colonIdx = inside.indexOf(':');
      let directive = (colonIdx === -1 ? inside : inside.slice(0, colonIdx)).trim().toLowerCase();
      let value = colonIdx === -1 ? '' : inside.slice(colonIdx + 1).trim();

      // Normalize short directive names
      if (directive === 't') directive = 'title';
      if (directive === 'st' || directive === 'su') directive = 'subtitle';
      if (directive === 'a') directive = 'artist';
      if (directive === 'k') directive = 'key';
      if (directive === 'c') directive = 'comment';
      if (directive === 'soc' || directive === 'start_of_chorus') directive = 'start_of_chorus';
      if (directive === 'eoc' || directive === 'end_of_chorus') directive = 'end_of_chorus';
      if (directive === 'sov' || directive === 'start_of_verse') directive = 'start_of_verse';
      if (directive === 'eov' || directive === 'end_of_verse') directive = 'end_of_verse';
      if (directive === 'sob' || directive === 'start_of_bridge') directive = 'start_of_bridge';
      if (directive === 'eob' || directive === 'end_of_bridge') directive = 'end_of_bridge';

      switch (directive) {
        case 'title':
          metadata.title = value || metadata.title;
          break;
        case 'subtitle':
        case 'artist':
          metadata.artist = value || metadata.artist;
          metadata.subtitle = value || metadata.subtitle;
          break;
        case 'key':
          metadata.key = value;
          metadata.originalKey = value;
          break;
        case 'capo':
          metadata.capo = parseInt(value, 10) || 0;
          break;
        case 'tempo':
        case 'bpm':
          metadata.tempo = value;
          break;
        case 'time':
          metadata.time = value;
          break;
        case 'start_of_chorus':
          if (currentSection.lines.length > 0) {
            sections.push(currentSection);
          }
          currentSection = {
            type: 'chorus',
            title: value || 'Chorus',
            lines: [],
          };
          break;
        case 'end_of_chorus':
          sections.push(currentSection);
          currentSection = { type: 'general', lines: [] };
          break;
        case 'start_of_verse':
          if (currentSection.lines.length > 0) {
            sections.push(currentSection);
          }
          currentSection = {
            type: 'verse',
            title: value || 'Verse',
            lines: [],
          };
          break;
        case 'end_of_verse':
          sections.push(currentSection);
          currentSection = { type: 'general', lines: [] };
          break;
        case 'start_of_bridge':
          if (currentSection.lines.length > 0) {
            sections.push(currentSection);
          }
          currentSection = {
            type: 'bridge',
            title: value || 'Bridge',
            lines: [],
          };
          break;
        case 'end_of_bridge':
          sections.push(currentSection);
          currentSection = { type: 'general', lines: [] };
          break;
        case 'comment':
        case 'c':
        case 'ci':
        case 'cb':
          currentSection.lines.push({
            type: 'comment',
            commentText: value,
          });
          break;
        default:
          if (directive.includes('verse') || directive.includes('chorus') || directive.includes('intro') || directive.includes('bridge') || directive.includes('outro')) {
            if (currentSection.lines.length > 0) {
              sections.push(currentSection);
            }
            currentSection = {
              type: directive.includes('chorus') ? 'chorus' : directive.includes('bridge') ? 'bridge' : 'general',
              title: value || directive.toUpperCase(),
              lines: [],
            };
          }
          break;
      }
      continue;
    }

    // Check for Section headers formatted as text
    const sectionMatch = trimmed.match(/^\[?(Verse\s*\d*|Chorus\s*\d*|Bridge\s*\d*|Intro|Outro|Solo|Pre-Chorus|Tag|Interlude)\]?:?$/i);
    if (sectionMatch) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      const title = sectionMatch[1];
      const type = title.toLowerCase().includes('chorus') ? 'chorus' : title.toLowerCase().includes('bridge') ? 'bridge' : 'verse';
      currentSection = {
        type,
        title,
        lines: [],
      };
      continue;
    }

    // Handle empty lines
    if (trimmed === '') {
      if (currentSection.lines.length > 0 && currentSection.lines[currentSection.lines.length - 1].type !== 'empty') {
        currentSection.lines.push({ type: 'empty' });
      }
      continue;
    }

    // Parse standard lyric & chord line
    const parsedLine = parseLineTokens(rawLine);
    if (parsedLine.tokens) {
      for (const tok of parsedLine.tokens) {
        if (tok.chord) allChordsSet.add(tok.chord);
      }
    }
    currentSection.lines.push(parsedLine);
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  if (!metadata.title || metadata.title === 'Untitled Song') {
    if (sections.length > 0 && sections[0].lines.length > 0) {
      const firstLine = sections[0].lines[0];
      if (firstLine.tokens && firstLine.tokens.length > 0) {
        const textSum = firstLine.tokens.map(t => t.lyric).join('').trim();
        if (textSum) metadata.title = textSum;
      }
    }
  }

  return {
    metadata,
    sections,
    rawText: text,
    allChords: Array.from(allChordsSet),
  };
}

function parseLineTokens(line: string): SongLine {
  const tokens: ChordToken[] = [];
  let hasChords = false;

  const chordRegex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;

  let lastMatchEnd = 0;
  let currentChord: string | undefined = undefined;

  while ((match = chordRegex.exec(line)) !== null) {
    hasChords = true;
    const matchStart = match.index;
    const chordContent = match[1].trim();

    const precedingLyric = line.slice(lastMatchEnd, matchStart);
    if (precedingLyric.length > 0 || currentChord !== undefined) {
      tokens.push({
        type: 'chord_lyric',
        chord: currentChord,
        originalChord: currentChord,
        lyric: precedingLyric,
      });
    }

    currentChord = chordContent;
    lastMatchEnd = chordRegex.lastIndex;
  }

  const remainingLyric = line.slice(lastMatchEnd);
  if (remainingLyric.length > 0 || currentChord !== undefined) {
    tokens.push({
      type: 'chord_lyric',
      chord: currentChord,
      originalChord: currentChord,
      lyric: remainingLyric,
    });
  }

  if (tokens.length === 0) {
    tokens.push({
      type: 'chord_lyric',
      lyric: line,
    });
  }

  return {
    type: 'lyric_line',
    tokens,
    hasChords,
  };
}

export function transposeParsedSong(song: ParsedSong, semitones: number, preferFlats?: boolean): ParsedSong {
  if (semitones % 12 === 0) return song;

  const newKey = song.metadata.key ? transposeChord(song.metadata.key, semitones, preferFlats) : undefined;

  const newSections: SongSection[] = song.sections.map(section => ({
    ...section,
    lines: section.lines.map(line => {
      if (line.type !== 'lyric_line' || !line.tokens) return line;

      const newTokens: ChordToken[] = line.tokens.map(token => ({
        ...token,
        chord: token.originalChord ? transposeChord(token.originalChord, semitones, preferFlats) : undefined,
      }));

      return {
        ...line,
        tokens: newTokens,
      };
    }),
  }));

  const allChords = song.allChords.map(c => transposeChord(c, semitones, preferFlats));

  return {
    ...song,
    metadata: {
      ...song.metadata,
      key: newKey,
    },
    sections: newSections,
    allChords,
  };
}
