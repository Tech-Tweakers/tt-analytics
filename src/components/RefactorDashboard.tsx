import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, DataTable, useCSVExport, useDateFilter } from './dashboard';
import type { RefactorEntry, RefactorData } from '../types/metrics';

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
  { header: 'Total de Linhas Refatoradas', accessor: (r: AuthorRow) => r.total },
];

const RefactorDashboard: React.FC<Props> = ({ repo, data }) => {
  if (!data || !Array.isArray(data.data)) {
    return <div>Dados de refatoracao indisponiveis para o repositorio: {repo}</div>;
  }

  const { allData, recentData, recentDays } = useDateFilter(data.data);
  const exportCSV = useCSVExport(recentData, `refactor_data_${repo}.csv`);

  const rankedRecent = useMemo(() => rankAuthors(recentData), [recentData]);
  const rankedTotal = useMemo(() => rankAuthors(allData), [allData]);

  const calcRate = (d: RefactorEntry) =>
    d.total_lines > 0 ? (d.refactor_lines / d.total_lines) * 100 : 0;

  return (
    <div>
      <br />
      <button onClick={exportCSV} className="button button--secondary button--sm" style={{ marginBottom: 20 }}>
        Exportar CSV
      </button>

      <h3>Refactor Rate - Ultimos {recentDays} dias</h3>
      <Plot
        data={[{
          x: recentData.map(d => d.data),
          y: recentData.map(d => calcRate(d)),
          type: 'bar',
          name: 'Refactor Rate (%)',
          marker: { color: 'lightgreen' },
          text: recentData.map(d =>
            `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
            `Total: ${d.total_lines}<br>Refatoradas: ${d.refactor_lines} (${calcRate(d).toFixed(2)}%)<br>` +
            `Arquivos: ${d.arquivos_refatorados.join(', ')}`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{ ...baseLayout, title: 'Refactor Rate (%) por Data', xaxis: { title: 'Data' }, yaxis: { title: 'Refactor Rate (%)' } }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <DataTable columns={authorColumns} data={rankedRecent} keyAccessor={r => r.autor} />

      <h3>Refactor Rate - Geral</h3>
      <Plot
        data={[{
          x: allData.map(d => d.data),
          y: allData.map(d => calcRate(d)),
          type: 'bar',
          name: 'Refactor Rate Geral',
          marker: { color: 'deepskyblue' },
          text: allData.map(d =>
            `Data: ${d.data}<br>SHA: ${d.sha.slice(0, 7)}<br>Autor: ${d.autor}<br>` +
            `Total: ${d.total_lines}<br>Refatoradas: ${d.refactor_lines} (${calcRate(d).toFixed(2)}%)<br>` +
            `Arquivos: ${d.arquivos_refatorados.join(', ')}`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{ ...baseLayout, title: 'Refactor Rate Geral (Historico Completo)', xaxis: { title: 'Data' }, yaxis: { title: 'Refactor Rate (%)' } }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <h3>Top Autores (Historico Completo)</h3>
      <DataTable columns={authorColumns} data={rankedTotal} keyAccessor={r => r.autor} />
    </div>
  );
};

export default RefactorDashboard;
