import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.config import load_config
from shared.github_client import get_commits, get_commit_detail
from shared.output import save_as_js


def is_refactor_change(filename, patch_lines):
    if any(t in filename.lower() for t in ["test", "mock", "spec"]):
        return False

    keywords_logic = ["if", "for", "while", "switch", "case", "return", "try", "catch", "else"]
    logic_lines = [line for line in patch_lines if any(kw in line for kw in keywords_logic)]
    added_lines = [line for line in patch_lines if line.startswith("+") and not line.startswith("+++")]
    removed_lines = [line for line in patch_lines if line.startswith("-") and not line.startswith("---")]

    if not added_lines and not removed_lines:
        return False

    logic_density = len(logic_lines) / (len(added_lines) + len(removed_lines))
    return logic_density < 0.3


def analyze_refactor(commits, config):
    refactor_data = []
    total_commits = 0
    total_refactors = 0
    total_lines = 0
    refactor_lines = 0

    for i, commit in enumerate(commits, 1):
        sha = commit["sha"]
        date = commit["commit"]["author"]["date"]
        commit_date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")

        if not (config["start_date"] <= commit_date <= config["end_date"]):
            continue

        print(f"🔹 [{i}/{len(commits)}] Processando commit {sha[:7]} ({date})")
        detail = get_commit_detail(config["owner"], config["repo"], sha, config["headers"])
        if not detail:
            continue

        author = detail.get("commit", {}).get("author", {}).get("name", "Desconhecido")
        files = detail.get("files", [])

        total_commits += 1
        commit_total_lines = 0
        commit_refactor_lines = 0
        refactor_files = []

        for file in files:
            patch = file.get("patch", "")
            if not patch:
                continue
            patch_lines = patch.split("\n")
            changed_lines = [
                line for line in patch_lines
                if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
            ]
            commit_total_lines += len(changed_lines)

            if is_refactor_change(file["filename"], patch_lines):
                commit_refactor_lines += len(changed_lines)
                refactor_files.append(file["filename"])

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

    return refactor_data, {
        "commits_analisados": total_commits,
        "commits_refatorados": total_refactors,
        "linhas_modificadas": total_lines,
        "linhas_refatoradas": refactor_lines,
        "refactor_rate (%)": round((total_refactors / total_commits) * 100, 2) if total_commits else 0,
        "refactor_line_rate (%)": round((refactor_lines / total_lines) * 100, 2) if total_lines else 0,
    }


if __name__ == "__main__":
    config = load_config()
    commits = get_commits(config["owner"], config["repo"], config["branch"], config["headers"])
    data, stats = analyze_refactor(commits, config)

    clean_repo = config["repo"].replace("-", "").replace("_", "").lower()
    save_as_js({"data": data}, f"refactor{clean_repo}", config["repo"], "refactor_rate")

    print("\n📊 RESULTADOS FINAIS:")
    for k, v in stats.items():
        print(f"🔸 {k}: {v}")
