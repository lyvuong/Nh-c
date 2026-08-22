// Theme definitions with exact RGB channel values for dynamic live CSS variable switching

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  previewBg: string;
  previewBorder: string;
  bg: string;        // Space-separated R G B channels
  card: string;
  cardHover: string;
  border: string;
  text: string;
  muted: string;
  defaultAccent: string;
}

export const STAGE_THEMES: Record<string, ThemeConfig> = {
  'stage-dark': {
    id: 'stage-dark',
    name: 'Stage Dark',
    description: 'Deep Navy / Cyan',
    isDark: true,
    previewBg: '#0a0d14',
    previewBorder: '#38bdf8',
    bg: '10 13 20',
    card: '18 24 36',
    cardHover: '26 35 51',
    border: '31 45 66',
    text: '248 250 252',
    muted: '148 163 184',
    defaultAccent: '#38bdf8',
  },
  'oled-black': {
    id: 'oled-black',
    name: 'OLED Pitch Black',
    description: 'Pure Black / High Contrast',
    isDark: true,
    previewBg: '#000000',
    previewBorder: '#ffffff',
    bg: '0 0 0',
    card: '10 13 18',
    cardHover: '20 24 32',
    border: '31 38 51',
    text: '255 255 255',
    muted: '156 163 175',
    defaultAccent: '#38bdf8',
  },
  'amber-warm': {
    id: 'amber-warm',
    name: 'Stage Amber',
    description: 'Warm Vintage Glow',
    isDark: true,
    previewBg: '#130e07',
    previewBorder: '#fbbf24',
    bg: '19 14 7',
    card: '31 23 12',
    cardHover: '44 32 18',
    border: '59 44 25',
    text: '254 243 199',
    muted: '217 119 6',
    defaultAccent: '#fbbf24',
  },
  'light-contrast': {
    id: 'light-contrast',
    name: 'Clean Studio Light',
    description: 'Daylight & Rehearsal',
    isDark: false,
    previewBg: '#f8fafc',
    previewBorder: '#0284c7',
    bg: '248 250 252',
    card: '255 255 255',
    cardHover: '241 245 249',
    border: '226 232 240',
    text: '15 23 42',
    muted: '100 116 139',
    defaultAccent: '#0284c7',
  },
  'paper-warm': {
    id: 'paper-warm',
    name: 'Acoustic Paper Light',
    description: 'Warm Sheet Music / Sepia',
    isDark: false,
    previewBg: '#fbf9f4',
    previewBorder: '#b45309',
    bg: '251 249 244',
    card: '255 255 255',
    cardHover: '245 240 230',
    border: '231 222 205',
    text: '41 37 36',
    muted: '120 113 108',
    defaultAccent: '#b45309',
  },
  'nordic-light': {
    id: 'nordic-light',
    name: 'Nordic Frost Light',
    description: 'Polar Ice & Sky Blue',
    isDark: false,
    previewBg: '#f0f9ff',
    previewBorder: '#0ea5e9',
    bg: '240 249 255',
    card: '255 255 255',
    cardHover: '224 242 254',
    border: '186 230 253',
    text: '12 74 110',
    muted: '3 105 161',
    defaultAccent: '#0284c7',
  },
};

export const CHORD_COLORS = [
  { id: '#38bdf8', name: 'Electric Cyan', rgb: '56 189 248' },
  { id: '#0284c7', name: 'Royal Cobalt', rgb: '2 132 199' },
  { id: '#fbbf24', name: 'Stage Amber', rgb: '251 191 36' },
  { id: '#d97706', name: 'Warm Bronze', rgb: '217 119 6' },
  { id: '#10b981', name: 'Vibrant Emerald', rgb: '16 185 129' },
  { id: '#f43f5e', name: 'Neon Rose', rgb: '244 63 94' },
  { id: '#a855f7', name: 'Ultra Purple', rgb: '168 85 247' },
  { id: '#ffffff', name: 'Pure White', rgb: '255 255 255' },
];

export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return '56 189 248';
}

// Directly apply theme and chord colors to DOM root styles
export function applyThemeToDOM(themeId: string, chordColorHex: string) {
  const theme = STAGE_THEMES[themeId] || STAGE_THEMES['stage-dark'];
  const root = document.documentElement;

  root.style.setProperty('--color-stage-bg', theme.bg);
  root.style.setProperty('--color-stage-card', theme.card);
  root.style.setProperty('--color-stage-cardHover', theme.cardHover);
  root.style.setProperty('--color-stage-border', theme.border);
  root.style.setProperty('--color-stage-text', theme.text);
  root.style.setProperty('--color-stage-muted', theme.muted);

  const chordRgb = hexToRgbChannels(chordColorHex);
  root.style.setProperty('--color-stage-accent', chordRgb);

  // Synchronize dark/light root classes for Tailwind CSS
  if (theme.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Also update body classes for compatibility
  document.body.className = `theme-${themeId}`;
}
