
import requests
import json
from datetime import datetime, timedelta
import os

START_DATE = os.getenv("START_DATE", "2000-01-01")
END_DATE = os.getenv("END_DATE") or datetime.utcnow().strftime("%Y-%m-%d")
START_DATE = datetime.strptime(START_DATE, "%Y-%m-%d")
END_DATE = datetime.strptime(END_DATE, "%Y-%m-%d")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
THRESHOLD = int(os.getenv("THRESHOLD", 3))
REWORK_DAYS = 21
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

def save_as_js(filename, data, var_name):
    os.makedirs("src/data/repos", exist_ok=True)
    with open(filename, "w") as f:
        f.write(f"const {var_name} = ")
        json.dump(data, f, indent=2)
        f.write(f";\n\nexport default {var_name};\n")
    print(f"✅ JS salvo com sucesso em {filename}")

def get_commits(owner, repo, branch):
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    params = {"sha": branch, "per_page": 100}
    commits = []

    print(f"📥 Buscando commits no branch '{branch}' de {owner}/{repo}...")

    while url:
        response = requests.get(url, headers=HEADERS, params=params)
        if response.status_code != 200:
            raise Exception(f"❌ Erro ao buscar commits: {response.json()}")
        commits.extend(response.json())
        url = response.links.get("next", {}).get("url")

    print(f"✅ {len(commits)} commits encontrados!")
    return commits

def get_commit_changes(owner, repo, sha):
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        print(f"⚠️ Falha ao buscar detalhes do commit {sha}")
        return None, None

    data = response.json()
    author = data.get("commit", {}).get("author", {}).get("name", "Desconhecido")
    files = data.get("files", [])

    changes = {}
    for file in files:
        filename = file["filename"]
        patch = file.get("patch", "")
        if patch:
            changed_lines = set()
            for line in patch.split("\n"):
                if line.startswith("+") and not line.startswith("+++"):
                    changed_lines.add(line)
                elif line.startswith("-") and not line.startswith("---"):
                    changed_lines.add(line)
            changes[filename] = changed_lines

    return author, changes

def analyze_rework(commits):
    rework_data = []
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

        if not (START_DATE <= commit_date <= END_DATE):
            continue

        print(f"🔹 [{i}/{len(commits)}] Processando commit {sha[:7]} ({date})")
        author, changes = get_commit_changes(OWNER, REPO, sha)
        if not changes:
            continue

        total_changes = sum(len(lines) for lines in changes.values())
        rework_changes_total = sum(
            1 for file in changes for line in changes[file] if len(changes[file]) >= THRESHOLD
        )
        rework_changes_recent = sum(
            1 for file in changes for line in changes[file]
            if len(changes[file]) >= THRESHOLD and commit_date >= datetime.utcnow() - timedelta(days=REWORK_DAYS)
        )
        rework_rate_total = (rework_changes_total / total_changes) * 100 if total_changes > 0 else 0
        rework_rate_recent = (rework_changes_recent / total_changes) * 100 if total_changes > 0 else 0

        commit_data = {
            "data": date[:10],
            "sha": sha,
            "autor": author,
            "total_changes": total_changes,
            "rework_changes_total": rework_changes_total,
            "rework_rate_total": rework_rate_total,
            "rework_changes_recent": rework_changes_recent,
            "rework_rate_recent": rework_rate_recent,
            "arquivos_modificados": list(changes.keys()),
        }

        rework_data.append(commit_data)
        total_rework_rate += rework_rate_total
        total_rework_rate_recent += rework_rate_recent
        total_commits += 1
        total_lines_analyzed += total_changes
        total_lines_rework += rework_changes_total
        total_lines_rework_recent += rework_changes_recent

    output_js = f"src/data/repos/rework_rate_{REPO}.js"
    var_name = f"rework{REPO.replace('-', '').capitalize()}"
    save_as_js(output_js, {"threshold": THRESHOLD, "data": rework_data}, var_name)

    print(f"📊 JS atualizado com histórico completo de commits: {output_js}")

    if total_commits > 0:
        print(f"\n📊 **RESULTADOS FINAIS:**")
        print(f"🔹 Total de Commits analisados: {total_commits}")
        print(f"🔹 Total de Linhas Analisadas: {total_lines_analyzed}")
        print(f"🔹 Total de Linhas de Retrabalho: {total_lines_rework}")
        print(f"🔹 Total de Linhas de Retrabalho nos últimos {REWORK_DAYS} dias: {total_lines_rework_recent}")
        print(f"🔹 Rework Rate Geral: {total_rework_rate / total_commits:.2f}%")
        print(f"🔹 Rework Rate nos últimos {REWORK_DAYS} dias: {total_rework_rate_recent / total_commits:.2f}%")
    else:
        print("⚠️ Nenhum commit foi analisado.")

if __name__ == "__main__":
    commits = get_commits(OWNER, REPO, "main")
    analyze_rework(commits)