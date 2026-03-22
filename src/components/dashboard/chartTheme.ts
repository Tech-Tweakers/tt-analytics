export const DARK_BG = '#1c1e26';
export const FONT_COLOR = '#eee';
export const TABLE_HEADER_BG = '#2a2a2a';
export const TABLE_BORDER = '#444';

export const baseLayout = {
  paper_bgcolor: DARK_BG,
  plot_bgcolor: DARK_BG,
  font: { color: FONT_COLOR },
  autosize: true,
} as const;

export const plotConfig = {
  responsive: true,
} as const;
