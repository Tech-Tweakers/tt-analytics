import os
import json
import requests
from datetime import datetime, timedelta
from collections import defaultdict

# Variáveis de ambiente
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
BRANCH = os.getenv("BRANCH", "main")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

# Caminho de saída
output_dir = "static/data/repos"
os.makedirs(output_dir, exist_ok=True)
json_file = os.path.join(output_dir, f"code_churn_{REPO}.json")


def get_commits(owner, repo, branch):
    """Busca todos os commits do branch."""
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

    print(f"✅ {len(commits)} commits encontrados.")
    return commits


def get_commit_stats(owner, repo, sha):
    """Pega alterações de arquivos e autor para um commit."""
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        print(f"⚠️ Falha ao buscar detalhes do commit {sha}")
        return None, None, None

    data = response.json()
    author = data.get("commit", {}).get("author", {}).get("name", "Desconhecido")
    files = data.get("files", [])

    file_changes = []
    churn_lines = 0

    for file in files:
        additions = file.get("additions", 0)
        deletions = file.get("deletions", 0)
        total = additions + deletions
        churn_lines += total
        file_changes.append((file["filename"], total))

    return author, churn_lines, file_changes


def analyze_churn(commits):
    churn_total = 0
    churn_by_week = defaultdict(lambda: {"churn_lines": 0, "commits": 0})
    churn_by_file = defaultdict(lambda: {"churn_lines": 0, "modifications": 0})
    churn_by_author = defaultdict(lambda: {"churn_lines": 0, "commits": 0})

    for i, commit in enumerate(commits, 1):
        sha = commit["sha"]
        date = commit["commit"]["author"]["date"]
        commit_date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")
        week_start = (commit_date - timedelta(days=commit_date.weekday())).date()
        week_end = (week_start + timedelta(days=6))

        author, churn_lines, file_changes = get_commit_stats(OWNER, REPO, sha)
        if churn_lines is None:
            continue

        churn_total += churn_lines
        week_key = f"{week_start}__{week_end}"
        churn_by_week[week_key]["churn_lines"] += churn_lines
        churn_by_week[week_key]["commits"] += 1
        churn_by_author[author]["churn_lines"] += churn_lines
        churn_by_author[author]["commits"] += 1

        for filename, lines in file_changes:
            churn_by_file[filename]["churn_lines"] += lines
            churn_by_file[filename]["modifications"] += 1

    churn_data = {
        "repo": REPO,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "churn_summary": {
            "total_churn_lines": churn_total,
            "total_commits": len(commits),
            "average_churn_per_commit": round(churn_total / len(commits), 2) if commits else 0
        },
        "weekly_churn": [
            {
                "week_start": key.split("__")[0],
                "week_end": key.split("__")[1],
                "churn_lines": val["churn_lines"],
                "commits": val["commits"]
            }
            for key, val in sorted(churn_by_week.items())
        ],
        "top_files_by_churn": sorted(
            [{"file": k, **v} for k, v in churn_by_file.items()],
            key=lambda x: x["churn_lines"],
            reverse=True
        )[:10],
        "top_authors_by_churn": sorted(
            [{"author": k, **v} for k, v in churn_by_author.items()],
            key=lambda x: x["churn_lines"],
            reverse=True
        )[:10]
    }

    return churn_data


def save_json(filepath, data):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
    print(f"✅ JSON salvo em: {filepath}")


if __name__ == "__main__":
    commits = get_commits(OWNER, REPO, BRANCH)
    churn_data = analyze_churn(commits)
    save_json(json_file, churn_data)
