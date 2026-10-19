"""Config flow for Aquilo Septic Tank Monitor integration."""
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

from .const import (
    CONF_HOST,
    CONF_NAME,
    CONF_SCAN_INTERVAL,
    DEFAULT_NAME,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MIN_SCAN_INTERVAL,
)


async def validate_aquilo_host(hass: HomeAssistant, host: str) -> Dict[str, Any]:
    """Validate connection to Aquilo device by querying /state endpoint."""
    clean_host = host.strip().rstrip("/")
    if not clean_host.startswith("http://") and not clean_host.startswith("https://"):
        url = f"http://{clean_host}/state"
    else:
        url = f"{clean_host}/state"

    session = async_get_clientsession(hass)
    try:
        async with async_timeout.timeout(10):
            response = await session.get(url)
            if response.status != 200:
                return {"success": False, "error": "cannot_connect"}
            data = await response.json(content_type=None)
    except (asyncio.TimeoutError, aiohttp.ClientError):
        return {"success": False, "error": "cannot_connect"}
    except Exception:
        return {"success": False, "error": "invalid_response"}

    if not isinstance(data, dict):
        return {"success": False, "error": "invalid_response"}

    sensors = data.get("sensors")
    if not sensors or not isinstance(sensors, list) or len(sensors) == 0:
        return {"success": False, "error": "invalid_response"}

    sensor_id = sensors[0].get("id")
    return {
        "success": True,
        "sensor_id": str(sensor_id) if sensor_id is not None else clean_host,
    }


class AquiloConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Aquilo."""

    VERSION = 1

    async def async_step_user(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Handle the initial user setup step."""
        errors: Dict[str, str] = {}

        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            name = user_input.get(CONF_NAME, DEFAULT_NAME).strip()
            scan_interval = user_input.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)

            # Validate device connectivity
            validation = await validate_aquilo_host(self.hass, host)
            if validation["success"]:
                sensor_id = validation["sensor_id"]
                unique_id = f"aquilo_{sensor_id}"

                await self.async_set_unique_id(unique_id)
                self._abort_if_unique_id_configured()

                return self.async_create_entry(
                    title=name,
                    data={
                        CONF_HOST: host,
                        CONF_NAME: name,
                        CONF_SCAN_INTERVAL: scan_interval,
                    },
                )
            else:
                errors["base"] = validation.get("error", "cannot_connect")

        schema = vol.Schema(
            {
                vol.Required(CONF_HOST): cv.string,
                vol.Optional(CONF_NAME, default=DEFAULT_NAME): cv.string,
                vol.Optional(
                    CONF_SCAN_INTERVAL, default=DEFAULT_SCAN_INTERVAL
                ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL, max=3600)),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    def _get_reconfig_entry(self) -> config_entries.ConfigEntry:
        """Safely get entry for reconfigure."""
        if hasattr(self, "_get_reconfigure_entry"):
            entry = self._get_reconfigure_entry()
            if entry:
                return entry
        entry_id = getattr(self, "context", {}).get("entry_id")
        if entry_id and self.hass:
            return self.hass.config_entries.async_get_entry(entry_id)
        return None

    async def async_step_reconfigure(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Handle reconfiguration step invoked from Home Assistant UI."""
        errors: Dict[str, str] = {}
        entry = self._get_reconfig_entry()

        if entry is None:
            return self.async_abort(reason="cannot_connect")

        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            scan_interval = user_input.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)

            validation = await validate_aquilo_host(self.hass, host)
            if validation["success"]:
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates={
                        CONF_HOST: host,
                        CONF_SCAN_INTERVAL: scan_interval,
                    },
                )
            errors["base"] = validation.get("error", "cannot_connect")

        current_host = entry.options.get(CONF_HOST, entry.data.get(CONF_HOST, ""))
        current_scan_interval = entry.options.get(
            CONF_SCAN_INTERVAL,
            entry.data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
        )

        schema = vol.Schema(
            {
                vol.Required(CONF_HOST, default=current_host): cv.string,
                vol.Optional(
                    CONF_SCAN_INTERVAL, default=current_scan_interval
                ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL, max=3600)),
            }
        )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=schema,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return AquiloOptionsFlowHandler(config_entry)


class AquiloOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle options for Aquilo."""

    def __init__(self, config_entry: config_entries.ConfigEntry | None = None) -> None:
        """Initialize options flow safely without setting read-only properties."""
        self._custom_config_entry = config_entry

    def _get_entry(self) -> config_entries.ConfigEntry | None:
        """Safely retrieve the config entry across different Home Assistant versions."""
        # 1. Check parent property self.config_entry
        try:
            entry = super().config_entry
            if entry is not None:
                return entry
        except Exception:
            pass
        # 2. Check injected config_entry
        if self._custom_config_entry is not None:
            return self._custom_config_entry
        # 3. Check handler entry_id
        if hasattr(self, "handler") and getattr(self, "hass", None):
            return self.hass.config_entries.async_get_entry(self.handler)
        return None

    async def async_step_init(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Manage the options step."""
        entry = self._get_entry()
        errors: Dict[str, str] = {}

        if user_input is not None:
            new_host = user_input.get(CONF_HOST, "").strip()
            if new_host:
                validation = await validate_aquilo_host(self.hass, new_host)
                if not validation["success"]:
                    errors["base"] = validation.get("error", "cannot_connect")
                else:
                    return self.async_create_entry(title="", data=user_input)
            else:
                return self.async_create_entry(title="", data=user_input)

        current_host = ""
        current_scan_interval = DEFAULT_SCAN_INTERVAL

        if entry is not None:
            current_host = entry.options.get(CONF_HOST, entry.data.get(CONF_HOST, ""))
            current_scan_interval = entry.options.get(
                CONF_SCAN_INTERVAL,
                entry.data.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
            )

        options_schema = vol.Schema(
            {
                vol.Required(CONF_HOST, default=current_host): cv.string,
                vol.Optional(
                    CONF_SCAN_INTERVAL, default=current_scan_interval
                ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL, max=3600)),
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=options_schema,
            errors=errors,
        )
