import sys
import os
from datetime import datetime, timedelta, timezone
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from shared.config import load_config
from shared.github_client import get_commits, get_commit_detail
from shared.output import save_as_js


def analyze_churn(commits, config):
    churn_total = 0
    churn_by_week = defaultdict(lambda: {"churn_lines": 0, "commits": 0})
    churn_by_file = defaultdict(lambda: {"churn_lines": 0, "modifications": 0})
    churn_by_author = defaultdict(lambda: {"churn_lines": 0, "commits": 0})

    for i, commit in enumerate(commits, 1):
        sha = commit["sha"]
        date = commit["commit"]["author"]["date"]
        commit_date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")
        week_start = (commit_date - timedelta(days=commit_date.weekday())).date()
        week_end = week_start + timedelta(days=6)

        print(f"🔹 [{i}/{len(commits)}] Processando commit {sha[:7]} ({date})")
        detail = get_commit_detail(config["owner"], config["repo"], sha, config["headers"])
        if not detail:
            continue

        author = detail.get("commit", {}).get("author", {}).get("name", "Desconhecido")
        files = detail.get("files", [])

        churn_lines = 0
        for file in files:
            additions = file.get("additions", 0)
            deletions = file.get("deletions", 0)
            total = additions + deletions
            churn_lines += total
            churn_by_file[file["filename"]]["churn_lines"] += total
            churn_by_file[file["filename"]]["modifications"] += 1

        churn_total += churn_lines
        week_key = f"{week_start}__{week_end}"
        churn_by_week[week_key]["churn_lines"] += churn_lines
        churn_by_week[week_key]["commits"] += 1
        churn_by_author[author]["churn_lines"] += churn_lines
        churn_by_author[author]["commits"] += 1

    return {
        "repo": config["repo"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "churn_summary": {
            "total_churn_lines": churn_total,
            "total_commits": len(commits),
            "average_churn_per_commit": round(churn_total / len(commits), 2) if commits else 0,
        },
        "weekly_churn": [
            {
                "week_start": key.split("__")[0],
                "week_end": key.split("__")[1],
                "churn_lines": val["churn_lines"],
                "commits": val["commits"],
            }
            for key, val in sorted(churn_by_week.items())
        ],
        "top_files_by_churn": sorted(
            [{"file": k, **v} for k, v in churn_by_file.items()],
            key=lambda x: x["churn_lines"],
            reverse=True,
        )[:10],
        "top_authors_by_churn": sorted(
            [{"author": k, **v} for k, v in churn_by_author.items()],
            key=lambda x: x["churn_lines"],
            reverse=True,
        )[:10],
    }


if __name__ == "__main__":
    config = load_config()
    commits = get_commits(config["owner"], config["repo"], config["branch"], config["headers"])
    churn_data = analyze_churn(commits, config)

    clean_repo = config["repo"].replace("-", "").replace("_", "").lower()
    save_as_js(churn_data, f"churn{clean_repo}", config["repo"], "code_churn")
