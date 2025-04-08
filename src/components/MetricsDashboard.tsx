import React from 'react';
import CodeChurnDashboard from './CodeChurnDashboard';
import ReworkDashboard from './ReworkDashboard';
import { repoMap } from '../data/repoMap';

const MetricsDashboard = ({ repo, type }) => {
  const data = repoMap[repo];

  if (!data || !data[type]) {
    return <div>⚠️ Dados não encontrados para {repo} / {type}</div>;
  }

  switch (type) {
    case 'churn':
      return <CodeChurnDashboard data={data.churn} repo={repo} />;
    case 'rework':
      return <ReworkDashboard data={data.rework} repo={repo} />;
    default:
      return <div>⚠️ Tipo inválido: {type}</div>;
  }
};

export default MetricsDashboard;
