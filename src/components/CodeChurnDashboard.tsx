import React from 'react';
import Plot from 'react-plotly.js';
import { baseLayout, plotConfig, colors, DataTable } from './dashboard';
import type { ChurnWeek, ChurnFile, ChurnAuthor, ChurnData } from '../types/metrics';
import styles from './dashboard/dashboard.module.css';

interface Props {
  repo: string;
  data: ChurnData;
}

const weekColumns = [
  { header: 'Semana', accessor: (w: ChurnWeek) => `${w.week_start} - ${w.week_end}` },
  { header: 'Linhas', accessor: (w: ChurnWeek) => w.churn_lines.toLocaleString() },
  { header: 'Commits', accessor: (w: ChurnWeek) => w.commits },
];

const fileColumns = [
  { header: 'Arquivo', accessor: (f: ChurnFile) => f.file },
  { header: 'Linhas', accessor: (f: ChurnFile) => f.churn_lines.toLocaleString() },
  { header: 'Modificacoes', accessor: (f: ChurnFile) => f.modifications },
];

const authorColumns = [
  { header: 'Autor', accessor: (a: ChurnAuthor) => a.author },
  { header: 'Linhas', accessor: (a: ChurnAuthor) => a.churn_lines.toLocaleString() },
  { header: 'Commits', accessor: (a: ChurnAuthor) => a.commits },
];

const CodeChurnDashboard: React.FC<Props> = ({ repo, data }) => {
  const weeklyChurn = data.weekly_churn || [];
  const topFiles = data.top_files_by_churn || [];
  const topAuthors = data.top_authors_by_churn || [];
  const summary = data.churn_summary || { total_churn_lines: 0, total_commits: 0, average_churn_per_commit: 0 };

  return (
    <div>
      <div className={styles.dashboardHeader}>
        <span className="metric-badge metric-badge--churn">Code Churn</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value stat-value--cyan">{summary.total_churn_lines.toLocaleString()}</div>
          <div className="stat-label">Total Linhas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--purple">{summary.total_commits.toLocaleString()}</div>
          <div className="stat-label">Total Commits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--amber">{summary.average_churn_per_commit.toLocaleString()}</div>
          <div className="stat-label">Media/Commit</div>
        </div>
      </div>

      <h3>Evolucao Semanal</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[
            {
              x: weeklyChurn.map(w => w.week_start),
              y: weeklyChurn.map(w => w.churn_lines),
              type: 'bar',
              name: 'Churn (linhas)',
              marker: { color: colors.cyan, opacity: 0.7, line: { width: 0 } },
              text: weeklyChurn.map(w =>
                `${w.week_start} - ${w.week_end}<br>Commits: ${w.commits}<br>Linhas: ${w.churn_lines.toLocaleString()}`
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
              line: { color: colors.purple, width: 2 },
              marker: { color: colors.purple, size: 5 },
              text: weeklyChurn.map(w =>
                `${w.week_start} - ${w.week_end}<br>Commits: ${w.commits}`
              ),
              hoverinfo: 'text',
            },
          ]}
          layout={{
            ...baseLayout,
            barmode: 'group',
            yaxis: { ...baseLayout.yaxis, title: 'Churn (linhas)' },
            yaxis2: { title: 'Commits', overlaying: 'y', side: 'right', gridcolor: 'rgba(0,0,0,0)' },
            xaxis: { ...baseLayout.xaxis, title: 'Semana' },
            legend: { ...baseLayout.legend, orientation: 'h', y: -0.2 },
          }}
          config={plotConfig}
          style={{ width: '100%', height: 400 }}
        />
      </div>

      <DataTable columns={weekColumns} data={weeklyChurn} keyAccessor={w => w.week_start} />

      <hr className="section-divider" />

      <h3>Top Arquivos</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[{
            x: topFiles.map(f => f.file.split('/').pop() || f.file),
            y: topFiles.map(f => f.churn_lines),
            type: 'bar',
            marker: {
              color: topFiles.map((_, i) => {
                const palette = [colors.cyan, colors.purple, colors.amber, colors.green, colors.rose];
                return palette[i % palette.length];
              }),
              opacity: 0.8,
              line: { width: 0 },
            },
            text: topFiles.map(f =>
              `${f.file}<br>Linhas: ${f.churn_lines.toLocaleString()}<br>Modificacoes: ${f.modifications}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Arquivo', tickangle: -35 },
            yaxis: { ...baseLayout.yaxis, title: 'Linhas churnadas' },
            margin: { ...baseLayout.margin, b: 100 },
          }}
          config={plotConfig}
          style={{ width: '100%', height: 400 }}
        />
      </div>

      <DataTable columns={fileColumns} data={topFiles} keyAccessor={f => f.file} />

      <hr className="section-divider" />

      <h3>Top Autores</h3>
      <div className={styles.chartWrapper}>
        <Plot
          data={[{
            x: topAuthors.map(a => a.author),
            y: topAuthors.map(a => a.churn_lines),
            type: 'bar',
            marker: { color: colors.purple, opacity: 0.8, line: { width: 0 } },
            text: topAuthors.map(a =>
              `Autor: ${a.author}<br>Linhas: ${a.churn_lines.toLocaleString()}<br>Commits: ${a.commits}`
            ),
            hoverinfo: 'text',
            textposition: 'none',
          }]}
          layout={{
            ...baseLayout,
            xaxis: { ...baseLayout.xaxis, title: 'Autor' },
            yaxis: { ...baseLayout.yaxis, title: 'Linhas churnadas' },
          }}
          config={plotConfig}
          style={{ width: '100%', height: 380 }}
        />
      </div>

      <DataTable columns={authorColumns} data={topAuthors} keyAccessor={a => a.author} />
    </div>
  );
};

export default CodeChurnDashboard;
