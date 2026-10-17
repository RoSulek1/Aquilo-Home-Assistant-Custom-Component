import React, { useState } from 'react';
import {
  Download,
  FileArchive,
  CheckCircle2,
  Copy,
  Check,
  Github,
  Terminal,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  FolderGit2,
} from 'lucide-react';
import JSZip from 'jszip';

export const ExportSyncTab: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      const zip = new JSZip();

      // Read or generate all custom component files into zip
      const files: Record<string, string> = {
        'hacs.json': JSON.stringify(
          {
            name: 'Aquilo Septic Tank Monitor',
            content_in_root: false,
            render_readme: true,
          },
          null,
          2
        ),
        'README.md': `# Aquilo Septic Tank Monitor for Home Assistant

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoSulek1&repository=HA-Aquilo&category=integration)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)

Home Assistant custom component for the **Aquilo Septic Tank & Water Level Monitor** (Czujnik poziomu szamba i wody Aquilo).`,
        'LICENSE': `Apache License 2.0\nCopyright 2026 RoSulek1`,
      };

      for (const [filename, content] of Object.entries(files)) {
        zip.file(filename, content);
      }

      // Add custom_components/aquilo folder
      const aquilo = zip.folder('custom_components/aquilo');
      if (aquilo) {
        aquilo.file(
          'manifest.json',
          JSON.stringify(
            {
              domain: 'aquilo',
              name: 'Aquilo Septic Tank Monitor',
              codeowners: ['@RoSulek1'],
              config_flow: true,
              documentation: 'https://github.com/RoSulek1/HA-Aquilo',
              issue_tracker: 'https://github.com/RoSulek1/HA-Aquilo/issues',
              integration_type: 'device',
              iot_class: 'local_polling',
              requirements: [],
              version: '1.0.0',
            },
            null,
            2
          )
        );

        aquilo.file(
          'const.py',
          `DOMAIN = "aquilo"\nCONF_HOST = "host"\nCONF_NAME = "name"\nCONF_SCAN_INTERVAL = "scan_interval"\nDEFAULT_NAME = "Aquilo Septic Tank"\nDEFAULT_SCAN_INTERVAL = 60\n`
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aquilo-hacs-component.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const gitPushCommands = `# 1. Sprawdź pliki gotowe do commita
git status

# 2. Dodaj wszystkie pliki integracji Aquilo
git add custom_components/ hacs.json README.md LICENSE

# 3. Zacommituj zmiany
git commit -m "feat: complete Aquilo custom component with config flow, coordinator and sensors"

# 4. Wypchnij do Twojego repozytorium na GitHubie
git push -u origin main`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Download Box */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Paczka gotowa do HACS</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Pobierz komponent Aquilo (ZIP)
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Pobierz spakowany folder <code className="text-indigo-300">custom_components/aquilo/</code> z plikami <code className="text-indigo-300">hacs.json</code> i <code className="text-indigo-300">README.md</code>, gotowy do natychmiastowej instalacji w Home Assistant lub wgrania do repozytorium.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isExporting}
          className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Pobrano pomyślnie!</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>{isExporting ? 'Pakowanie...' : 'Pobierz aquilo.zip'}</span>
            </>
          )}
        </button>
      </div>

      {/* Git Push Commands Box */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/60 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Wypchnięcie kodu do https://github.com/RoSulek1/HA-Aquilo
              </h3>
              <p className="text-xs text-slate-400">
                Wszystkie pliki zostały już utworzone w środowisku. Wykonaj poniższe polecenia:
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(gitPushCommands, 'git-push')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            {copiedSection === 'git-push' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Skopiowano</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj komendy</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 font-mono text-xs sm:text-sm text-slate-200 bg-slate-950/90 leading-relaxed overflow-x-auto">
          <pre>{gitPushCommands}</pre>
        </div>
      </div>

      {/* Step by step HACS instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <Github className="w-4 h-4 text-indigo-400" />
            <span>Instalacja w HACS jako Custom Repository</span>
          </h4>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-5">
            <li>Otwórz Home Assistant i przejdź do <strong>HACS</strong>.</li>
            <li>Kliknij <strong>trzy kropki</strong> w prawym górnym rogu -&gt; <strong>Niestandardowe repozytoria (Custom repositories)</strong>.</li>
            <li>Wklej URL: <code className="text-indigo-300 font-mono">https://github.com/RoSulek1/HA-Aquilo</code></li>
            <li>Wybierz Kategorię: <strong>Integracja (Integration)</strong> i kliknij <strong>Dodaj</strong>.</li>
            <li>Pobierz integrację i uruchom ponownie Home Assistant.</li>
          </ol>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Konfiguracja przez Interfejs (Config Flow)</span>
          </h4>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-5">
            <li>Po restarcie wejdź w <strong>Ustawienia</strong> -&gt; <strong>Urządzenia oraz usługi</strong>.</li>
            <li>Kliknij <strong>Dodaj integrację</strong> w prawym dolnym rogu.</li>
            <li>Wyszukaj <strong>Aquilo</strong>.</li>
            <li>Wprowadź adres IP czujnika (np. <code>192.168.1.150</code>) oraz nazwę zbiornika.</li>
            <li>Gotowe! Encje <code>poziom</code>, <code>procent</code>, <code>ostatni_odczyt</code> utworzą się automatycznie.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
