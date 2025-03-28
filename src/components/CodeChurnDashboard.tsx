import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

interface Props {
  repo: string;
}

interface WeeklyChurn {
  week_start: string;
  week_end: string;
  churn_lines: number;
  commits: number;
}

interface FileChurn {
  file: string;
  churn_lines: number;
  modifications: number;
}

interface AuthorChurn {
  author: string;
  churn_lines: number;
  commits: number;
}

const CodeChurnDashboard: React.FC<Props> = ({ repo }) => {
  const [weeklyChurn, setWeeklyChurn] = useState<WeeklyChurn[]>([]);
  const [topFiles, setTopFiles] = useState<FileChurn[]>([]);
  const [topAuthors, setTopAuthors] = useState<AuthorChurn[]>([]);
  const [summary, setSummary] = useState({
    total_churn_lines: 0,
    total_commits: 0,
    average_churn_per_commit: 0,
  });

  useEffect(() => {
    fetch(`/data/repos/code_churn_${repo}.json`)
      .then(res => res.json())
      .then(data => {
        console.log('Dados carregados:', data);
        setWeeklyChurn(data.weekly_churn || []);
        setTopFiles(data.top_files_by_churn || []);
        setTopAuthors(data.top_authors_by_churn || []);
        setSummary(data.churn_summary || {});
      });
  }, [repo]);

  return (
    <div>
      <h2>📊 Code Churn – {repo}</h2>

      <div style={{ marginBottom: "2rem" }}>
        <strong>Total de churn:</strong> {summary.total_churn_lines} linhas
        <br />
        <strong>Total de commits:</strong> {summary.total_commits}
        <br />
        <strong>Média por commit:</strong> {summary.average_churn_per_commit}{" "}
        linhas
      </div>

      <Plot
        data={[
          {
            x: weeklyChurn.map((w) => w.week_start),
            y: weeklyChurn.map((w) => w.churn_lines),
            type: "bar",
            name: "Churn (linhas)",
          },
          {
            x: weeklyChurn.map((w) => w.week_start),
            y: weeklyChurn.map((w) => w.commits),
            type: "scatter",
            mode: "lines+markers",
            name: "Commits",
            yaxis: "y2",
          },
        ]}
        layout={{
          title: "Evolução semanal de churn e commits",
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
          },
        ]}
        layout={{
          title: "Top arquivos com mais churn",
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
          },
        ]}
        layout={{
          title: "Top autores por churn",
          xaxis: { title: "Autor" },
          yaxis: { title: "Linhas churnadas" },
        }}
      />
    </div>
  );
};

export default CodeChurnDashboard;
