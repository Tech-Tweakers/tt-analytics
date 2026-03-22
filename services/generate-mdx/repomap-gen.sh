#!/bin/bash
set -e

echo "Gerando repoMap dinamicamente..."

echo "// Arquivo gerado automaticamente" > src/data/repoMap.js
echo "" >> src/data/repoMap.js

> temp_map.txt

for file in src/data/*.js; do
  filename=$(basename "$file" .js)
  if [[ "$filename" == "repoMap" ]]; then continue; fi

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

  repo_key=$(echo "$repo_name" | tr '[:upper:]' '[:lower:]')
  clean_repo=$(echo "$repo_key" | tr -d '_-')
  const_name="${prefix}${clean_repo}"

  echo "import $const_name from './$filename.js';" >> src/data/repoMap.js
  echo "$repo_key;$prefix;$const_name" >> temp_map.txt
done

echo "" >> src/data/repoMap.js
echo "export const repoMap = {" >> src/data/repoMap.js

while read -r repo; do
  echo "  '$repo': {" >> src/data/repoMap.js
  grep "^${repo};" temp_map.txt | while IFS=';' read -r _ type const_ref; do
    echo "    $type: $const_ref," >> src/data/repoMap.js
  done
  echo "  }," >> src/data/repoMap.js
done < <(cut -d ';' -f1 temp_map.txt | sort -u)

echo "};" >> src/data/repoMap.js
rm -f temp_map.txt

echo "repoMap.js atualizado com sucesso!"
