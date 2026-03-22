#!/bin/bash
set -e

if [ -z "$REPOS" ]; then
  echo "Variavel REPOS nao definida"
  exit 1
fi

for repo in $(echo "$REPOS" | tr ',' ' '); do
  echo "Gerando paginas MDX para: $repo"
  mkdir -p "docs/$repo"

  cat > "docs/$repo/_category_.json" <<EOF
{
  "label": "${repo//-/ }",
  "position": 1,
  "collapsed": true
}
EOF

  cat > "docs/$repo/code-churn.mdx" <<EOF
---
title: Code Churn
hide_title: true
sidebar_label: Code Churn
sidebar_position: 2
---

import BrowserOnly from '@docusaurus/BrowserOnly';

<BrowserOnly fallback={<div>Carregando...</div>}>
  {() => {
    const CodeChurnDashboard = require('@site/src/components/CodeChurnDashboard').default;
    const { repoMap } = require('@site/src/data/repoMap');
    const repoId = "$repo";

    if (!repoMap[repoId] || !repoMap[repoId].churn) {
      return <div>Dados de churn indisponiveis para: {repoId}</div>;
    }

    return <CodeChurnDashboard repo={repoId} data={repoMap[repoId].churn} />;
  }}
</BrowserOnly>
EOF

  cat > "docs/$repo/refactor-rate.mdx" <<EOF
---
title: Refactor Rate
hide_title: true
sidebar_label: Refactor Rate
sidebar_position: 3
---

import BrowserOnly from '@docusaurus/BrowserOnly';

<BrowserOnly fallback={<div>Carregando...</div>}>
  {() => {
    const RefactorDashboard = require('@site/src/components/RefactorDashboard').default;
    const { repoMap } = require('@site/src/data/repoMap');
    const repoId = "$repo";

    if (!repoMap[repoId] || !repoMap[repoId].refactor) {
      return <div>Dados de refatoracao indisponiveis para: {repoId}</div>;
    }

    return <RefactorDashboard repo={repoId} data={repoMap[repoId].refactor} />;
  }}
</BrowserOnly>
EOF

  cat > "docs/$repo/rework-rate.mdx" <<EOF
---
title: Rework Rate
hide_title: true
sidebar_label: Rework Rate
sidebar_position: 4
---

import BrowserOnly from '@docusaurus/BrowserOnly';

<BrowserOnly fallback={<div>Carregando...</div>}>
  {() => {
    const ReworkDashboard = require('@site/src/components/ReworkDashboard').default;
    const { repoMap } = require('@site/src/data/repoMap');
    const repoId = "$repo";

    if (!repoMap[repoId] || !repoMap[repoId].rework) {
      return <div>Dados de rework indisponiveis para: {repoId}</div>;
    }

    return <ReworkDashboard repo={repoId} data={repoMap[repoId].rework} />;
  }}
</BrowserOnly>
EOF

  echo "Paginas MDX criadas para: $repo"
done
