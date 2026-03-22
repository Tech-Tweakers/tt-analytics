import os
from datetime import datetime, timezone


def get_env(name, default=None, required=False):
    value = os.getenv(name, default)
    if required and not value:
        raise EnvironmentError(f"Variavel de ambiente obrigatoria nao definida: {name}")
    return value


def load_config():
    token = get_env("GITHUB_TOKEN", required=True)
    owner = get_env("OWNER", required=True)
    repo = get_env("REPO", required=True)
    branch = get_env("BRANCH", "main")

    start_date_str = get_env("START_DATE", "2000-01-01")
    end_date_str = get_env("END_DATE") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")

    return {
        "token": token,
        "owner": owner,
        "repo": repo,
        "branch": branch,
        "start_date": start_date,
        "end_date": end_date,
        "headers": {"Authorization": f"token {token}"},
    }
