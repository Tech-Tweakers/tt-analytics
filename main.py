import requests
import json
import pandas as pd
import plotly.express as px
import matplotlib.pyplot as plt
from collections import defaultdict
from datetime import datetime, timedelta
import os

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
THRESHOLD = os.getenv("THRESHOLD")
REWORK_DAYS = 21
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

json_file = f"rework_analysis_{REPO}.json"


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
                    print(f"⚠️ THRESHOLD mudou ({data['threshold']} → {THRESHOLD}). Reprocessando dados...")
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


def generate_graph():
    """Gera gráficos interativos usando Plotly e salva em arquivos HTML."""
    rework_data = load_json(json_file)

    # 📌 Criar DataFrame a partir dos dados
    df = pd.DataFrame(rework_data["data"])

    # 📌 Verificar se há dados válidos
    if df.empty or "total_changes" not in df.columns:
        print("⚠️ O JSON não contém dados válidos. Certifique-se de rodar analyze_rework() antes de gerar o gráfico.")
        return

    # 📌 Converter a data para formato datetime e ordenar
    df["data"] = pd.to_datetime(df["data"])
    df = df.sort_values("data")

    # 📌 Gráfico 1: Rework Rate Total
    fig1 = px.line(df, x="data", y="rework_rate_total", markers=True,
                   title="Evolução do Rework Rate Geral",
                   labels={"data": "Data", "rework_rate_total": "Rework Rate (%)"})
    fig1.write_html("rework_rate_total.html")  # 📌 Salva o gráfico como HTML

    # 📌 Gráfico 2: Rework Rate Recent (Últimos 21 dias)
    fig2 = px.line(df, x="data", y="rework_rate_recent", markers=True,
                   title=f"Evolução do Rework Rate nos últimos {REWORK_DAYS} dias",
                   labels={"data": "Data", "rework_rate_recent": "Rework Rate (%)"})
    fig2.write_html("rework_rate_recent.html")  # 📌 Salva o gráfico como HTML

    print("📊 Gráficos salvos como HTML interativos para análise.")


if __name__ == "__main__":
    commits = get_commits(OWNER, REPO, "main")
    analyze_rework(commits)
    generate_graph()
