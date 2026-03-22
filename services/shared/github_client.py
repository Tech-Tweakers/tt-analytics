import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def _create_session(headers):
    session = requests.Session()
    session.headers.update(headers)

    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    return session


def _check_rate_limit(response):
    remaining = response.headers.get("X-RateLimit-Remaining")
    reset_at = response.headers.get("X-RateLimit-Reset")

    if remaining is not None and int(remaining) < 10:
        if reset_at:
            wait = max(int(reset_at) - int(time.time()), 0) + 1
            print(f"⏳ Rate limit quase esgotado ({remaining} restantes). Aguardando {wait}s...")
            time.sleep(wait)


def get_commits(owner, repo, branch, headers):
    session = _create_session(headers)
    url = f"https://api.github.com/repos/{owner}/{repo}/commits"
    params = {"sha": branch, "per_page": 100}
    commits = []

    print(f"📥 Buscando commits no branch '{branch}' de {owner}/{repo}...")

    while url:
        response = session.get(url, params=params)
        if response.status_code != 200:
            raise Exception(f"Erro ao buscar commits: {response.status_code} - {response.text}")

        _check_rate_limit(response)
        commits.extend(response.json())
        url = response.links.get("next", {}).get("url")
        params = None  # params so na primeira request, depois a URL paginada ja inclui

    print(f"✅ {len(commits)} commits encontrados!")
    return commits


def get_commit_detail(owner, repo, sha, headers):
    session = _create_session(headers)
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
    response = session.get(url)

    if response.status_code != 200:
        print(f"⚠️ Falha ao buscar detalhes do commit {sha}: {response.status_code}")
        return None

    _check_rate_limit(response)
    return response.json()
