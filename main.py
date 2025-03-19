import requests
import json
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
import os

START_DATE = os.getenv("START_DATE", "2000-01-01")  # Padrão: tudo
END_DATE = os.getenv("END_DATE")  # Pode estar vazio
if not END_DATE:
    END_DATE = datetime.utcnow().strftime("%Y-%m-%d")
START_DATE = datetime.strptime(START_DATE, "%Y-%m-%d")
END_DATE = datetime.strptime(END_DATE, "%Y-%m-%d")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
THRESHOLD = os.getenv("THRESHOLD")
REWORK_DAYS = 21
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

json_file = f"data/repos/rework_analysis_{REPO}.json"


def load_json(filename):
    """Carrega JSON existente e verifica se o THRESHOLD mudou."""
    if not os.path.exists(filename):
        print(f"⚠️ Arquivo {filename} não encontrado. Criando novo JSON...")
        save_json(filename, {"threshold": int(THRESHOLD), "data": []})
        return {"threshold": int(THRESHOLD), "data": []}

    if os.path.getsize(filename) == 0:
        print(f"⚠️ {filename} está vazio. Criando novo JSON...")
        save_json(filename, {"threshold": int(THRESHOLD), "data": []})
        return {"threshold": int(THRESHOLD), "data": []}

    with open(filename, "r") as f:
        try:
            data = json.load(f)
            print("📂 JSON carregado:", data)  # <-- Verifique os dados carregados

            if isinstance(data, dict) and "threshold" in data and "data" in data:
                if data["threshold"] != int(THRESHOLD):
                    print(
                        f"⚠️ THRESHOLD mudou ({data['threshold']} → {THRESHOLD}). Reprocessando dados..."
                    )
                    return {"threshold": int(THRESHOLD), "data": []}
                return data
            else:
                print(f"⚠️ JSON no formato incorreto. Recriando...")

        except json.JSONDecodeError:
            print(f"⚠️ Erro ao carregar {filename}, recriando arquivo...")

    return {"threshold": int(THRESHOLD), "data": []}


def save_json(filename, data):
    """Salva os dados no JSON."""
    if not isinstance(data, dict) or "threshold" not in data or "data" not in data:
        print(f"⚠️ Tentativa de salvar JSON inválido: {data}")
        return

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"✅ JSON salvo com sucesso em {filename}")


def get_commits(owner, repo, branch):
    """Obtém a lista completa de commits do branch."""
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    params = {"sha": branch, "per_page": 100}
    commits = []

    print(f"📥 Buscando commits no branch '{branch}' de {owner}/{repo}...")

    while url:
        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code != 200:
            raise Exception(f"❌ Erro ao buscar commits: {response.json()}")

        data = response.json()
        commits.extend(data)

        url = response.links.get("next", {}).get("url")

    print(f"✅ {len(commits)} commits encontrados!")
    return commits


def get_commit_changes(owner, repo, sha):
    """Obtém os arquivos e linhas modificadas em um commit."""
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        print(f"⚠️ Falha ao buscar detalhes do commit {sha}")
        return None

    data = response.json()
    files = data.get("files", [])

    changes = {}
    for file in files:
        filename = file["filename"]
        patch = file.get("patch", "")

        if patch:
            changed_lines = set()
            for line in patch.split("\n"):
                if line.startswith("+") and not line.startswith(
                    "+++"
                ):  # Linhas adicionadas
                    changed_lines.add(line)
                elif line.startswith("-") and not line.startswith(
                    "---"
                ):  # Linhas removidas
                    changed_lines.add(line)

            changes[filename] = changed_lines

    return changes


