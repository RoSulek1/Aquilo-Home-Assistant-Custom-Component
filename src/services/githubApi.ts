import {
  GitHubBranch,
  GitHubCommit,
  GitHubContentItem,
  GitHubPullRequest,
  GitHubRepo,
} from '../types/github';

export function parseRepoString(input: string): { owner: string; repo: string } | null {
  const clean = input.trim();
  if (!clean) return null;

  // Pattern 1: https://github.com/owner/repo(.git)?
  const urlMatch = clean.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2].replace(/\.git$/, '');
    return { owner, repo };
  }

  // Pattern 2: owner/repo
  const parts = clean.split('/');
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return {
      owner: parts[0].trim(),
      repo: parts[1].trim().replace(/\.git$/, ''),
    };
  }

  return null;
}

function getHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export async function fetchGitHubRepo(owner: string, repo: string, token?: string): Promise<GitHubRepo> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Repozytorium "${owner}/${repo}" nie zostało znalezione (404). Jeśli to prywatne repozytorium, podaj GitHub Personal Access Token (PAT).`
      );
    }
    if (res.status === 401) {
      throw new Error('Nieprawidłowy token GitHub (401 Bad credentials). Sprawdź uprawnienia tokena.');
    }
    if (res.status === 403) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error(
          'Przekroczono limit zapytań GitHub API (60 req/h dla zapytań bez autoryzacji). Wprowadź Personal Access Token, aby zwiększyć limit do 5000 req/h.'
        );
      }
      throw new Error('Odmowa dostępu do repozytorium (403 Forbidden).');
    }
    throw new Error(`Błąd GitHub API: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string = '',
  ref?: string,
  token?: string
): Promise<GitHubContentItem[] | GitHubContentItem> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`);
  if (ref) {
    url.searchParams.set('ref', ref);
  }

  const res = await fetch(url.toString(), {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Nie udało się pobrać zawartości ścieżki "${path}": ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchRepoBranches(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubBranch[]> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=30`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function fetchRepoCommits(
  owner: string,
  repo: string,
  branch?: string,
  token?: string
): Promise<GitHubCommit[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  url.searchParams.set('per_page', '15');
  if (branch) {
    url.searchParams.set('sha', branch);
  }

  const res = await fetch(url.toString(), {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function fetchRepoPullRequests(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubPullRequest[]> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=10`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function fetchFileRawText(downloadUrl: string, token?: string): Promise<string> {
  const res = await fetch(downloadUrl, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    throw new Error('Nie udało się pobrać zawartości pliku.');
  }
  return res.text();
}
