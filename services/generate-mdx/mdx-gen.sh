#!/bin/bash

set -e

for repo in $REPOS; do
  mkdir -p "docs/$repo"

  cat > "docs/$repo/_category_.json" <<EOF
{
  "label": "📊 ${repo//-/ }",
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

<BrowserOnly fallback={<div>Carregando gráfico...</div>}>
  {() => {
    const CodeChurnDashboard = require('@site/src/components/CodeChurnDashboard').default;
    const repoMap = require('@site/src/data/repoMap').repoMap;
    const repoId = "$repo";

    if (!repoMap[repoId] || !repoMap[repoId].churn) {
      return <div>⚠️ Dados de churn indisponíveis para o repositório: {repoId}</div>;
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

<BrowserOnly fallback={<div>Carregando gráfico...</div>}>
  {() => {
    const RefactorDashboard = require('@site/src/components/RefactorDashboard').default;
    const { repoMap } = require('@site/src/data/repoMap');
    return (
      <RefactorDashboard
        repo="$repo"
        data={repoMap["$repo"].refactor}
      />
    );
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

<BrowserOnly fallback={<div>Carregando gráfico...</div>}>
  {() => {
    const ReworkDashboard = require('@site/src/components/ReworkDashboard').default;
    const { repoMap } = require('@site/src/data/repoMap');
    return (
      <ReworkDashboard
        repo="$repo"
        data={repoMap["$repo"].rework}
      />
    );
  }}
</BrowserOnly>
EOF

done
