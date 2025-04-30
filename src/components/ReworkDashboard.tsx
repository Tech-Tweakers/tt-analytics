import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';

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

interface ReworkData {
  threshold: number;
  data: ReworkEntry[];
}

interface Props {
  repo: string;
  data: ReworkData;
}


const ReworkDashboard: React.FC<Props> = ({ repo, data }) => {
  const [rawData, setRawData] = useState<ReworkEntry[]>([]);
  const [filteredData, setFilteredData] = useState<ReworkEntry[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - REWORK_DAYS)));
  const [endDate, setEndDate] = useState(new Date());
  const [csvReady, setCsvReady] = useState(false);

  if (!data || !Array.isArray(data.data)) {
    return <div>⚠️ Dados de retrabalho indisponíveis para o repositório: {repo}</div>;
  }

  useEffect(() => {
    const sorted = data.data.sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    setRawData(sorted);
    setFilteredData(sorted);
  }, [data]);

  useEffect(() => {
    if (rawData.length === 0) return;
  
    const inicio = new Date(startDate);
    const fim = new Date(endDate);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
  
    const filtered = rawData.filter(entry => {
      const d = new Date(`${entry.data}T00:00:00`);
      const isInRange = d >= inicio && d <= fim;
  
      if (!isInRange) {
        console.log("⛔️ Ignorado:", {
          data: entry.data,
          parsed: d.toISOString(),
          start: inicio.toISOString(),
          end: fim.toISOString()
        });
      }
  
      return isInRange;
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
    link.setAttribute("download", `rework_data_${repo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dates = filteredData.map(d => d.data);
  const totalRates = filteredData.map(d => d.rework_rate_total);
  const recentRates = filteredData.map(d => d.rework_rate_recent);

  const fullDates = rawData.map(d => d.data);
  const fullTotalRates = rawData.map(d => d.rework_rate_total);

  const authorStatsRecent = filteredData.reduce((acc, item) => {
    const author = item.autor || 'Desconhecido';
    acc[author] = (acc[author] || 0) + item.rework_changes_recent;
    return acc;
  }, {} as Record<string, number>);
  const rankedAuthorsRecent = Object.entries(authorStatsRecent)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const authorStatsTotal = rawData.reduce((acc, item) => {
    const author = item.autor || 'Desconhecido';
    acc[author] = (acc[author] || 0) + item.rework_changes_total;
    return acc;
  }, {} as Record<string, number>);
  const rankedAuthorsTotal = Object.entries(authorStatsTotal)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => b.total - a.total)
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

      <Plot
        data={[
          {
            x: dates,
            y: recentRates,
            type: 'bar',
            name: `Rework Rate (21 dias)`,
            marker: { color: 'orange' },
            text: filteredData.map((d) =>
              `📅 Data: ${d.data}<br>` +
              `🔁 SHA: ${d.sha.slice(0, 7)}<br>` +
              `👤 Autor: ${d.autor}<br>` +
              `📊 Mudanças: ${d.total_changes}<br>` +
              `🔥 Retrabalho recente: ${d.rework_changes_recent} (${d.rework_rate_recent.toFixed(2)}%)`
            ),
            hoverinfo: 'text',
            textposition: 'none',
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

      <h3>📆 Top Autores (Últimos {REWORK_DAYS} dias):</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead style={{ background: '#2a2a2a' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Autor</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Linhas de Retrabalho (21d)</th>
          </tr>
        </thead>
        <tbody>
          {rankedAuthorsRecent.map(({ autor, total }, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: 8 }}>{autor}</td>
              <td style={{ padding: 8 }}>{Number(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Plot
        data={[
          {
            x: fullDates,
            y: fullTotalRates,
            type: 'bar',
            mode: 'lines+markers',
            name: 'Rework Rate Total',
            marker: { color: 'light-blue' },
            text: rawData.map((d) =>
              `📅 Data: ${d.data}<br>` +
              `🔁 SHA: ${d.sha.slice(0, 7)}<br>` +
              `👤 Autor: ${d.autor}<br>` +
              `📊 Mudanças: ${d.total_changes}<br>` +
              `🔥 Retrabalho total: ${d.rework_changes_total} (${d.rework_rate_total.toFixed(2)}%)`
            ),
            hoverinfo: 'text',
            textposition: 'none',
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

      <h3>🏅 Top Autores:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead style={{ background: '#2a2a2a' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Autor</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Total de Linhas de Retrabalho</th>
          </tr>
        </thead>
        <tbody>
          {rankedAuthorsTotal.map(({ autor, total }, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: 8 }}>{autor}</td>
              <td style={{ padding: 8 }}>{Number(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReworkDashboard;
