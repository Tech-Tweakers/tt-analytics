
# 📊 TT Analytics Dashboard

**TT Analytics Dashboard** é uma aplicação robusta criada pela equipe **Tech Tweakers** para monitorar e analisar a qualidade do código-fonte dos repositórios da sua organização. Com métricas claras e visuais, facilita a identificação rápida de padrões de retrabalho (**Rework Rate**) e volume de mudanças (**Code Churn**).

## 🚀 Objetivos

- Monitorar continuamente a qualidade do código.
- Visualizar claramente a taxa de retrabalho geral e recente (últimos 21 dias).
- Avaliar o volume semanal de alterações (Code Churn).
- Identificar rapidamente autores que mais impactam negativamente o código.
- Exportar dados para análises adicionais (CSV).
- Antecipar riscos e instabilidades no desenvolvimento.

## 🛠️ Funcionalidades

### Rework Rate

- Taxa de retrabalho histórico (desde o início do repositório).
- Retrabalho recente, com janela configurável (padrão: últimos 21 dias).
- Ranking dos autores com maior retrabalho.

### Code Churn

- Volume total e médio de mudanças por commit.
- Evolução semanal das alterações realizadas.
- Identificação dos arquivos e autores com maior churn.

### Interface

- Dashboard visual intuitivo, com gráficos interativos (Plotly).
- Navegação estruturada e organizada automaticamente pelo Docusaurus.
- Facilidade para exportar os dados visualizados.

## ⚙️ Tecnologias

- **Python** para coleta e análise de dados via GitHub API.
- **React e Docusaurus** para construção do front-end interativo.
- **Plotly** para visualização avançada e exportável dos dados.
- **GitHub Actions** para automação contínua dos processos.

## 📂 Estrutura do projeto

```
tt-analytics/
├── data/
│   └── repos/
│       ├── rework_analysis_<repo>.json
│       └── code_churn_<repo>.json
├── docs/
│   ├── polaris-api-python/
│   │   ├── _category_.json
│   │   ├── rework-rate.mdx
│   │   └── code-churn.mdx
│   └── index.mdx
├── src/
│   ├── components/
│   │   ├── ReworkDashboard.tsx
│   │   └── CodeChurnDashboard.tsx
│   └── pages/
│       └── index.tsx
├── sidebars.ts
├── package.json
└── README.md
```

## 🚧 Como rodar localmente

### Pré-requisitos

- Node.js
- npm

### Instalação

```bash
git clone https://github.com/tech-tweakers/tt-analytics.git
cd tt-analytics
npm install
```

### Executando localmente

```bash
npm start
```

Acesse em [http://localhost:3000](http://localhost:3000).

### Build e Deploy

```bash
npm run build
npm run deploy
```

## 📬 Contribuições

Contribuições são sempre bem-vindas! Abra um PR ou entre em contato com a equipe técnica.

## 🧑‍💻 Equipe técnica

- Tech Tweakers © 2025

---