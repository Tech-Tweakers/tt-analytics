import requests
import json
import os
from datetime import datetime

# 📅 Configuração de datas
START_DATE = os.getenv("START_DATE", "2000-01-01")
END_DATE = os.getenv("END_DATE") or datetime.utcnow().strftime("%Y-%m-%d")
START_DATE = datetime.strptime(START_DATE, "%Y-%m-%d")
END_DATE = datetime.strptime(END_DATE, "%Y-%m-%d")

# 🔐 Autenticação e contexto
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
BRANCH = os.getenv("BRANCH", "main")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"}

# 📁 Funções auxiliares
def save_as_js(filename, data, var_name):
    os.makedirs("src/data/", exist_ok=True)
    with open(filename, "w") as f:
        f.write(f"const {var_name} = ")
        json.dump(data, f, indent=2)
        f.write(f";\n\nexport default {var_name};\n")
    print(f"✅ JS salvo com sucesso em {filename}")

# 🧠 Coleta de commits
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

# 🔍 Detalhes do commit
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
            changes[filename] = patch.split("\n")

    return author, changes

# 🧪 Heurística de refatoração
def is_refactor_change(filename, patch_lines):
    if any(t in filename.lower() for t in ["test", "mock", "spec"]):
        return False

    keywords_logic = ["if", "for", "while", "switch", "case", "return", "try", "catch", "else"]
    logic_lines = [line for line in patch_lines if any(kw in line for kw in keywords_logic)]
    added_lines = [line for line in patch_lines if line.startswith("+") and not line.startswith("+++")]
    removed_lines = [line for line in patch_lines if line.startswith("-") and not line.startswith("---")]

    if not added_lines and not removed_lines:
        return False

    logic_density = len(logic_lines) / (len(added_lines) + len(removed_lines)) if (added_lines or removed_lines) else 0
    return logic_density < 0.3

# 📊 Análise completa
def analyze_refactor(commits):
    refactor_data = []
    total_commits = 0
    total_refactors = 0
    total_lines = 0
    refactor_lines = 0

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

        total_commits += 1
        commit_total_lines = 0
        commit_refactor_lines = 0
        refactor_files = []

        for file, patch_lines in changes.items():
            changed_lines = [line for line in patch_lines if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))]
            commit_total_lines += len(changed_lines)

            if is_refactor_change(file, patch_lines):
                commit_refactor_lines += len(changed_lines)
                refactor_files.append(file)

        refactor_detected = commit_refactor_lines > 0
        if refactor_detected:
            total_refactors += 1
            refactor_lines += commit_refactor_lines

        total_lines += commit_total_lines

        refactor_data.append({
            "data": date[:10],
            "sha": sha,
            "autor": author,
            "total_lines": commit_total_lines,
            "refactor_lines": commit_refactor_lines,
            "refactor_detected": refactor_detected,
            "arquivos_refatorados": refactor_files,
        })

    var_name = f"refactor{REPO.replace('-', '').capitalize()}"
    js_file = f"src/data/refactor_rate_{REPO}.js"
    save_as_js(js_file, {"data": refactor_data}, var_name)

    stats = {
        "commits_analisados": total_commits,
        "commits_refatorados": total_refactors,
        "linhas_modificadas": total_lines,
        "linhas_refatoradas": refactor_lines,
        "refactor_rate (%)": round((total_refactors / total_commits) * 100, 2) if total_commits else 0,
        "refactor_line_rate (%)": round((refactor_lines / total_lines) * 100, 2) if total_lines else 0
    }

    return refactor_data, stats

# 🚀 Execução principal
if __name__ == "__main__":
    commits = get_commits(OWNER, REPO, BRANCH)
    data, stats = analyze_refactor(commits)

    # Nome da constante 100% minúsculo, sem hífen ou underscore
    clean_repo = REPO.replace("-", "").replace("_", "").lower()
    var_name = f"refactor{clean_repo}"
    js_file = f"src/data/refactor_rate_{REPO}.js"
    save_as_js(js_file, {"data": data}, var_name)

    print("\n📊 RESULTADOS FINAIS:")
    for k, v in stats.items():
        print(f"🔸 {k}: {v}")
