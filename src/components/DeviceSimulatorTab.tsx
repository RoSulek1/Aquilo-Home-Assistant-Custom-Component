import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Clock,
  Waves,
  Ruler,
  Sliders,
  Send,
} from 'lucide-react';

export const DeviceSimulatorTab: React.FC = () => {
  const [deviceIp, setDeviceIp] = useState('192.168.1.150');
  const [tankName, setTankName] = useState('Szambo');
  const [mockLvl, setMockLvl] = useState(145);
  const [mockPct, setMockPct] = useState(72);
  const [mockLstRead, setMockLstRead] = useState(() => {
    const d = new Date(Date.now() - 14 * 60 * 1000); // 14 mins ago
    return d.toISOString().replace('T', ' ').slice(0, 19);
  });

  const [testingReal, setTestingReal] = useState(false);
  const [realTestResult, setRealTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  // Compute calculated values
  const lastReadDate = new Date(mockLstRead);
  const now = new Date();
  const diffMinutes = !isNaN(lastReadDate.getTime())
    ? Math.max(0, Math.round((now.getTime() - lastReadDate.getTime()) / 60000))
    : 0;

  const handleTestRealIp = async () => {
    setTestingReal(true);
    setRealTestResult(null);

    const clean = deviceIp.replace(/^https?:\/\//, '').trim();
    const url = `http://${clean}/state`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      setRealTestResult({
        success: true,
        message: 'Połączono pomyślnie z czujnikiem Aquilo!',
        data: json,
      });

      if (json.sensors && json.sensors[0]) {
        const s = json.sensors[0];
        if (s.lvl !== undefined) setMockLvl(s.lvl);
        if (s.pct !== undefined) setMockPct(s.pct);
        if (s.lstRead !== undefined) setMockLstRead(s.lstRead);
      }
    } catch (err: any) {
      setRealTestResult({
        success: false,
        message: `Nie udało się bezpośrednio połączyć z ${url} z przeglądarki (przeglądarka może blokować zapytania do sieci lokalnej przez Mixed Content / CORS, co jest normalne w chmurze). W Home Assistant połączenie zadziała bezpośrednio przez sieć lokalną LAN.`,
      });
    } finally {
      setTestingReal(false);
    }
  };

  const sampleJson = {
    sensors: [
      {
        id: 'aquilo_sensor_1',
        lvl: mockLvl,
        pct: mockPct,
        lstRead: mockLstRead,
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Symulator &amp; Tester REST API Aquilo</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Przetestuj format danych JSON z endpointu <code className="text-indigo-300">http://{deviceIp}/state</code> i zobacz, jak encje Home Assistant zinterpretują te odczyty.
        </p>
      </div>

      {/* Grid: Controls & Visual Tank Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs & Simulated Payload */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Parametry urządzenia</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adres IP Aquilo (LAN):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="192.168.1.150"
                  />
                  <button
                    onClick={handleTestRealIp}
                    disabled={testingReal}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    {testingReal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Testuj'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nazwa zbiornika w HA:
                </label>
                <input
                  type="text"
                  value={tankName}
                  onChange={(e) => setTankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="Szambo"
                />
              </div>
            </div>

            {realTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  realTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}
              >
                {realTestResult.message}
              </div>
            )}

            {/* Slider Controls */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Poziom cieczy (lvl):</span>
                  <span className="font-mono text-indigo-300 font-bold">{mockLvl} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={mockLvl}
                  onChange={(e) => setMockLvl(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Procent zapełnienia (pct):</span>
                  <span className="font-mono text-blue-300 font-bold">{mockPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mockPct}
                  onChange={(e) => setMockPct(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ostatni odczyt (lstRead):
                </label>
                <input
                  type="text"
                  value={mockLstRead}
                  onChange={(e) => setMockLstRead(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Payload Preview */}
            <div className="space-y-1 pt-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Wygenerowany JSON zwracany przez urządzenie:
              </span>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(sampleJson, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Tank & Home Assistant Entity Cards Preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Visual Tank Graphic */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Waves className="w-4 h-4 text-blue-400" />
              <span>Wizualizacja zbiornika ({mockPct}%)</span>
            </h4>

            <div className="relative w-40 h-56 rounded-3xl border-4 border-slate-700 bg-slate-950 overflow-hidden shadow-inner flex flex-col justify-end">
              {/* Liquid Level */}
              <div
                className={`w-full transition-all duration-500 rounded-b-2xl relative ${
                  mockPct > 85
                    ? 'bg-gradient-to-t from-rose-700 to-rose-500'
                    : mockPct > 70
                    ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                    : 'bg-gradient-to-t from-blue-700 to-cyan-500'
                }`}
                style={{ height: `${Math.min(100, Math.max(0, mockPct))}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-pulse" />
              </div>

              {/* Water surface indicator text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {mockPct}%
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5">
                  {mockLvl} cm
                </span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 mt-3 font-medium">
              {mockPct > 85 ? (
                <span className="text-rose-400 font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  Stan krytyczny: czas na wywóz!
                </span>
              ) : mockPct > 70 ? (
                <span className="text-amber-400 font-semibold">Ostrzeżenie: poziom wysoki</span>
              ) : (
                <span className="text-emerald-400 font-semibold">Poziom w normie</span>
              )}
            </span>
          </div>

          {/* HA Entities Live Preview Cards */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Podgląd kafelków w Home Assistant</span>
            </h4>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Ruler className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">{tankName} Poziom</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      sensor.{tankName.toLowerCase()}_poziom
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-white">{mockLvl} cm</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Waves className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold text-white">{tankName} Procent</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      sensor.{tankName.toLowerCase()}_procent
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-blue-300">{mockPct} %</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-semibold text-white">{tankName} Ostatni odczyt</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      sensor.{tankName.toLowerCase()}_ostatni_odczyt
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-purple-300">{mockLstRead}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">{tankName} Czas od odczytu</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      sensor.{tankName.toLowerCase()}_czas_od_odczytu
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-amber-300">{diffMinutes} min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
