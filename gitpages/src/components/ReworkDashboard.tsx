import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Papa from 'papaparse';
import BrowserOnly from '@docusaurus/BrowserOnly';

const REPO = 'polaris-python-api'; // Altere conforme necessário
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

export default function ReworkGraphsWrapper() {
    return (
        <BrowserOnly fallback={<div>Carregando gráficos...</div>}>
        {() => <ReworkGraphs />}
        </BrowserOnly>
    );
}

function ReworkGraphs() {
    const [rawData, setRawData] = useState<ReworkEntry[]>([]);
    const [filteredData, setFilteredData] = useState<ReworkEntry[]>([]);
    const [startDate, setStartDate] = useState(new Date('2000-01-01'));
    const [endDate, setEndDate] = useState(new Date());
    const [csvReady, setCsvReady] = useState(false);

    useEffect(() => {
        fetch(`/data/repos/rework_analysis_${REPO}.json`)
        .then(res => res.json())
        .then((json: ReworkData) => {
            const sorted = json.data.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
            setRawData(sorted);
            setFilteredData(sorted);
        });
    }, []);
    

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

const authorStats = {};
filteredData.forEach(item => {
    const author = item.autor || 'Desconhecido';
    authorStats[author] = (authorStats[author] || 0) + item.rework_changes_total;
});
const rankedAuthors = Object.entries(authorStats)
    .map(([autor, total]) => ({ autor, total }))
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 10);

return (
    <div>
      <h1>📊 Dashboard de Retrabalho - {REPO}</h1>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: 20 }}>
        <label><strong>Início:</strong></label>
        <DatePicker selected={startDate} onChange={setStartDate} />
        <label><strong>Fim:</strong></label>
        <DatePicker selected={endDate} onChange={setEndDate} />
        {csvReady && (
          <button onClick={exportCSV} style={{ marginLeft: 'auto', padding: '8px 16px' }}>
            📥 Exportar CSV
          </button>
        )}
      </div>

      <Plot
        data={[
          {
            x: dates,
            y: totalRates,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Rework Rate Total',
            marker: { color: 'blue' },
          },
        ]}
        layout={{
          width: 1000,
          height: 400,
          title: '📈 Rework Rate Geral',
          xaxis: { title: 'Data' },
          yaxis: { title: 'Rework Rate (%)' },
        }}
      />

      <Plot
        data={[
          {
            x: dates,
            y: recentRates,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Rework Rate (21 dias)',
            marker: { color: 'orange' },
          },
        ]}
        layout={{
          width: 1000,
          height: 400,
          title: `📈 Rework Rate - Últimos ${REWORK_DAYS} dias`,
          xaxis: { title: 'Data' },
          yaxis: { title: 'Rework Rate (%)' },
        }}
      />

      <h3>🏆 Top 10 Autores com mais retrabalho no período:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Autor</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Total de Linhas de Retrabalho</th>
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
    </div>
  );
}