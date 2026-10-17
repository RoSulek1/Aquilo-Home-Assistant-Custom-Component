import React from 'react';
import {
  HelpCircle,
  Key,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Lock,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
} from 'lucide-react';

export const FaqTab: React.FC = () => {
  const faqs = [
    {
      q: 'Jak wygenerować GitHub Personal Access Token (PAT)?',
      icon: <Key className="w-5 h-5 text-indigo-400" />,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            GitHub od 2021 roku wymaga tokenów PAT zamiast hasła do konta podczas operacji Git przez HTTPS.
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Przejdź do:{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 underline font-semibold inline-flex items-center space-x-0.5"
              >
                <span>github.com/settings/tokens</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </li>
            <li>Kliknij <strong>Generate new token</strong> -&gt; <strong>Generate new token (classic)</strong>.</li>
            <li>Nadaj tokenowi nazwę (np. <em>AI Studio Connector</em>) i wybierz czas ważności (np. 90 dni).</li>
            <li>Zaznacz uprawnienie <code className="text-indigo-300">repo</code> (Full control of private repositories).</li>
            <li>Kliknij zielony przycisk <strong>Generate token</strong> na dole i skopiuj token zaczynający się od <code className="text-emerald-400">ghp_...</code>.</li>
          </ol>
        </div>
      ),
    },
    {
      q: 'Błąd: "fatal: remote origin already exists" — co zrobić?',
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>Ten błąd oznacza, że adres zdalnego repozytorium był już wcześniej dodany. Aby go zaktualizować na nowy, uruchom:</p>
          <pre className="p-2.5 bg-slate-950 rounded-lg font-mono text-indigo-300">
            git remote set-url origin https://github.com/uzytkownik/repo.git
          </pre>
          <p>Albo usuń i dodaj ponownie:</p>
          <pre className="p-2.5 bg-slate-950 rounded-lg font-mono text-indigo-300">
            git remote remove origin && git remote add origin https://github.com/...
          </pre>
        </div>
      ),
    },
    {
      q: 'Błąd: "Updates were rejected because the remote contains work" (odrzucony push)',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      answer: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            Gdy nowe repozytorium na GitHubie zostało utworzone z plikiem README lub licencją, jego historia różni się od lokalnych plików.
          </p>
          <p>Rozwiązanie zalecane (połączenie historii):</p>
          <pre className="p-2.5 bg-slate-950 rounded-lg font-mono text-emerald-300">
            git pull origin main --allow-unrelated-histories
            <br />
            git push origin main
          </pre>
          <p>Rozwiązanie alternatywne (jeśli chcesz nadpisać puste repo na GitHubie):</p>
          <pre className="p-2.5 bg-slate-950 rounded-lg font-mono text-amber-300">
            git push -u origin main --force
          </pre>
        </div>
      ),
    },
    {
      q: 'Czy mogę połączyć prywatne repozytorium?',
      icon: <Lock className="w-5 h-5 text-indigo-400" />,
      answer: (
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Tak, oczywiście.</strong> W zakładce <em>Live GitHub Connector</em> lub w generatorze CLI wystarczy podać Personal Access Token (PAT) z uprawnieniem <code className="text-indigo-300">repo</code>. Bez tokena GitHub API zwraca błąd 404 dla repozytoriów prywatnych ze względów bezpieczeństwa (aby nie zdradzać istnienia repozytorium).
        </p>
      ),
    },
    {
      q: 'Czy moje tokeny i hasła są bezpieczne w tej aplikacji?',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      answer: (
        <p className="text-xs text-slate-300 leading-relaxed">
          Tak. Token jest używany wyłącznie po stronie Twojej przeglądarki (Client-side) bezpośrednio do zapytań do oficjalnego API GitHuba (<code>https://api.github.com</code>). Nie jest wysyłany do żadnych zewnętrznych baz danych ani serwisów trzecich.
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span>Najczęściej zadawane pytania (FAQ) i Rozwiązywanie problemów</span>
        </h2>
        <p className="text-xs text-slate-400">
          Wszystko, co musisz wiedzieć o autoryzacji, błędach Git i pracy z repozytoriami GitHub.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                {faq.icon}
              </div>
              <h3 className="text-sm font-bold text-white">{faq.q}</h3>
            </div>
            <div className="pt-2 border-t border-slate-800/80">{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
