import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Github,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FolderGit2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

interface ConnectGuideTabProps {
  onSwitchToExplorer: (repoUrl?: string) => void;
}

export const ConnectGuideTab: React.FC<ConnectGuideTabProps> = ({ onSwitchToExplorer }) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component.git');
  const [branch, setBranch] = useState('main');
  const [commitMsg, setCommitMsg] = useState('feat: initial release of Aquilo Home Assistant custom component with Config Flow');
  const [authType, setAuthType] = useState<'https' | 'pat' | 'ssh'>('https');
  const [githubPat, setGithubPat] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExistingRepo, setIsExistingRepo] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate URL with token embedded if selected
  const getEffectiveUrl = () => {
    if (authType === 'pat' && githubPat.trim()) {
      const clean = repoUrl.replace(/^https:\/\//, '').replace(/\.git$/, '');
      return `https://${githubPat.trim()}@github.com/${clean}.git`;
    }
    if (authType === 'ssh') {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
      if (match) {
        return `git@github.com:${match[1]}/${match[2].replace(/\.git$/, '')}.git`;
      }
    }
    return repoUrl;
  };

  const effectiveUrl = getEffectiveUrl();

  const generateCommands = () => {
    if (isExistingRepo) {
      return `# 1. Inicjalizacja i podpięcie istniejącego repozytorium
git init
git remote add origin ${effectiveUrl}
git branch -M ${branch}

# 2. Pobranie i zsynchronizowanie (jeśli na GitHubie są już pliki)
git pull origin ${branch} --allow-unrelated-histories

# 3. Zacommitowanie aktualnych plików z AI Studio
git add .
git commit -m "${commitMsg}"
git push -u origin ${branch}`;
    }

    return `# 1. Inicjalizacja lokalnego repozytorium Git
git init
git branch -M ${branch}

# 2. Dodanie zdalnego repozytorium (Remote)
git remote add origin ${effectiveUrl}

# 3. Dodanie wszystkich plików (z poszanowaniem .gitignore)
git add .

# 4. Utworzenie pierwszego commita
git commit -m "${commitMsg}"

# 5. Wypchnięcie kodu do Twojego repozytorium na GitHub
git push -u origin ${branch}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Przewodnik integracji Git & GitHub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Jak połączyć ten projekt z Twoim repozytorium na Git?
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Masz <strong className="text-white">3 proste i sprawdzone sposoby</strong>: od wbudowanego eksportu w interfejsie Google AI Studio, przez gotowy generator komend Git CLI, po interaktywny connector API.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => onSwitchToExplorer(repoUrl)}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Przetestuj repozytorium live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Methods Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Method 1 */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-white text-base">Eksport z UI AI Studio</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Najprostsza opcja w interfejsie: w prawym górnym rogu platformy kliknij ikonę menu projektu i wybierz <strong className="text-slate-200">Export to GitHub</strong> lub <strong className="text-slate-200">Sync with GitHub</strong>.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs text-indigo-400 font-medium">
            <span>Bez używania terminala</span>
          </div>
        </div>

        {/* Method 2 */}
        <div className="rounded-xl bg-slate-900/90 border border-indigo-500/30 ring-1 ring-indigo-500/20 p-5 flex flex-col justify-between relative">
          <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white tracking-wide uppercase">
            Rekomendowane
          </div>
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              2
            </div>
            <h3 className="font-bold text-white text-base">Generator komend Git CLI</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Podaj poniżej adres swojego repozytorium na GitHubie, a wygenerujemy gotowe komendy <code className="text-indigo-300">git remote</code> i <code className="text-indigo-300">git push</code> dopasowane do Twojego projektu.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Pełna kontrola nad commitem</span>
          </div>
        </div>

        {/* Method 3 */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-white text-base">Pobranie ZIP + Klon</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Pobierz pełne archiwum ZIP wszystkich plików projektu z zakładki <strong className="text-slate-200">Eksport ZIP</strong>, rozpakuj w folderze ze swoim sklonowanym repozytorium i zrób zwykły push.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs text-slate-400">
            <span>Działa w 100% offline</span>
          </div>
        </div>
      </div>

      {/* Interactive Command Generator */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/60 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span>Interaktywny generator komend Git</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Wprowadź dane swojego repozytorium, aby otrzymać gotowe polecenia do skopiowania.
              </p>
            </div>
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 px-3.5 py-2 rounded-lg transition-colors w-fit"
            >
              <Github className="w-4 h-4" />
              <span>Utwórz puste repo na GitHubie</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adres URL Twojego repozytorium GitHub:
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/twoj-login/twoja-nazwa-repo.git"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Przykład: <code className="text-slate-400">https://github.com/jan-kowalski/moja-aplikacja.git</code>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nazwa gałęzi (Branch):
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Protokół / Uwierzytelnianie:
                </label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="https">Standardowe HTTPS (hasło/token prompt)</option>
                  <option value="pat">HTTPS ze zintegrowanym Tokenem PAT</option>
                  <option value="ssh">SSH (git@github.com:...)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conditional PAT input */}
          {authType === 'pat' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Twój GitHub Personal Access Token (PAT):</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  <span>Wygeneruj token na GitHubie</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Wymagane uprawnienie: zakres <code className="text-indigo-300">repo</code> (Full control of private repositories) lub dla repozytoriów publicznych. Token nie jest wysyłany na żaden serwer.
              </p>
            </div>
          )}

          {/* Commit Message & Checkbox */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wiadomość commita:
              </label>
              <input
                type="text"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 sm:pt-6">
              <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isExistingRepo}
                  onChange={(e) => setIsExistingRepo(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">
                  Repozytorium na GitHubie już zawiera pliki (np. README / licencję)
                </span>
              </label>
            </div>
          </div>

          {/* Generated Code Terminal Box */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-slate-400 font-mono ml-2">bash / git terminal</span>
              </div>
              <button
                onClick={() => handleCopy(generateCommands(), 'main-commands')}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              >
                {copiedId === 'main-commands' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Skopiowano!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj wszystkie komendy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
              <pre>{generateCommands()}</pre>
            </div>
          </div>

          {/* Quick Step-by-Step Instructions */}
          <div className="rounded-xl bg-indigo-950/20 border border-indigo-500/20 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Gdzie wkleić te komendy?</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-6 list-disc">
              <li>
                <strong>Opcja A (W AI Studio):</strong> Możesz podać mi URL swojego repozytorium w czacie, a ja mogę wykonać dla Ciebie polecenia Git lub przygotować branch!
              </li>
              <li>
                <strong>Opcja B (Na Twoim komputerze):</strong> Pobierz kod za pomocą zakładki <em>Eksport ZIP</em>, otwórz terminal w rozpakowanym folderze i wklej powyższe polecenia.
              </li>
              <li>
                <strong>Opcja C (Jeśli GitHub żąda hasła):</strong> Pamiętaj, że GitHub od 2021 roku nie akceptuje zwykłego hasła do konta przy <code>git push</code> przez HTTPS — jako hasło należy wkleić <strong>Personal Access Token (PAT)</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Subsequent Sync / Update Guide */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <FolderGit2 className="w-5 h-5 text-emerald-400" />
          <span>Jak aktualizować repozytorium w przyszłości (kolejne commity)?</span>
        </h3>
        <p className="text-xs text-slate-300">
          Gdy wprowadzisz nowe zmiany w aplikacji i będziesz chciał je zsynchronizować z GitHubem, wystarczą poniższe trzy krótkie polecenia:
        </p>

        <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex items-center justify-between font-mono text-xs text-indigo-300 overflow-x-auto">
          <code>git add . && git commit -m "Aktualizacja funkcji" && git push origin {branch}</code>
          <button
            onClick={() => handleCopy(`git add . && git commit -m "Aktualizacja funkcji" && git push origin ${branch}`, 'quick-push')}
            className="ml-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Kopiuj"
          >
            {copiedId === 'quick-push' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
