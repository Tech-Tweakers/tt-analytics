import React from "react";
import Plot from "react-plotly.js";

interface Props {
  repo: string;
  data: {
    churn_summary: {
      total_churn_lines: number;
      total_commits: number;
      average_churn_per_commit: number;
    };
    weekly_churn: {
      week_start: string;
      week_end: string;
      churn_lines: number;
      commits: number;
    }[];
    top_files_by_churn: {
      file: string;
      churn_lines: number;
      modifications: number;
    }[];
    top_authors_by_churn: {
      author: string;
      churn_lines: number;
      commits: number;
    }[];
  };
}

const CodeChurnDashboard: React.FC<Props> = ({ repo, data }) => {
  const weeklyChurn = data.weekly_churn || [];
  const topFiles = data.top_files_by_churn || [];
  const topAuthors = data.top_authors_by_churn || [];
  const summary = data.churn_summary || {
    total_churn_lines: 0,
    total_commits: 0,
    average_churn_per_commit: 0,
  };

  return (
    <div>
      <h2>📊 Code Churn – {repo}</h2>

      <div style={{ marginBottom: "2rem" }}>
        <strong>Total de churn:</strong> {summary.total_churn_lines} linhas
        <br />
        <strong>Total de commits:</strong> {summary.total_commits}
        <br />
        <strong>Média por commit:</strong> {summary.average_churn_per_commit} linhas
      </div>

      <Plot
        data={[
          {
            x: weeklyChurn.map((w) => w.week_start),
            y: weeklyChurn.map((w) => w.churn_lines),
            type: "bar",
            name: "Churn (linhas)",
            text: weeklyChurn.map(
              (w) =>
                `📅 ${w.week_start} → ${w.week_end}<br>` +
                `🧾 Commits: ${w.commits}<br>` +
                `🔥 Linhas churnadas: ${w.churn_lines}`
            ),
            hoverinfo: "text",
          },
          {
            x: weeklyChurn.map((w) => w.week_start),
            y: weeklyChurn.map((w) => w.commits),
            type: "scatter",
            mode: "lines+markers",
            name: "Commits",
            yaxis: "y2",
            text: weeklyChurn.map(
              (w) =>
                `📅 ${w.week_start} → ${w.week_end}<br>` +
                `🧾 Commits: ${w.commits}`
            ),
            hoverinfo: "text",
          },
        ]}
        layout={{
          title: "📈 Evolução semanal de churn e commits",
          paper_bgcolor: "#1c1e26",
          plot_bgcolor: "#1c1e26",
          font: { color: "#eee" },
          barmode: "group",
          yaxis: { title: "Churn (linhas)" },
          yaxis2: {
            title: "Commits",
            overlaying: "y",
            side: "right",
          },
          xaxis: { title: "Semana" },
          legend: { orientation: "h" },
        }}
      />

      <Plot
        data={[
          {
            x: topFiles.map((f) => f.file),
            y: topFiles.map((f) => f.churn_lines),
            type: "bar",
            text: topFiles.map(
              (f) =>
                `🗂️ ${f.file}<br>` +
                `🔥 Linhas churnadas: ${f.churn_lines}<br>` +
                `🛠️ Modificações: ${f.modifications}`
            ),
            hoverinfo: "text",
          },
        ]}
        layout={{
          title: "🗂️ Top arquivos com mais churn",
          paper_bgcolor: "#1c1e26",
          plot_bgcolor: "#1c1e26",
          font: { color: "#eee" },
          xaxis: { title: "Arquivo", tickangle: -45 },
          yaxis: { title: "Linhas churnadas" },
        }}
      />

      <Plot
        data={[
          {
            x: topAuthors.map((a) => a.author),
            y: topAuthors.map((a) => a.churn_lines),
            type: "bar",
            text: topAuthors.map(
              (a) =>
                `👤 Autor: ${a.author}<br>` +
                `🔥 Linhas churnadas: ${a.churn_lines}<br>` +
                `🧾 Commits: ${a.commits}`
            ),
            hoverinfo: "text",
          },
        ]}
        layout={{
          paper_bgcolor: "#1c1e26",
          plot_bgcolor: "#1c1e26",
          font: { color: "#eee" },
          title: "👤 Top autores por churn",
          xaxis: { title: "Autor" },
          yaxis: { title: "Linhas churnadas" },
        }}
      />
    </div>
  );
};

export default CodeChurnDashboard;
