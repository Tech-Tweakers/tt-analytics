import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, colors, DataTable, useCSVExport, useDateFilter } from './dashboard';
import type { ReworkEntry, ReworkData } from '../types/metrics';
import styles from './dashboard/dashboard.module.css';

interface Props {
  repo: string;
  data: ReworkData;
}

function rankAuthors(entries: ReworkEntry[], field: 'rework_changes_total' | 'rework_changes_recent') {
  const stats: Record<string, number> = {};
  for (const item of entries) {
    const author = item.autor || 'Desconhecido';
    stats[author] = (stats[author] || 0) + item[field];
  }
  return Object.entries(stats)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

type AuthorRow = { autor: string; total: number };

const authorColumns = [
  { header: 'Autor', accessor: (r: AuthorRow) => r.autor },
  { header: 'Linhas de Retrabalho', accessor: (r: AuthorRow) => r.total },
];

const ReworkDashboard: React.FC<Props> = ({ repo, data }) => {
  if (!data || !Array.isArray(data.data)) {
    return <div className="info-box">Dados de retrabalho indisponiveis para: <strong>{repo}</strong></div>;
  }

  const { allData, recentData, recentDays } = useDateFilter(data.data);
  const exportCSV = useCSVExport(recentData, `rework_data_${repo}.csv`);

  const rankedRecent = useMemo(() => rankAuthors(recentData, 'rework_changes_recent'), [recentData]);
  const rankedTotal = useMemo(() => rankAuthors(allData, 'rework_changes_total'), [allData]);

  const totalReworkRecent = recentData.reduce((s, d) => s + d.rework_changes_recent, 0);
  const totalChangesRecent = recentData.reduce((s, d) => s + d.total_changes, 0);
  const avgRateRecent = totalChangesRecent > 0 ? (totalReworkRecent / totalChangesRecent * 100) : 0;
  const totalReworkAll = allData.reduce((s, d) => s + d.rework_changes_total, 0);
  const totalChangesAll = allData.reduce((s, d) => s + d.total_changes, 0);
  const avgRateAll = totalChangesAll > 0 ? (totalReworkAll / totalChangesAll * 100) : 0;

  return (
    <div>
      <div className={styles.dashboardHeader}>
        <div>
          <span className="metric-badge metric-badge--rework">Rework Rate</span>
        </div>
        <button onClick={exportCSV} className={styles.exportBtn}>
          Exportar CSV
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value stat-value--rose">{avgRateRecent.toFixed(1)}%</div>
          <div className="stat-label">Rate ({recentDays}d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--cyan">{recentData.length}</div>
          <div className="stat-label">Commits ({recentDays}d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--purple">{avgRateAll.toFixed(1)}%</div>
          <div className="stat-label">Rate Geral</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--amber">{allData.length}</div>
          <div className="stat-label">Total Commits</div>
        </div>
      </div>

      <h3>Ultimos {recentDays} dias</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[{
            x: recentData.map(d => d.data),
            y: recentData.map(d => d.rework_rate_recent),
            type: 'bar',
            name: `Rework Rate (${recentDays}d)`,
            marker: {
              color: recentData.map(d => d.rework_rate_recent > 50 ? colors.rose : colors.amber),
              line: { width: 0 },
            },
            text: recentData.map(d =>
              `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
              `Mudancas: ${d.total_changes}<br>Retrabalho: ${d.rework_changes_recent} (${d.rework_rate_recent.toFixed(1)}%)`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Data' },
            yaxis: { ...baseLayout.yaxis, title: 'Rework Rate (%)' },
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
            y: allData.map(d => d.rework_rate_total),
            type: 'bar',
            name: 'Rework Rate Total',
            marker: { color: colors.cyan, opacity: 0.7, line: { width: 0 } },
            text: allData.map(d =>
              `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
              `Mudancas: ${d.total_changes}<br>Retrabalho: ${d.rework_changes_total} (${d.rework_rate_total.toFixed(1)}%)`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Data' },
            yaxis: { ...baseLayout.yaxis, title: 'Rework Rate (%)' },
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

export default ReworkDashboard;
