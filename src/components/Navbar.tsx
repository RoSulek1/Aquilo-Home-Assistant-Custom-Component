import React from 'react';
import { Layers, Sliders, Terminal, Download, Github, Sparkles } from 'lucide-react';

export type TabType = 'aquilo' | 'simulator' | 'git' | 'export';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.svg"
              alt="Aquilo Logo"
              className="w-12 h-8 rounded-lg shadow-md border border-slate-700 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Aquilo Studio</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  HACS Component
                </span>
              </div>
              <p className="text-xs text-slate-400">Czujnik poziomu szamba i wody dla Home Assistant</p>
            </div>
          </div>

          {/* GitHub Repo Link */}
          <div className="flex items-center space-x-2">
            <a
              href="https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-indigo-400" />
              <span>RoSulek1/Aquilo-Home-Assistant-Custom-Component</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/60 text-sm no-scrollbar">
          <button
            onClick={() => setActiveTab('aquilo')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'aquilo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Pliki komponentu &amp; README</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. Symulator &amp; Test REST API</span>
          </button>

          <button
            onClick={() => setActiveTab('git')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'git'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Komendy Git &amp; Push do repo</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>4. Pobierz ZIP &amp; Instrukcja HACS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