def analyze_rework(commits):
    """Analisa commits e salva no JSON."""
    json_data = load_json(
        json_file
    )  # Agora retorna um dicionário com 'threshold' e 'data'
    rework_data = json_data["data"]  # Pegamos apenas a lista de commits
    existing_data = {
        entry["sha"]: entry for entry in rework_data
    }  # Dict de commits já analisados

    total_rework_rate = 0
    total_rework_rate_recent = 0
    total_commits = 0

    total_lines_analyzed = 0
    total_lines_rework = 0
    total_lines_rework_recent = 0

    for i, commit in enumerate(commits, 1):
        sha = commit["sha"]
        date = commit["commit"]["author"]["date"]
        commit_date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")

        # 📌 Filtrar commits fora do período desejado
        if not (START_DATE <= commit_date <= END_DATE):
            continue  # Pula commits fora do intervalo

        if sha in existing_data:
            print(f"🔄 Commit {sha[:7]} já existe no JSON. Usando dados armazenados...")
            commit_data = existing_data[sha]
        else:
            print(f"\n🔹 [{i}/{len(commits)}] Processando commit {sha[:7]} ({date})")

            changes = get_commit_changes(OWNER, REPO, sha)
            if not changes:
                continue

            total_changes = sum(len(lines) for lines in changes.values())

            rework_changes_total = sum(
                1
                for file in changes
                for line in changes[file]
                if len(changes[file]) >= int(THRESHOLD)
            )
            rework_changes_recent = sum(
                1
                for file in changes
                for line in changes[file]
                if len(changes[file]) >= int(THRESHOLD)
                and commit_date >= datetime.utcnow() - timedelta(days=REWORK_DAYS)
            )

            rework_rate_total = (
                (rework_changes_total / total_changes) * 100 if total_changes > 0 else 0
            )
            rework_rate_recent = (
                (rework_changes_recent / total_changes) * 100
                if total_changes > 0
                else 0
            )

            commit_data = {
                "data": date[:10],
                "sha": sha,
                "total_changes": total_changes,
                "rework_changes_total": rework_changes_total,
                "rework_rate_total": rework_rate_total,
                "rework_changes_recent": rework_changes_recent,
                "rework_rate_recent": rework_rate_recent,
                "arquivos_modificados": list(changes.keys()),
            }

            rework_data.append(commit_data)

        # Somando os resultados para o print final
        total_rework_rate += commit_data["rework_rate_total"]
        total_rework_rate_recent += commit_data["rework_rate_recent"]
        total_commits += 1

        total_lines_analyzed += commit_data["total_changes"]
        total_lines_rework += commit_data["rework_changes_total"]
        total_lines_rework_recent += commit_data["rework_changes_recent"]

    save_json(json_file, {"threshold": int(THRESHOLD), "data": rework_data})

    print(f"📊 JSON atualizado com histórico completo de commits: {json_file}")

    # Exibir as métricas no final
    if total_commits > 0:
        average_rework_rate = total_rework_rate / total_commits
        average_rework_rate_recent = total_rework_rate_recent / total_commits

        print("\n📊 **RESULTADOS FINAIS:**")
        print(f"🔹 Total de Commits analisados: {total_commits}")
        print(f"🔹 Total de Linhas Analisadas: {total_lines_analyzed}")
        print(f"🔹 Total de Linhas de Retrabalho: {total_lines_rework}")
        print(
            f"🔹 Total de Linhas de Retrabalho nos últimos {REWORK_DAYS} dias: {total_lines_rework_recent}"
        )
        print(f"🔹 Rework Rate Geral: {average_rework_rate:.2f}%")
        print(
            f"🔹 Rework Rate nos últimos {REWORK_DAYS} dias: {average_rework_rate_recent:.2f}%"
        )
    else:
        print("⚠️ Nenhum commit foi analisado.")


import plotly.express as px
import pandas as pd

