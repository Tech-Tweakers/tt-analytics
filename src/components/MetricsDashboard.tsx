import React from 'react';
import { repoMap } from '../../src/data/repoMap';
import ReworkDashboard from './ReworkDashboard';
import CodeChurnDashboard from './CodeChurnDashboard';

interface Props {
  repo: string;
  type: 'rework' | 'churn';
}

const MetricsDashboard: React.FC<Props> = ({ repo, type }) => {
  const data = repoMap[repo]?.[type];

  if (!data) {
    return (
      <div style={{ color: 'red' }}>
        ❌ Dados de <strong>{type}</strong> não encontrados para o repositório: <em>{repo}</em>
      </div>
    );
  }

  if (type === 'rework') {
    return <ReworkDashboard repo={repo} />;
  }
  
  if (type === 'churn') {
    return <CodeChurnDashboard repo={repo} />;
  }

  return <div>❓ Tipo de métrica inválido: {type}</div>;
};

export default MetricsDashboard;
