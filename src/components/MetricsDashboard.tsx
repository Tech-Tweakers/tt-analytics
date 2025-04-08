import CodeChurnDashboard from './CodeChurnDashboard';
import ReworkDashboard from './ReworkDashboard';
import { repoMap } from '../../src/data/repoMap';

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
    return <ReworkDashboard repo={repo} data={data} />;
  }

  if (type === 'churn') {
    return <CodeChurnDashboard repo={repo} data={data} />;
  }

  return <div>❓ Tipo de métrica inválido: {type}</div>;
};

export default MetricsDashboard;
