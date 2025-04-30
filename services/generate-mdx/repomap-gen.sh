#!/bin/bash
set -e

echo "🧠 Gerando repoMap dinamicamente..."

echo "// ⚡️ Arquivo gerado automaticamente pelo GitHub Actions" > src/data/repoMap.js
echo "" >> src/data/repoMap.js

for file in src/data/*.js; do
  filename=$(basename "$file" .js)
  if [[ "$filename" == "repomap" ]]; then continue; fi

  if [[ "$filename" == code_churn_* ]]; then
    prefix="churn"
    repo_name="${filename#code_churn_}"
  elif [[ "$filename" == rework_rate_* ]]; then
    prefix="rework"
    repo_name="${filename#rework_rate_}"
  elif [[ "$filename" == refactor_rate_* ]]; then
    prefix="refactor"
    repo_name="${filename#refactor_rate_}"
  else
    continue
  fi

  # Tudo em minúsculo e sem hífen/underscore
  repo_key=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]')
  clean_repo=$(echo "$repo_key" | tr -d '_-')
  const_name="${prefix}${clean_repo}"

  echo "import $const_name from './$filename.js';" >> src/data/repoMap.js
  echo "$repo_key;$prefix;$const_name" >> temp_map.txt
done

echo "" >> src/data/repoMap.js
echo "export const repoMap = {" >> src/data/repoMap.js

cut -d ';' -f1 temp_map.txt | sort -u | while read repo; do
  echo "  '$repo': {" >> src/data/repoMap.js
  grep "^$repo;" temp_map.txt | while IFS=';' read _ type const; do
    echo "    $type: $const," >> src/data/repoMap.js
  done
  echo "  }," >> src/data/repoMap.js
done

echo "};" >> src/data/repoMap.js
rm temp_map.txt

echo "// 👻 Forçado pelo pipeline em $(date -u)" >> src/data/repoMap.js
echo "✅ repoMap.js atualizado com sucesso!"
