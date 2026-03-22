// Paleta de cores para os graficos
export const colors = {
  cyan: '#38bdf8',
  cyanDark: '#0ea5e9',
  purple: '#a78bfa',
  amber: '#fbbf24',
  green: '#34d399',
  rose: '#fb7185',
  slate: '#94a3b8',
} as const;

export const DARK_BG = '#131620';
export const SURFACE_BG = 'rgba(22, 25, 34, 0.8)';
export const FONT_COLOR = '#cbd5e1';
export const TABLE_HEADER_BG = 'rgba(22, 25, 34, 0.9)';
export const TABLE_BORDER = 'rgba(255, 255, 255, 0.04)';
export const GRID_COLOR = 'rgba(255, 255, 255, 0.04)';

export const baseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {
    color: FONT_COLOR,
    family: 'Inter, system-ui, sans-serif',
    size: 12,
  },
  autosize: true,
  margin: { t: 50, r: 30, b: 60, l: 60 },
  xaxis: {
    gridcolor: GRID_COLOR,
    linecolor: GRID_COLOR,
    zerolinecolor: GRID_COLOR,
  },
  yaxis: {
    gridcolor: GRID_COLOR,
    linecolor: GRID_COLOR,
    zerolinecolor: GRID_COLOR,
  },
  legend: {
    bgcolor: 'rgba(0,0,0,0)',
    font: { color: FONT_COLOR, size: 11 },
  },
  hoverlabel: {
    bgcolor: '#1e2130',
    bordercolor: 'rgba(56, 189, 248, 0.2)',
    font: { color: '#e2e8f0', size: 12, family: 'Inter, system-ui, sans-serif' },
  },
} as const;

export const plotConfig = {
  responsive: true,
  displayModeBar: false,
} as const;
