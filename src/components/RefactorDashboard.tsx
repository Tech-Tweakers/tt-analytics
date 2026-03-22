import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, colors, DataTable, useCSVExport, useDateFilter } from './dashboard';
import type { RefactorEntry, RefactorData } from '../types/metrics';
import styles from './dashboard/dashboard.module.css';

interface Props {
  repo: string;
  data: RefactorData;
}

function rankAuthors(entries: RefactorEntry[]) {
  const stats: Record<string, number> = {};
  for (const item of entries) {
    const author = item.autor || 'Desconhecido';
    stats[author] = (stats[author] || 0) + item.refactor_lines;
  }
  return Object.entries(stats)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

type AuthorRow = { autor: string; total: number };

const authorColumns = [
  { header: 'Autor', accessor: (r: AuthorRow) => r.autor },
  { header: 'Linhas Refatoradas', accessor: (r: AuthorRow) => r.total.toLocaleString() },
];

const RefactorDashboard: React.FC<Props> = ({ repo, data }) => {
  if (!data || !Array.isArray(data.data)) {
    return <div className="info-box">Dados de refatoracao indisponiveis para: <strong>{repo}</strong></div>;
  }

  const { allData, recentData, recentDays } = useDateFilter(data.data);
  const exportCSV = useCSVExport(recentData, `refactor_data_${repo}.csv`);

  const rankedRecent = useMemo(() => rankAuthors(recentData), [recentData]);
  const rankedTotal = useMemo(() => rankAuthors(allData), [allData]);

  const calcRate = (d: RefactorEntry) =>
    d.total_lines > 0 ? (d.refactor_lines / d.total_lines) * 100 : 0;

  const totalRefactorRecent = recentData.reduce((s, d) => s + d.refactor_lines, 0);
  const totalLinesRecent = recentData.reduce((s, d) => s + d.total_lines, 0);
  const avgRateRecent = totalLinesRecent > 0 ? (totalRefactorRecent / totalLinesRecent * 100) : 0;
  const refactorCommitsRecent = recentData.filter(d => d.refactor_detected).length;
  const totalRefactorAll = allData.reduce((s, d) => s + d.refactor_lines, 0);
  const totalLinesAll = allData.reduce((s, d) => s + d.total_lines, 0);
  const avgRateAll = totalLinesAll > 0 ? (totalRefactorAll / totalLinesAll * 100) : 0;

  return (
    <div>
      <div className={styles.dashboardHeader}>
        <div>
          <span className="metric-badge metric-badge--refactor">Refactor Rate</span>
        </div>
        <button onClick={exportCSV} className={styles.exportBtn}>
          Exportar CSV
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value stat-value--green">{avgRateRecent.toFixed(1)}%</div>
          <div className="stat-label">Rate ({recentDays}d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--cyan">{refactorCommitsRecent}</div>
          <div className="stat-label">Commits refatorados ({recentDays}d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--purple">{avgRateAll.toFixed(1)}%</div>
          <div className="stat-label">Rate Geral</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--amber">{totalRefactorAll.toLocaleString()}</div>
          <div className="stat-label">Linhas Refatoradas</div>
        </div>
      </div>

      <h3>Ultimos {recentDays} dias</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[{
            x: recentData.map(d => d.data),
            y: recentData.map(d => calcRate(d)),
            type: 'bar',
            name: 'Refactor Rate (%)',
            marker: { color: colors.green, opacity: 0.8, line: { width: 0 } },
            text: recentData.map(d =>
              `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
              `Total: ${d.total_lines}<br>Refatoradas: ${d.refactor_lines} (${calcRate(d).toFixed(1)}%)<br>` +
              `Arquivos: ${d.arquivos_refatorados.join(', ')}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Data' },
            yaxis: { ...baseLayout.yaxis, title: 'Refactor Rate (%)' },
          }}
          config={plotConfig}
          style={{ width: '100%', height: 380 }}
        />
      </div>

      <DataTable columns={authorColumns} data={rankedRecent} keyAccessor={r => r.autor} />

      <hr className="section-divider" />

      <h3>Historico Completo</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[{
            x: allData.map(d => d.data),
            y: allData.map(d => calcRate(d)),
            type: 'bar',
            name: 'Refactor Rate Geral',
            marker: { color: colors.cyan, opacity: 0.6, line: { width: 0 } },
            text: allData.map(d =>
              `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
              `Total: ${d.total_lines}<br>Refatoradas: ${d.refactor_lines} (${calcRate(d).toFixed(1)}%)<br>` +
              `Arquivos: ${d.arquivos_refatorados.join(', ')}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Data' },
            yaxis: { ...baseLayout.yaxis, title: 'Refactor Rate (%)' },
          }}
          config={plotConfig}
          style={{ width: '100%', height: 380 }}
        />
      </div>

      <h3>Top Autores - Historico Completo</h3>
      <DataTable columns={authorColumns} data={rankedTotal} keyAccessor={r => r.autor} />
    </div>
  );
};

export default RefactorDashboard;
