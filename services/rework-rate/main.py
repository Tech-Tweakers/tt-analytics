import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.config import load_config
from shared.github_client import get_commits, get_commit_detail
from shared.output import save_as_js

THRESHOLD = int(os.getenv("THRESHOLD", 3))
REWORK_DAYS = 21


def extract_changed_lines(files):
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
    return changes


def analyze_rework(commits, config):
    rework_data = []
    recent_cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=REWORK_DAYS)

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
        changes = extract_changed_lines(files)

        if not changes:
            continue

        total_changes = sum(len(lines) for lines in changes.values())
        rework_changes_total = sum(
            len(lines) for lines in changes.values() if len(lines) >= THRESHOLD
        )
        is_recent = commit_date >= recent_cutoff
        rework_changes_recent = rework_changes_total if is_recent else 0

        rework_rate_total = (rework_changes_total / total_changes) * 100 if total_changes > 0 else 0
        rework_rate_recent = (rework_changes_recent / total_changes) * 100 if total_changes > 0 else 0

        rework_data.append({
            "data": date[:10],
            "sha": sha,
            "autor": author,
            "total_changes": total_changes,
            "rework_changes_total": rework_changes_total,
            "rework_rate_total": rework_rate_total,
            "rework_changes_recent": rework_changes_recent,
            "rework_rate_recent": rework_rate_recent,
            "arquivos_modificados": list(changes.keys()),
        })

    return rework_data


if __name__ == "__main__":
    config = load_config()
    commits = get_commits(config["owner"], config["repo"], config["branch"], config["headers"])
    rework_data = analyze_rework(commits, config)

    clean_repo = config["repo"].replace("-", "").replace("_", "").lower()
    var_name = f"rework{clean_repo}"
    save_as_js({"threshold": THRESHOLD, "data": rework_data}, var_name, config["repo"], "rework_rate")

    total_commits = len(rework_data)
    if total_commits > 0:
        total_rework = sum(d["rework_changes_total"] for d in rework_data)
        total_lines = sum(d["total_changes"] for d in rework_data)
        print(f"\n📊 RESULTADOS FINAIS:")
        print(f"🔹 Commits analisados: {total_commits}")
        print(f"🔹 Linhas analisadas: {total_lines}")
        print(f"🔹 Linhas de retrabalho: {total_rework}")
    else:
        print("⚠️ Nenhum commit foi analisado.")
