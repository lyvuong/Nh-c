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

  // Determine optimal columns
  let columns = 1;
  if (preferredColumns === 'auto') {
    if (containerWidth >= 1200 && totalLines > 35) {
      columns = 3;
    } else if (containerWidth >= 700 && totalLines > 18) {
      columns = 2;
    } else {
      columns = 1;
    }
  } else {
    columns = preferredColumns;
  }

  // Calculate vertical height per column
  const effectiveLinesPerColumn = Math.ceil(totalLines / columns);
  
  // Approximate line height needed in pixels
  // Each chord line + lyric line + margin takes ~2.2x font size
  const availableHeightPx = Math.max(containerHeight - 40, 200);
  const maxLineHeightPx = availableHeightPx / Math.max(effectiveLinesPerColumn, 8);

  // Convert to rem (assuming 16px root)
  let baseRem = (maxLineHeightPx / 36) * userZoomLevel;

  // Clamp font size to readable bounds for tablet/mobile readability
  // On mobile min 0.75rem, on tablet min 0.85rem, max 1.35rem
  const minRem = containerWidth < 600 ? 0.75 : 0.85;
  const maxRem = 1.35;
  
  const clampedRem = Math.min(Math.max(baseRem, minRem), maxRem);
  const canFit = (effectiveLinesPerColumn * (clampedRem * 36)) <= availableHeightPx;

  return {
    columns,
    fontSizeRem: Number(clampedRem.toFixed(2)),
    lineHeightMultiplier: clampedRem < 0.9 ? 1.25 : 1.4,
    chordSpacingEm: clampedRem < 0.9 ? 0.8 : 1.0,
    canFitOnOneScreen: canFit,
  };
}
