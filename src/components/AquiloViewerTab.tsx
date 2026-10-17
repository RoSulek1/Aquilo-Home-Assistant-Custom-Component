import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  Copy,
  Check,
  ExternalLink,
  FolderTree,
  Sliders,
  Gauge,
  Clock,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';

export const AquiloViewerTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('sensor.py');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const fileDefinitions: Record<
    string,
    { title: string; path: string; desc: string; icon: any; content: string }
  > = {
    'sensor.py': {
      title: 'sensor.py',
      path: 'custom_components/aquilo/sensor.py',
      desc: 'Definiuje encje czujników (Poziom cm, Procent %, Ostatni odczyt, Czas od odczytu) z odpowiednimi klasami urządzeń Home Assistant.',
      icon: Gauge,
      content: `"""Sensor platform for Aquilo Septic Tank Monitor integration."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import PERCENTAGE, UnitOfLength, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_HOST, CONF_NAME, DOMAIN
from .coordinator import AquiloDataUpdateCoordinator

@dataclass(frozen=True, kw_only=True)
class AquiloSensorEntityDescription(SensorEntityDescription):
    value_fn: Callable[[dict[str, Any]], Any]
    attr_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None

SENSOR_TYPES: tuple[AquiloSensorEntityDescription, ...] = (
    AquiloSensorEntityDescription(
        key="lvl",
        translation_key="level",
        name="Poziom",
        native_unit_of_measurement=UnitOfLength.CENTIMETERS,
        device_class=SensorDeviceClass.DISTANCE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:arrow-expand-vertical",
        value_fn=lambda data: data.get("lvl"),
        attr_fn=lambda data: {
            "sensor_id": data.get("sensor_id"),
            "raw_attributes": data.get("raw_attributes"),
        },
    ),
    AquiloSensorEntityDescription(
        key="pct",
        translation_key="percentage",
        name="Procent",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:water-percent",
        value_fn=lambda data: data.get("pct"),
    ),
    AquiloSensorEntityDescription(
        key="lstread",
        translation_key="last_read",
        name="Ostatni odczyt",
        device_class=SensorDeviceClass.TIMESTAMP,
        icon="mdi:clock-check-outline",
        value_fn=lambda data: data.get("lstRead"),
        attr_fn=lambda data: {
            "raw_timestamp": data.get("lstRead_raw"),
        },
    ),
    AquiloSensorEntityDescription(
        key="mininterval",
        translation_key="min_interval",
        name="Czas od odczytu",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:timer-outline",
        value_fn=lambda data: data.get("mininterval"),
    ),
)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    coordinator: AquiloDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    entities = [
        AquiloSensor(coordinator=coordinator, description=description, entry=entry)
        for description in SENSOR_TYPES
    ]
    async_add_entities(entities)`,
    },
    'config_flow.py': {
      title: 'config_flow.py',
      path: 'custom_components/aquilo/config_flow.py',
      desc: 'Graficzny konfigurator w Home Assistant (Settings -> Devices & Services). Testuje połączenie z IP urządzenia i zapobiega duplikatom.',
      icon: Sliders,
      content: `"""Config flow for Aquilo Septic Tank Monitor integration."""
from __future__ import annotations
import asyncio
from typing import Any, Dict, Optional
import aiohttp
import async_timeout
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession
import homeassistant.helpers.config_validation as cv

from .const import CONF_HOST, CONF_NAME, CONF_SCAN_INTERVAL, DEFAULT_NAME, DEFAULT_SCAN_INTERVAL, DOMAIN, MIN_SCAN_INTERVAL

class AquiloConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: Optional[Dict[str, Any]] = None) -> FlowResult:
        errors: Dict[str, str] = {}
        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            name = user_input.get(CONF_NAME, DEFAULT_NAME).strip()
            scan_interval = user_input.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)

            validation = await validate_aquilo_host(self.hass, host)
            if validation["success"]:
                sensor_id = validation["sensor_id"]
                await self.async_set_unique_id(f"aquilo_{sensor_id}")
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=name,
                    data={CONF_HOST: host, CONF_NAME: name, CONF_SCAN_INTERVAL: scan_interval},
                )
            else:
                errors["base"] = validation.get("error", "cannot_connect")

        schema = vol.Schema({
            vol.Required(CONF_HOST): cv.string,
            vol.Optional(CONF_NAME, default=DEFAULT_NAME): cv.string,
            vol.Optional(CONF_SCAN_INTERVAL, default=DEFAULT_SCAN_INTERVAL): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL, max=3600)),
        })
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)`,
    },
    'coordinator.py': {
      title: 'coordinator.py',
      path: 'custom_components/aquilo/coordinator.py',
      desc: 'DataUpdateCoordinator zarządzający odpytywaniem REST API http://<IP>/state, obsługą timeoutów i kalkulacją minut od ostatniego odczytu.',
      icon: Clock,
      content: `"""DataUpdateCoordinator for the Aquilo Septic Tank Monitor integration."""
from __future__ import annotations
import asyncio
import async_timeout
from datetime import datetime, timezone
import logging
from typing import Any, Dict
import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
import homeassistant.util.dt as dt_util

class AquiloDataUpdateCoordinator(DataUpdateCoordinator[Dict[str, Any]]):
    def __init__(self, hass: HomeAssistant, host: str, name: str, update_interval_sec: int) -> None:
        self.host = host.strip().rstrip("/")
        self.api_url = f"http://{self.host}/state" if not self.host.startswith("http") else f"{self.host}/state"
        self.tank_name = name
        self.session = async_get_clientsession(hass)
        super().__init__(hass, logging.getLogger(__name__), name=f"aquilo_{name}", update_interval=dt_util.dt.timedelta(seconds=update_interval_sec))

    async def _async_update_data(self) -> Dict[str, Any]:
        async with async_timeout.timeout(10):
            response = await self.session.get(self.api_url)
            data = await response.json(content_type=None)
        
        sensor = data["sensors"][0]
        parsed_dt = parse_timestamp(sensor.get("lstRead"))
        min_interval = round((dt_util.utcnow() - parsed_dt).total_seconds() / 60.0, 1) if parsed_dt else None
        
        return {
            "sensor_id": str(sensor.get("id")),
            "lvl": float(sensor.get("lvl")),
            "pct": float(sensor.get("pct")),
            "lstRead": parsed_dt,
            "mininterval": min_interval,
            "raw_attributes": sensor,
        }`,
    },
    'manifest.json': {
      title: 'manifest.json',
      path: 'custom_components/aquilo/manifest.json',
      desc: 'Metadane integracji Home Assistant dla HACS z domeną "aquilo" oraz autorem @RoSulek1.',
      icon: Layers,
      content: `{
  "domain": "aquilo",
  "name": "Aquilo Septic Tank Monitor",
  "codeowners": ["@RoSulek1"],
  "config_flow": true,
  "documentation": "https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component",
  "issue_tracker": "https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component/issues",
  "integration_type": "device",
  "iot_class": "local_polling",
  "requirements": [],
  "version": "1.0.0"
}`,
    },
    'README.md': {
      title: 'README.md',
      path: 'README.md',
      desc: 'Dokumentacja po angielsku z oficjalnym przyciskiem "Add to My Home Assistant", instrukcją HACS oraz przykładami kart Lovelace.',
      icon: FileText,
      content: `<p align="center">
  <img src="logo.svg" alt="Aquilo Logo" width="220" />
</p>

# Aquilo Septic Tank Monitor for Home Assistant

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=RoSulek1&repository=Aquilo-Home-Assistant-Custom-Component&category=integration)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/RoSulek1/Aquilo-Home-Assistant-Custom-Component?style=for-the-badge&color=blue)](https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component/releases)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg?style=for-the-badge)](LICENSE)

Home Assistant custom component for the **Aquilo Septic Tank & Water Level Monitor**.`,
    },
    'hacs.json': {
      title: 'hacs.json',
      path: 'hacs.json',
      desc: 'Konfiguracja repozytorium HACS.',
      icon: Layers,
      content: `{
  "name": "Aquilo Septic Tank Monitor",
  "content_in_root": false,
  "render_readme": true
}`,
    },
  };

  const current = fileDefinitions[activeFile] || fileDefinitions['sensor.py'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner with Aquilo Logo & My Home Assistant Button */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <img
              src="/logo.svg"
              alt="Aquilo Logo"
              className="w-24 h-16 rounded-xl border border-slate-700 shadow-lg object-cover shrink-0"
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Component HACS Gotowy: Aquilo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Aquilo Septic Tank Monitor
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Repozytorium: <code className="text-indigo-300 font-mono">https://github.com/RoSulek1/Aquilo-Home-Assistant-Custom-Component</code>
                <br />
                Zastępuje stare sensory YAML pełną obsługą Config Flow, kafelkiem urządzenia i automatycznym odświeżaniem.
              </p>
            </div>
          </div>

          {/* Official Add to My Home Assistant Button */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center space-y-2 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Przycisk &quot;My Home Assistant&quot;:
            </span>
            <a
              href="https://my.home-assistant.io/redirect/hacs_repository/?owner=RoSulek1&repository=Aquilo-Home-Assistant-Custom-Component&category=integration"
              target="_blank"
              rel="noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img
                src="https://my.home-assistant.io/badges/hacs_repository.svg"
                alt="Open your Home Assistant instance and open a repository inside the Home Assistant Community Store."
                className="h-10"
              />
            </a>
            <span className="text-[10px] text-slate-500">
              Otwiera bezpośrednio HACS w Twoim Home Assistant
            </span>
          </div>
        </div>
      </div>

      {/* Code & Files Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Selector Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <span>Struktura komponentu</span>
          </div>

          <div className="space-y-1.5">
            {Object.keys(fileDefinitions).map((key) => {
              const file = fileDefinitions[key];
              const Icon = file.icon;
              const isSelected = activeFile === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md text-white'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="truncate">
                    <div className="font-mono text-xs font-semibold">{file.title}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sensors Summary Card */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
            <div className="font-bold text-slate-200 flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Utworzone encje Home Assistant:</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 font-mono text-[11px]">
              <li className="flex items-center justify-between">
                <span>sensor.&lt;name&gt;_poziom</span>
                <span className="text-emerald-400">cm (Distance)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>sensor.&lt;name&gt;_procent</span>
                <span className="text-blue-400">% (Fill level)</span>
              </li>
              <li className="flex items-center justify-between">
                <span>sensor.&lt;name&gt;_ostatni_odczyt</span>
                <span className="text-purple-400">Timestamp</span>
              </li>
              <li className="flex items-center justify-between">
                <span>sensor.&lt;name&gt;_czas_od_odczytu</span>
                <span className="text-amber-400">min (Duration)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Code View Panel */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-sm font-bold text-white">{current.path}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{current.desc}</p>
            </div>

            <button
              onClick={() => handleCopy(current.content, current.path)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors shrink-0"
            >
              {copied === current.path ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Skopiowano</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopiuj kod</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 overflow-auto max-h-[580px] font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/80 whitespace-pre">
            {current.content}
          </div>
        </div>
      </div>
    </div>
  );
};
