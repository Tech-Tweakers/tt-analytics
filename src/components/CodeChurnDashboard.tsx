import React from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, DataTable } from './dashboard';
import type { ChurnWeek, ChurnFile, ChurnAuthor, ChurnData } from '../types/metrics';

interface Props {
  repo: string;
  data: ChurnData;
}

const weekColumns = [
  { header: 'Semana', accessor: (w: ChurnWeek) => `${w.week_start} - ${w.week_end}` },
  { header: 'Linhas Churnadas', accessor: (w: ChurnWeek) => w.churn_lines },
  { header: 'Commits', accessor: (w: ChurnWeek) => w.commits },
];

const fileColumns = [
  { header: 'Arquivo', accessor: (f: ChurnFile) => f.file },
  { header: 'Linhas Churnadas', accessor: (f: ChurnFile) => f.churn_lines },
  { header: 'Modificacoes', accessor: (f: ChurnFile) => f.modifications },
];

const authorColumns = [
  { header: 'Autor', accessor: (a: ChurnAuthor) => a.author },
  { header: 'Linhas Churnadas', accessor: (a: ChurnAuthor) => a.churn_lines },
  { header: 'Commits', accessor: (a: ChurnAuthor) => a.commits },
];

const CodeChurnDashboard: React.FC<Props> = ({ repo, data }) => {
  const weeklyChurn = data.weekly_churn || [];
  const topFiles = data.top_files_by_churn || [];
  const topAuthors = data.top_authors_by_churn || [];
  const summary = data.churn_summary || { total_churn_lines: 0, total_commits: 0, average_churn_per_commit: 0 };

  return (
    <div>
      <h2>Code Churn - {repo}</h2>

      <div style={{ marginBottom: '2rem' }}>
        <strong>Total de churn:</strong> {summary.total_churn_lines} linhas<br />
        <strong>Total de commits:</strong> {summary.total_commits}<br />
        <strong>Media por commit:</strong> {summary.average_churn_per_commit} linhas
      </div>

      <Plot
        data={[
          {
            x: weeklyChurn.map(w => w.week_start),
            y: weeklyChurn.map(w => w.churn_lines),
            type: 'bar',
            name: 'Churn (linhas)',
            text: weeklyChurn.map(w =>
              `${w.week_start} - ${w.week_end}<br>Commits: ${w.commits}<br>Linhas: ${w.churn_lines}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          },
          {
            x: weeklyChurn.map(w => w.week_start),
            y: weeklyChurn.map(w => w.commits),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Commits',
            yaxis: 'y2',
            text: weeklyChurn.map(w =>
              `${w.week_start} - ${w.week_end}<br>Commits: ${w.commits}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          },
        ]}
        layout={{
          ...baseLayout,
          title: 'Evolucao semanal de churn e commits',
          barmode: 'group',
          yaxis: { title: 'Churn (linhas)' },
          yaxis2: { title: 'Commits', overlaying: 'y', side: 'right' },
          xaxis: { title: 'Semana' },
          legend: { orientation: 'h' },
        }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <h3>Detalhamento Semanal</h3>
      <DataTable columns={weekColumns} data={weeklyChurn} keyAccessor={w => w.week_start} />

      <Plot
        data={[{
          x: topFiles.map(f => f.file),
          y: topFiles.map(f => f.churn_lines),
          type: 'bar',
          text: topFiles.map(f =>
            `${f.file}<br>Linhas: ${f.churn_lines}<br>Modificacoes: ${f.modifications}`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{
          ...baseLayout,
          title: 'Top arquivos com mais churn',
          xaxis: { title: 'Arquivo', tickangle: -45 },
          yaxis: { title: 'Linhas churnadas' },
        }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <h3>Top Arquivos com Mais Churn</h3>
      <DataTable columns={fileColumns} data={topFiles} keyAccessor={f => f.file} />

      <Plot
        data={[{
          x: topAuthors.map(a => a.author),
          y: topAuthors.map(a => a.churn_lines),
          type: 'bar',
          text: topAuthors.map(a =>
            `Autor: ${a.author}<br>Linhas: ${a.churn_lines}<br>Commits: ${a.commits}`
          ),
          hoverinfo: 'text',
          textposition: 'none',
        }]}
        layout={{
          ...baseLayout,
          title: 'Top autores por churn',
          xaxis: { title: 'Autor' },
          yaxis: { title: 'Linhas churnadas' },
        }}
        config={plotConfig}
        style={{ width: '100%' }}
      />

      <h3>Top Autores com Mais Churn</h3>
      <DataTable columns={authorColumns} data={topAuthors} keyAccessor={a => a.author} />
    </div>
  );
};

export default CodeChurnDashboard;