def generate_graph():
    """Gera gráficos interativos usando Plotly com informações detalhadas para a gestão."""
    rework_data = load_json(json_file)

    # 📌 Criar DataFrame a partir dos dados
    df = pd.DataFrame(rework_data["data"])

    # 📌 Verificar se há dados válidos
    if df.empty or "total_changes" not in df.columns:
        print("⚠️ O JSON não contém dados válidos. Certifique-se de rodar analyze_rework() antes de gerar o gráfico.")
        return

    # 📌 Converter a data para formato datetime
    df["data"] = pd.to_datetime(df["data"])

    # 📌 Filtrar os dados no período desejado
    df = df[(df["data"] >= START_DATE) & (df["data"] <= END_DATE)]

    # 📌 Verificar se há dados após o filtro
    if df.empty:
        print(f"⚠️ Nenhum commit encontrado no período de {START_DATE.date()} a {END_DATE.date()}.")
        return

    # 📌 Ordenar os dados por data
    df = df.sort_values("data")

    # 📌 Calcular métricas para exibição no box
    total_commits = len(df)
    total_lines_analyzed = df["total_changes"].sum()
    total_lines_rework = df["rework_changes_total"].sum()
    total_lines_rework_recent = df["rework_changes_recent"].sum()
    average_rework_rate = df["rework_rate_total"].mean()
    average_rework_rate_recent = df["rework_rate_recent"].mean()

    metrics_text = (
        "📌 <b>Métricas da Análise</b><br>"
        f"🔹 <b>Commits analisados:</b> {total_commits}<br>"
        f"🔹 <b>Linhas analisadas:</b> {total_lines_analyzed}<br>"
        f"🔹 <b>Linhas de retrabalho:</b> {total_lines_rework}<br>"
        f"🔹 <b>Retrabalho (Últimos {REWORK_DAYS} dias):</b> {total_lines_rework_recent}<br>"
        f"🔹 <b>Rework Rate Médio:</b> {average_rework_rate:.2f}%<br>"
        f"🔹 <b>Rework Rate (Últimos {REWORK_DAYS} dias):</b> {average_rework_rate_recent:.2f}%<br>"
        f"🔹 <b>Threshold utilizado:</b> {THRESHOLD}"
    )

    # 📌 Criar tooltip detalhado
    df["tooltip"] = df.apply(lambda row: f"""
        📅 Data: {row['data'].strftime('%Y-%m-%d')}<br>
        🔄 SHA: {row['sha'][:7]}<br>
        📊 Total de mudanças: {row['total_changes']}<br>
        🔥 Linhas de retrabalho: {row['rework_changes_total']} ({row['rework_rate_total']:.2f}%)<br>
        📂 Arquivos modificados: {len(row['arquivos_modificados'])}
    """, axis=1)

    # 📌 Encontrar os 3 maiores picos de retrabalho
    top3_total = df.nlargest(3, "rework_rate_total")
    top3_recent = df.nlargest(3, "rework_rate_recent")

    # 📊 Gráfico 1: Rework Rate Total
    fig1 = px.line(df, x="data", y="rework_rate_total", markers=True,
                   title=f"📊 Rework Rate Geral - {REPO}",
                   labels={"data": "Data", "rework_rate_total": "Rework Rate (%)"},
                   hover_data={"tooltip": True})
    fig1.update_traces(marker=dict(size=6), hovertemplate=df["tooltip"])

    # 📌 Adicionar anotações para os top 3 picos
    colors = ["blue", "darkblue", "cyan"]
    for i, (idx, row) in enumerate(top3_total.iterrows()):
        fig1.add_annotation(
            x=row["data"], y=row["rework_rate_total"],
            text=f"Pico {i+1}: {row['rework_rate_total']:.2f}%",
            showarrow=True, arrowhead=2, arrowcolor=colors[i]
        )

    # 📌 Adicionar Box de Métricas no Gráfico
    fig1.add_annotation(
        text=metrics_text,
        align="left",
        showarrow=False,
        xref="paper", yref="paper",
        x=0.02, y=0.02,  # 📌 Move o box para o canto inferior esquerdo
        bordercolor="black",
        borderwidth=1,
        bgcolor="rgba(240, 240, 240, 0.85)",  # Cinza claro semi-transparente
        font=dict(size=12, color="black"),
        opacity=0.8
    )

    # 📌 Ajustar eixo X
    fig1.update_xaxes(nticks=10)

    # 📌 Salvar como HTML
    fig1.write_html(f"data/graphs/rework_rate_total-{REPO}.html")

    # 📊 Gráfico 2: Rework Rate Recent (Últimos 21 dias)
    fig2 = px.line(df, x="data", y="rework_rate_recent", markers=True,
                   title=f"📊 Rework Rate nos últimos {REWORK_DAYS} dias - {REPO}",
                   labels={"data": "Data", "rework_rate_recent": "Rework Rate (%)"},
                   hover_data={"tooltip": True})
    fig2.update_traces(marker=dict(size=6), hovertemplate=df["tooltip"])

    # 📌 Adicionar anotações para os top 3 picos recentes
    colors = ["red", "darkred", "orange"]
    for i, (idx, row) in enumerate(top3_recent.iterrows()):
        fig2.add_annotation(
            x=row["data"], y=row["rework_rate_recent"],
            text=f"Pico {i+1}: {row['rework_rate_recent']:.2f}%",
            showarrow=True, arrowhead=2, arrowcolor=colors[i]
        )

    # 📌 Adicionar Box de Métricas no Gráfico
    fig2.add_annotation(
        text=metrics_text,
        align="left",
        showarrow=False,
        xref="paper", yref="paper",
        x=0.01, y=0.99,
        bordercolor="black",
        borderwidth=1,
        bgcolor="rgba(255,255,255,0.8)",
        font=dict(size=12)
    )

    # 📌 Ajustar eixo X
    fig2.update_xaxes(nticks=10)

    # 📌 Salvar como HTML
    fig2.write_html(f"data/graphs/rework_rate_recent-{REPO}.html")

    print(f"📊 Gráficos interativos ultra detalhados gerados e salvos!")


if __name__ == "__main__":
    commits = get_commits(OWNER, REPO, "main")
    analyze_rework(commits)
    generate_graph()
