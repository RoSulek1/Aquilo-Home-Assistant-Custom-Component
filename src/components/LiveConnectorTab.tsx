import React, { useState, useEffect } from 'react';
import {
  Search,
  Key,
  Folder,
  FileCode,
  FileText,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Star,
  Eye,
  Lock,
  Globe,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Code2,
  FolderGit2,
} from 'lucide-react';
import {
  fetchGitHubRepo,
  fetchRepoContents,
  fetchRepoCommits,
  fetchRepoBranches,
  fetchRepoPullRequests,
  fetchFileRawText,
  parseRepoString,
} from '../services/githubApi';
import {
  GitHubRepo,
  GitHubContentItem,
  GitHubCommit,
  GitHubBranch,
  GitHubPullRequest,
} from '../types/github';

interface LiveConnectorTabProps {
  onRepoConnected?: (repoFullName: string | null) => void;
  initialRepoInput?: string;
}

export const LiveConnectorTab: React.FC<LiveConnectorTabProps> = ({
  onRepoConnected,
  initialRepoInput,
}) => {
  const [repoInput, setRepoInput] = useState(initialRepoInput || '');
  const [token, setToken] = useState(() => localStorage.getItem('gh_connector_token') || '');
  const [saveToken, setSaveToken] = useState(true);

  // Connection state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState<GitHubRepo | null>(null);

  // Active sub-view
  const [subTab, setSubTab] = useState<'files' | 'commits' | 'branches' | 'pulls'>('files');

  // File explorer state
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentItems, setCurrentItems] = useState<GitHubContentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<{
    item: GitHubContentItem;
    content: string;
  } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Other data
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Copy state
  const [copiedFile, setCopiedFile] = useState(false);

  // Load token from storage
  useEffect(() => {
    if (saveToken && token) {
      localStorage.setItem('gh_connector_token', token);
    } else if (!saveToken) {
      localStorage.removeItem('gh_connector_token');
    }
  }, [token, saveToken]);

  // Initial connect if initialRepoInput is provided
  useEffect(() => {
    if (initialRepoInput && !repo) {
      setRepoInput(initialRepoInput);
      handleConnect(initialRepoInput);
    }
  }, [initialRepoInput]);

  const handleConnect = async (targetInput?: string) => {
    const input = targetInput || repoInput;
    const parsed = parseRepoString(input);
    if (!parsed) {
      setError('Wprowadź prawidłowy adres repozytorium (np. "login/repo" lub pełny URL "https://github.com/login/repo").');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedFile(null);
    setCurrentPath('');

    try {
      const repoData = await fetchGitHubRepo(parsed.owner, parsed.repo, token);
      setRepo(repoData);
      setSelectedBranch(repoData.default_branch);

      if (onRepoConnected) {
        onRepoConnected(repoData.full_name);
      }

      // Load root contents, branches, and commits in parallel
      const [contents, branchList, commitList, pullList] = await Promise.allSettled([
        fetchRepoContents(parsed.owner, parsed.repo, '', repoData.default_branch, token),
        fetchRepoBranches(parsed.owner, parsed.repo, token),
        fetchRepoCommits(parsed.owner, parsed.repo, repoData.default_branch, token),
        fetchRepoPullRequests(parsed.owner, parsed.repo, token),
      ]);

      if (contents.status === 'fulfilled' && Array.isArray(contents.value)) {
        // Sort directories first, then files alphabetically
        const sorted = [...contents.value].sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        setCurrentItems(sorted);
      }

      if (branchList.status === 'fulfilled') {
        setBranches(branchList.value);
      }
      if (commitList.status === 'fulfilled') {
        setCommits(commitList.value);
      }
      if (pullList.status === 'fulfilled') {
        setPulls(pullList.value);
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd podczas łączenia z GitHubem.');
      setRepo(null);
      if (onRepoConnected) onRepoConnected(null);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = async (folderPath: string) => {
    if (!repo) return;
    setFileLoading(true);
    setSelectedFile(null);
    setError(null);

    try {
      const items = await fetchRepoContents(repo.owner.login, repo.name, folderPath, selectedBranch, token);
      if (Array.isArray(items)) {
        const sorted = [...items].sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        setCurrentItems(sorted);
        setCurrentPath(folderPath);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const openFile = async (item: GitHubContentItem) => {
    if (!repo) return;
    setFileLoading(true);
    setError(null);

    try {
      let content = '';
      if (item.content && item.encoding === 'base64') {
        content = decodeURIComponent(escape(window.atob(item.content.replace(/\s/g, ''))));
      } else if (item.download_url) {
        content = await fetchFileRawText(item.download_url, token);
      } else {
        content = 'Podgląd pliku binarnego lub niedostępny.';
      }
      setSelectedFile({ item, content });
    } catch (err: any) {
      setError('Nie udało się wczytać zawartości pliku: ' + err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const handleBranchChange = async (newBranch: string) => {
    if (!repo) return;
    setSelectedBranch(newBranch);
    setIsLoading(true);
    setSelectedFile(null);
    setCurrentPath('');

    try {
      const [contents, commitList] = await Promise.all([
        fetchRepoContents(repo.owner.login, repo.name, '', newBranch, token),
        fetchRepoCommits(repo.owner.login, repo.name, newBranch, token),
      ]);
      if (Array.isArray(contents)) {
        setCurrentItems(contents);
      }
      setCommits(commitList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFileContent = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Search & Connect Box */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <span>Połącz z repozytorium GitHub</span>
            </h2>
            <p className="text-xs text-slate-400">
              Wprowadź swoje repozytorium (np. <code className="text-indigo-300">rosulek/moj-projekt</code> lub link URL).
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 overflow-x-auto py-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Przetestuj z:</span>
            {[
              'facebook/react',
              'tailwindlabs/tailwindcss',
              'vitejs/vite',
            ].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setRepoInput(p);
                  handleConnect(p);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors font-mono text-[11px] whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="np. twoj-login/twoje-repozytorium lub https://github.com/..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="lg:col-span-4 relative">
            <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Opcjonalny Token PAT (do prywatnych repo)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="lg:col-span-2">
            <button
              onClick={() => handleConnect()}
              disabled={isLoading || !repoInput.trim()}
              className="w-full h-full min-h-[42px] inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Łączenie...</span>
                </>
              ) : (
                <>
                  <FolderGit2 className="w-4 h-4" />
                  <span>Połącz</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save token checkbox */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToken}
              onChange={(e) => setSaveToken(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Zapamiętaj token w tej przeglądarce (localStorage)</span>
          </label>

          <span className="text-[11px] text-slate-500">
            Dla repozytoriów publicznych token nie jest wymagany (limit: 60 zapytań/godz.).
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-4 flex items-start space-x-3 text-rose-200 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-sm text-rose-300">Błąd połączenia:</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Repository Card & Explorer */}
      {repo && (
        <div className="space-y-6">
          {/* Repo Header Card */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  className="w-12 h-12 rounded-xl border border-slate-700 shadow-md"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{repo.full_name}</h3>
                    {repo.private ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Prywatne</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                        <Globe className="w-3 h-3" />
                        <span>Publiczne</span>
                      </span>
                    )}
                    {repo.language && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {repo.description || 'Brak opisu repozytorium.'}
                  </p>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-amber-300 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{repo.stargazers_count.toLocaleString()}</span>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{repo.forks_count.toLocaleString()} forków</span>
                </div>

                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <span>Otwórz na GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Branch Selector Bar */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-300">Aktywna gałąź:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} {b.name === repo.default_branch ? '(default)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value={repo.default_branch}>{repo.default_branch}</option>
                  )}
                </select>
              </div>

              <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                <span>Zaktualizowano: {new Date(repo.updated_at).toLocaleDateString()}</span>
                <span>Rozmiar: {(repo.size / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-sm font-medium">
            <button
              onClick={() => setSubTab('files')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors ${
                subTab === 'files'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Pliki ({currentItems.length})</span>
            </button>

            <button
              onClick={() => setSubTab('commits')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors ${
                subTab === 'commits'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GitCommit className="w-4 h-4 text-emerald-400" />
              <span>Ostatnie Commity ({commits.length})</span>
            </button>

            <button
              onClick={() => setSubTab('pulls')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors ${
                subTab === 'pulls'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GitPullRequest className="w-4 h-4 text-amber-400" />
              <span>Pull Requests ({pulls.length})</span>
            </button>

            <button
              onClick={() => setSubTab('branches')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-colors ${
                subTab === 'branches'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>Gałęzie ({branches.length})</span>
            </button>
          </div>

          {/* Sub-tab 1: Files */}
          {subTab === 'files' && (
            <div className="space-y-4">
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 overflow-x-auto">
                <button
                  onClick={() => navigateToFolder('')}
                  className="font-medium hover:text-indigo-400 transition-colors font-mono"
                >
                  {repo.name}
                </button>
                {breadcrumbs.map((crumb, idx) => {
                  const target = breadcrumbs.slice(0, idx + 1).join('/');
                  return (
                    <React.Fragment key={target}>
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      <button
                        onClick={() => navigateToFolder(target)}
                        className={`font-mono hover:text-indigo-400 transition-colors ${
                          idx === breadcrumbs.length - 1 ? 'text-indigo-300 font-semibold' : ''
                        }`}
                      >
                        {crumb}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Explorer Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* File list */}
                <div className={`${selectedFile ? 'lg:col-span-4' : 'lg:col-span-12'} rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg`}>
                  <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>Zawartość folderu</span>
                    {currentPath && (
                      <button
                        onClick={() => {
                          const parent = breadcrumbs.slice(0, -1).join('/');
                          navigateToFolder(parent);
                        }}
                        className="inline-flex items-center space-x-1 text-indigo-400 hover:underline"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Folder wyżej</span>
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
                    {fileLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Wczytywanie plików...</span>
                      </div>
                    ) : currentItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">
                        Ten folder jest pusty lub brak plików.
                      </div>
                    ) : (
                      currentItems.map((item) => (
                        <div
                          key={item.path}
                          onClick={() => {
                            if (item.type === 'dir') {
                              navigateToFolder(item.path);
                            } else {
                              openFile(item);
                            }
                          }}
                          className={`flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-800/70 cursor-pointer transition-colors text-xs ${
                            selectedFile?.item.path === item.path ? 'bg-indigo-950/50 text-indigo-200' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            {item.type === 'dir' ? (
                              <Folder className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400/20" />
                            ) : item.name.endsWith('.md') ? (
                              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <span className="font-mono truncate">{item.name}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono shrink-0 pl-2">
                            {item.type === 'dir' ? 'Katalog' : `${(item.size / 1024).toFixed(1)} KB`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* File Viewer */}
                {selectedFile && (
                  <div className="lg:col-span-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <Code2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono font-semibold text-slate-200">
                          {selectedFile.item.path}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ({(selectedFile.item.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCopyFileContent}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          {copiedFile ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Skopiowano</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopiuj</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedFile(null)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
                        >
                          Zamknij podgląd
                        </button>
                      </div>
                    </div>

                    <div className="p-4 overflow-auto max-h-[500px] font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/90 whitespace-pre">
                      {selectedFile.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Commits */}
          {subTab === 'commits' && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
              {commits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Brak commitów do wyświetlenia.</div>
              ) : (
                commits.map((c) => (
                  <div key={c.sha} className="p-4 hover:bg-slate-850 transition-colors flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      {c.author?.avatar_url ? (
                        <img
                          src={c.author.avatar_url}
                          alt={c.author.login}
                          className="w-8 h-8 rounded-full border border-slate-700 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                          {c.commit.author.name.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white leading-snug">{c.commit.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                          <span className="font-medium text-slate-300">
                            {c.author?.login || c.commit.author.name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(c.commit.author.date).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-indigo-400 hover:underline shrink-0 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 flex items-center space-x-1"
                    >
                      <span>{c.sha.slice(0, 7)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-tab 3: Pull Requests */}
          {subTab === 'pulls' && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
              {pulls.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Brak Pull Requestów w tym repozytorium.</div>
              ) : (
                pulls.map((pr) => (
                  <div key={pr.id} className="p-4 hover:bg-slate-850 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${pr.state === 'open' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                      <div>
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors flex items-center space-x-2"
                        >
                          <span>{pr.title}</span>
                          <span className="text-slate-500 font-mono text-xs">#{pr.number}</span>
                        </a>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Utworzono przez <strong className="text-slate-300">{pr.user.login}</strong> w dniu {new Date(pr.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      pr.state === 'open'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}>
                      {pr.state}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-tab 4: Branches */}
          {subTab === 'branches' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {branches.map((b) => (
                <div
                  key={b.name}
                  onClick={() => handleBranchChange(b.name)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedBranch === b.name
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate">
                      <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-mono text-xs font-semibold truncate">{b.name}</span>
                    </div>
                    {b.name === repo.default_branch && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">default</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">
                    Commit: {b.commit.sha.slice(0, 7)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
