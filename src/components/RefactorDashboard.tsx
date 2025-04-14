import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';

type RefactorEntry = {
  data: string;
  sha: string;
  autor: string;
  total_lines: number;
  refactor_lines: number;
  refactor_detected: boolean;
  arquivos_refatorados: string[];
};

interface RefactorData {
  data: RefactorEntry[];
}

interface Props {
  repo: string;
  data: RefactorData;
}


const RefactorDashboard: React.FC<Props> = ({ repo, data }) => {
  const [rawData, setRawData] = useState<RefactorEntry[]>([]);
  const [filteredData, setFilteredData] = useState<RefactorEntry[]>([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 21)));
  const [endDate, setEndDate] = useState(new Date());
  const [csvReady, setCsvReady] = useState(false);

  console.log("📦 PROPS -> repo:", repo);
  console.log("📦 PROPS -> data:", data);
  console.log("📦 PROPS -> data.data:", data?.data);

  useEffect(() => {
    if (!data || !Array.isArray(data.data)) return;
    const sorted = data.data.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    setRawData(sorted);
    setFilteredData(sorted);
  }, [data]);

  useEffect(() => {
    const inicio = new Date(startDate);
    const fim = new Date(endDate);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);

    const filtered = rawData.filter(entry => {
      const d = new Date(entry.data);
      return d >= inicio && d <= fim;
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
    link.setAttribute("download", `refactor_data_${repo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dates = filteredData.map(d => d.data);
  const refactorRates = filteredData.map(d => d.refactor_lines / d.total_lines * 100);

  const authorStats = filteredData.reduce((acc, item) => {
    const author = item.autor || 'Desconhecido';
    acc[author] = (acc[author] || 0) + item.refactor_lines;
    return acc;
  }, {} as Record<string, number>);
  const rankedAuthors = Object.entries(authorStats)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div>
      <br />
      <h3>Refactor Rate - Últimos 21 dias</h3>
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
            y: refactorRates,
            type: 'bar',
            name: `Refactor Rate (%)`,
            marker: { color: 'lightgreen' },
            text: filteredData.map((d) =>
              `📅 Data: ${d.data}<br>` +
              `🔁 SHA: ${d.sha.slice(0, 7)}<br>` +
              `👤 Autor: ${d.autor}<br>` +
              `📊 Total Linhas: ${d.total_lines}<br>` +
              `🛠️ Refatoradas: ${d.refactor_lines} (${((d.refactor_lines / d.total_lines) * 100).toFixed(2)}%)<br>` +
              `📂 Arquivos: ${d.arquivos_refatorados.join(", ")}`
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
          title: '📈 Refactor Rate (%) por Data',
          xaxis: { title: 'Data' },
          yaxis: { title: 'Refactor Rate (%)' },
        }}
      />

      <h3>🏅 Top Autores de Refatoração:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead style={{ background: '#2a2a2a' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Autor</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Total de Linhas Refatoradas</th>
          </tr>
        </thead>
        <tbody>
          {rankedAuthors.map(({ autor, total }, index) => (
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
            x: rawData.map(d => d.data),
            y: rawData.map(d => (d.refactor_lines / d.total_lines) * 100),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Refactor Rate Geral',
            marker: { color: 'deepskyblue' },
            text: rawData.map((d) =>
                `📅 Data: ${d.data}<br>` +
                `🔁 SHA: ${d.sha.slice(0, 7)}<br>` +
                `👤 Autor: ${d.autor}<br>` +
                `📊 Linhas totais: ${d.total_lines}<br>` +
                `🛠️ Refatoradas: ${d.refactor_lines} (${((d.refactor_lines / d.total_lines) * 100).toFixed(2)}%)<br>` +
                `📂 Arquivos: ${d.arquivos_refatorados.join(", ")}`
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
            title: '📈 Refactor Rate Geral (Histórico Completo)',
            xaxis: { title: 'Data' },
            yaxis: { title: 'Refactor Rate (%)' },
        }}
        />
    </div>
  );

};

export default RefactorDashboard;
