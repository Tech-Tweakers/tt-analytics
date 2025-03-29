import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';

const REWORK_DAYS = 21;

type ReworkEntry = {
    data: string;
    sha: string;
    autor: string;
    total_changes: number;
    rework_changes_total: number;
    rework_rate_total: number;
    rework_changes_recent: number;
    rework_rate_recent: number;
    arquivos_modificados: string[];
};

type ReworkData = {
    threshold: number;
    data: ReworkEntry[];
};

export default function ReworkGraphsWrapper({ repo }: { repo: string }) {
    return (
        <BrowserOnly fallback={<div>Carregando gráficos...</div>}>
        {() => <ReworkDashboard repo={repo} />}
        </BrowserOnly>
    );
}

function ReworkDashboard({ repo }: { repo: string }) {
    const REPO = repo;
    const [rawData, setRawData] = useState<ReworkEntry[]>([]);
    const [filteredData, setFilteredData] = useState<ReworkEntry[]>([]);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - REWORK_DAYS)));
    const [endDate, setEndDate] = useState(new Date());
    const [csvReady, setCsvReady] = useState(false);

    useEffect(() => {
      const jsonUrl = useBaseUrl(`/data/repos/rework_analysis_${REPO}.json`);
      fetch(jsonUrl)
          .then(res => {
              if (!res.ok) throw new Error('Falha ao carregar JSON');
              return res.json();
          })
          .then((json: ReworkData) => {
              if (!json.data) throw new Error('Dados inválidos no JSON');
              const sorted = json.data.sort(
                  (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
              );
              setRawData(sorted);
              setFilteredData(sorted);
          })
          .catch(err => console.error("Erro no fetch:", err));
  }, [REPO]);
    

    useEffect(() => {
        if (rawData.length === 0) return;

        const filtered = rawData.filter(entry => {
        const d = new Date(entry.data);
        return d >= startDate && d <= endDate;
        });

    setFilteredData(filtered);
    setCsvReady(true);
}, [startDate, endDate, rawData]);

const exportCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rework_data_${REPO}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const dates = filteredData.map(d => d.data);
const totalRates = filteredData.map(d => d.rework_rate_total);
const recentRates = filteredData.map(d => d.rework_rate_recent);

const fullDates = rawData.map(d => d.data);
const fullTotalRates = rawData.map(d => d.rework_rate_total);

const authorStats = {};
filteredData.forEach(item => {
    const author = item.autor || 'Desconhecido';
    authorStats[author] = (authorStats[author] || 0) + item.rework_changes_total;
});
const rankedAuthors = Object.entries(authorStats)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 10);

// Estatísticas por autor - Total
const authorStatsTotal = {};
filteredData.forEach(item => {
  const author = item.autor || 'Desconhecido';
  authorStatsTotal[author] = (authorStatsTotal[author] || 0) + item.rework_changes_total;
});
const rankedAuthorsTotal = Object.entries(authorStatsTotal)
  .map(([autor, total]) => ({ autor, total }))
  .sort((a, b) => Number(b.total) - Number(a.total))
  .slice(0, 10);

// Estatísticas por autor - Recentes (21 dias)
const authorStatsRecent = {};
filteredData.forEach(item => {
  const author = item.autor || 'Desconhecido';
  authorStatsRecent[author] = (authorStatsRecent[author] || 0) + item.rework_changes_recent;
});
const rankedAuthorsRecent = Object.entries(authorStatsRecent)
  .map(([autor, total]) => ({ autor, total }))
  .sort((a, b) => Number(b.total) - Number(a.total))
  .slice(0, 10);


return (
    <div>
      <br />
      <h3>Últimos 21 dias</h3>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: 20 }}>
        <label><strong>Início:</strong></label>
        <DatePicker selected={startDate} onChange={setStartDate} />
        <label><strong>Fim:</strong></label>
        <DatePicker selected={endDate} onChange={setEndDate} />
        {csvReady && (
          <button onClick={exportCSV} style={{ marginLeft: 'center', padding: '2px 16px' }}>
            📥 Exportar CSV
          </button>
        )}
      </div>

{/* Gráfico - Últimos 21 dias */}
<Plot
  data={[
    {
      x: dates,
      y: recentRates,
      type: 'bar',
      name: `Rework Rate (21 dias)`,
      marker: { color: 'orange' },
    },
  ]}
  layout={{
    width: 1000,
    height: 400,
    paper_bgcolor: '#1c1e26',
    plot_bgcolor: '#1c1e26',
    font: { color: '#eee' },
    title: `📈 Rework Rate - Últimos ${REWORK_DAYS} dias`,
    xaxis: { title: 'Data' },
    yaxis: { title: 'Rework Rate (%)' },
  }}
/>

{/* Tabela - Últimos 21 dias */}
<h3>🏆 Top Autores:</h3>
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
  <thead style={{ background: '#2a2a2a' }}>
    <tr>
      <th style={{ textAlign: 'center', padding: 8, color: '#eee' }}>Autor</th>
      <th style={{ textAlign: 'center', padding: 8, color: '#eee' }}>Linhas de Retrabalho</th>
    </tr>
  </thead>
  <tbody>
    {rankedAuthorsRecent.map(({ autor, total }, index) => (
      <tr key={index} style={{ borderBottom: '1px solid #444' }}>
        <td style={{ padding: 8, color: '#ccc' }}>{autor}</td>
        <td style={{ padding: 8, color: '#ccc' }}>{Number(total)}</td>
      </tr>
    ))}
  </tbody>
</table>
      <br />
      <h3>Período Completo do Repositório</h3>
      {/* Gráfico - Total */}
      <Plot
        data={[
          {
            x: fullDates,
            y: fullTotalRates,
            type: 'bar',
            mode: 'lines+markers',
            name: 'Rework Rate Total',
            marker: { color: 'light-blue' },
          },
        ]}
        layout={{
          width: 1000,
          height: 400,
          paper_bgcolor: '#1c1e26',
          plot_bgcolor: '#1c1e26',
          font: { color: '#eee' },
          title: '📈 Rework Rate Geral',
          xaxis: { title: 'Data' },
          yaxis: { title: 'Rework Rate (%)' },
        }}
      />

      {/* Tabela - Total */}
      <h3>🏅 Top Autores:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead style={{ background: '#2a2a2a' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Autor</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Total de Linhas de Retrabalho</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            rawData.reduce((acc, cur) => {
              const a = cur.autor || 'Desconhecido';
              acc[a] = (acc[a] || 0) + cur.rework_changes_total;
              return acc;
            }, {})
          )
            .map(([autor, total]) => ({ autor, total }))
            .sort((a, b) => Number(b.total) - Number(a.total))
            .slice(0, 10)
            .map(({ autor, total }, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 8 }}>{autor}</td>
                <td style={{ padding: 8 }}>{Number(total)}</td>
              </tr>
            ))}
        </tbody>
      </table>

    </div>
  );
}