import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, DataTable, useCSVExport, useDateFilter } from './dashboard';
import type { ReworkEntry, ReworkData } from '../types/metrics';

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
    return <div>Dados de retrabalho indisponiveis para o repositorio: {repo}</div>;
  }

  const { allData, recentData, recentDays } = useDateFilter(data.data);
  const exportCSV = useCSVExport(recentData, `rework_data_${repo}.csv`);

  const rankedRecent = useMemo(() => rankAuthors(recentData, 'rework_changes_recent'), [recentData]);
  const rankedTotal = useMemo(() => rankAuthors(allData, 'rework_changes_total'), [allData]);

  return (
    <div>
      <br />
      <button onClick={exportCSV} className="button button--secondary button--sm" style={{ marginBottom: 20 }}>
        Exportar CSV
      </button>

      <h3>Rework Rate - Ultimos {recentDays} dias</h3>
      <Plot
        data={[{
          x: recentData.map(d => d.data),
          y: recentData.map(d => d.rework_rate_recent),
          type: 'bar',
          name: `Rework Rate (${recentDays} dias)`,
          marker: { color: 'orange' },
          text: recentData.map(d =>
            `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
            `Mudancas: ${d.total_changes}<br>Retrabalho: ${d.rework_changes_recent} (${d.rework_rate_recent.toFixed(2)}%)`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{ ...baseLayout, title: `Rework Rate - Ultimos ${recentDays} dias`, xaxis: { title: 'Data' }, yaxis: { title: 'Rework Rate (%)' } }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <DataTable columns={authorColumns} data={rankedRecent} keyAccessor={r => r.autor} />

      <h3>Rework Rate - Geral</h3>
      <Plot
        data={[{
          x: allData.map(d => d.data),
          y: allData.map(d => d.rework_rate_total),
          type: 'bar',
          name: 'Rework Rate Total',
          marker: { color: 'lightblue' },
          text: allData.map(d =>
            `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
            `Mudancas: ${d.total_changes}<br>Retrabalho: ${d.rework_changes_total} (${d.rework_rate_total.toFixed(2)}%)`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{ ...baseLayout, title: 'Rework Rate Geral', xaxis: { title: 'Data' }, yaxis: { title: 'Rework Rate (%)' } }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <h3>Top Autores (Historico Completo)</h3>
      <DataTable columns={authorColumns} data={rankedTotal} keyAccessor={r => r.autor} />
    </div>
  );
};

export default ReworkDashboard;
