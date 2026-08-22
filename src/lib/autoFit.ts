// Auto-Fit Calculation Engine: dynamically calculates optimal columns and font scaling to fit the song on one screen without scrolling

export interface AutoFitConfig {
  containerWidth: number;
  containerHeight: number;
  totalLines: number;
  totalSections: number;
  preferredColumns?: 'auto' | 1 | 2 | 3;
  userZoomLevel: number; // 0.7 to 1.5 multiplier
}

export interface AutoFitResult {
  columns: number;
  fontSizeRem: number; // base font size in rem
  lineHeightMultiplier: number;
  chordSpacingEm: number;
  canFitOnOneScreen: boolean;
}

export function computeAutoFit(config: AutoFitConfig): AutoFitResult {
  const { containerWidth, containerHeight, totalLines, preferredColumns = 'auto', userZoomLevel = 1.0 } = config;

  // Determine optimal columns dynamically
  let columns = 1;
  if (preferredColumns === 'auto') {
    if (containerWidth >= 980 && totalLines > 26) {
      columns = 3;
    } else if (containerWidth >= 540 && totalLines > 13) {
      columns = 2;
    } else {
      columns = 1;
    }
  } else {
    columns = preferredColumns;
  }

  // Calculate vertical height per column
  const effectiveLinesPerColumn = Math.ceil(totalLines / columns);
  
  // Available height in pixels (header allowance)
  const availableHeightPx = Math.max(containerHeight - 50, 150);
  const maxLineHeightPx = availableHeightPx / Math.max(effectiveLinesPerColumn, 6);

  // Convert to rem (approx 28px per chord+lyric line)
  let baseRem = (maxLineHeightPx / 28) * userZoomLevel;

  // Readable bounds for live stage use
  const minRem = 0.52;
  const maxRem = 1.40;
  
  const clampedRem = Math.min(Math.max(baseRem, minRem), maxRem);
  const canFit = (effectiveLinesPerColumn * (clampedRem * 28)) <= availableHeightPx;

  return {
    columns,
    fontSizeRem: Number(clampedRem.toFixed(2)),
    lineHeightMultiplier: clampedRem < 0.8 ? 1.15 : 1.35,
    chordSpacingEm: clampedRem < 0.8 ? 0.65 : 0.9,
    canFitOnOneScreen: canFit,
  };
}
