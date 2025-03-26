# 📊 Análise de Retrabalho no Código (Rework Rate)

Este repositório contém um **script de análise de retrabalho (Rework Rate) no código**, que coleta dados dos commits do GitHub e calcula a frequência com que as mesmas linhas são alteradas.

🔹 **Objetivo**: Identificar padrões de retrabalho no código, fornecendo métricas detalhadas para melhorar a qualidade do desenvolvimento.  
🔹 **Funcionamento**: O script analisa todos os commits de um repositório, calcula o rework rate e armazena os resultados em um JSON para consultas futuras.

---

## 🚀 Como Funciona?

1️⃣ **O script coleta todos os commits da branch configurada.**  
2️⃣ **Cada commit é analisado, e as alterações de código são registradas.**  
3️⃣ **Se uma linha for alterada repetidamente, é considerada retrabalho.**  
4️⃣ **Os dados são armazenados em um arquivo JSON para análise contínua.**  
5️⃣ **Os resultados são exibidos no terminal e podem ser usados para gerar gráficos e relatórios.**  

---

## 🛠️ Como Executar o Script?

### **1️⃣ Configurar variáveis de ambiente**
Crie um arquivo **.env** e defina as seguintes variáveis:

```env
GITHUB_TOKEN=seu_token_aqui
OWNER=seu_usuario_ou_organizacao
REPO=nome_do_repositorio
THRESHOLD=3
```

### **2️⃣ Instalar dependências**
Certifique-se de ter o **Python 3.9+** instalado.  
Depois, instale os pacotes necessários:

```sh
pip install requests pandas matplotlib
```

### **3️⃣ Executar o script**
```sh
python main.py
```

---

## 📁 Formato do JSON Gerado (`rework_analysis_REPO.json`)

Os resultados da análise são armazenados no formato JSON para facilitar futuras consultas.  

Exemplo de saída:

```json
[
    {
        "data": "2025-03-14",
        "sha": "a1b2c3d",
        "total_changes": 120,
        "rework_changes_total": 30,
        "rework_rate_total": 25.0,
        "rework_changes_recent": 15,
        "rework_rate_recent": 12.5,
        "arquivos_modificados": ["src/main.py", "utils/helpers.py"]
    }
]
```

| 🔹 Campo                 | 📖 Descrição |
|--------------------------|-------------|
| `data`                   | Data do commit analisado (YYYY-MM-DD) |
| `sha`                    | Identificador único do commit |
| `total_changes`          | Total de linhas alteradas no commit |
| `rework_changes_total`   | Total de linhas alteradas que foram modificadas antes |
| `rework_rate_total`      | Percentual de retrabalho considerando todo o histórico |
| `rework_changes_recent`  | Total de linhas alteradas recentemente |
| `rework_rate_recent`     | Percentual de retrabalho considerando apenas os últimos 21 dias |
| `arquivos_modificados`   | Lista de arquivos alterados no commit |

---

## 📊 Exemplo de Saída no Terminal

Ao rodar o script, ele exibe um resumo das métricas calculadas:

```
📊 **RESULTADOS FINAIS:**
🔹 Total de Commits analisados: 150
🔹 Total de Linhas Analisadas: 12,000
🔹 Total de Linhas de Retrabalho: 3,560
🔹 Total de Linhas de Retrabalho nos últimos 21 dias: 1,230
🔹 Rework Rate Geral: 2.35%
🔹 Rework Rate nos últimos 21 dias: 1.76%
```

---

## 📆 Agendamento Automático (GitHub Actions)

Para rodar automaticamente a cada 6 horas, utilize o seguinte **workflow do GitHub Actions**:

```yaml
name: Rework Analysis

on:
  schedule:
    - cron: "0 */6 * * *"
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: 🛠️ Checkout do repositório
        uses: actions/checkout@v3

      - name: 🐍 Configurar Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: 📦 Instalar dependências
        run: pip install requests pandas matplotlib

      - name: 🚀 Rodar análise
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OWNER: "seu_usuario_ou_organizacao"
          REPO: "nome_do_repositorio"
          THRESHOLD: "3"
        run: python main.py

      - name: 💾 Commit e Push dos resultados
        run: |
          git config --global user.name 'github-actions'
          git config --global user.email 'actions@github.com'
          git add rework_analysis_*.json
          git commit -m "🔄 Atualizando métricas de retrabalho" || echo "⚠️ Nenhuma alteração para commitar"
          git push origin main || echo "⚠️ Nenhuma alteração para push"
```

---

## 📌 Próximos Passos

✅ Melhorar a visualização das métricas geradas  
✅ Integrar com gráficos e relatórios interativos  
✅ Implementar análise preditiva para alertar sobre alto retrabalho  

---

## 📜 Licença
Este projeto está licenciado sob a **MIT License**.  
Sinta-se livre para contribuir e adaptar conforme necessário! 🤝  