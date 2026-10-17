/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { AquiloViewerTab } from './components/AquiloViewerTab';
import { DeviceSimulatorTab } from './components/DeviceSimulatorTab';
import { ConnectGuideTab } from './components/ConnectGuideTab';
import { ExportSyncTab } from './components/ExportSyncTab';
import { Github, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('aquilo');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'aquilo' && <AquiloViewerTab />}

        {activeTab === 'simulator' && <DeviceSimulatorTab />}

        {activeTab === 'git' && <ConnectGuideTab onSwitchToExplorer={() => {}} />}

        {activeTab === 'export' && <ExportSyncTab />}
      </main>

      {/* Global Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Github className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-400">
              HA-Aquilo — Home Assistant Custom Component
            </span>
            <span>•</span>
            <a
              href="https://github.com/RoSulek1/HA-Aquilo"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              github.com/RoSulek1/HA-Aquilo
            </a>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="inline-flex items-center space-x-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zgodny ze specyfikacją HACS i Home Assistant 2024+</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
