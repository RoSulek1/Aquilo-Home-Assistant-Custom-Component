"""DataUpdateCoordinator for the Aquilo Septic Tank Monitor integration."""
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

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


def parse_timestamp(timestamp_str: Any) -> datetime | None:
    """Parse various timestamp string representations into a datetime object."""
    if not timestamp_str:
        return None

    if isinstance(timestamp_str, (int, float)):
        return datetime.fromtimestamp(timestamp_str, tz=timezone.utc)

    if isinstance(timestamp_str, str):
        cleaned = timestamp_str.strip()
        # Try ISO format
        try:
            return dt_util.parse_datetime(cleaned)
        except Exception:
            pass

        # Try common custom formats like '2026-10-17 14:00:00'
        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d.%m.%Y %H:%M:%S",
            "%d.%m.%Y %H:%M",
            "%Y/%m/%d %H:%M:%S",
        ):
            try:
                parsed = datetime.strptime(cleaned, fmt)
                # Assign default Home Assistant timezone if naive
                return dt_util.as_utc(parsed)
            except ValueError:
                continue

    return None


class AquiloDataUpdateCoordinator(DataUpdateCoordinator[Dict[str, Any]]):
    """Class to manage fetching Aquilo data from REST API."""

    def __init__(
        self,
        hass: HomeAssistant,
        host: str,
        name: str,
        update_interval_sec: int,
    ) -> None:
        """Initialize the coordinator."""
        self.host = host.strip().rstrip("/")
        # If host doesn't have scheme, prepend http://
        if not self.host.startswith("http://") and not self.host.startswith("https://"):
            self.api_url = f"http://{self.host}/state"
        else:
            self.api_url = f"{self.host}/state"

        self.tank_name = name
        self.session = async_get_clientsession(hass)

        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}_{name}",
            update_interval=dt_util.dt.timedelta(seconds=update_interval_sec),
        )

    async def _async_update_data(self) -> Dict[str, Any]:
        """Fetch data from the Aquilo device REST endpoint."""
        try:
            async with async_timeout.timeout(10):
                response = await self.session.get(self.api_url)
                if response.status != 200:
                    raise UpdateFailed(
                        f"Error communicating with Aquilo device at {self.api_url}: HTTP {response.status}"
                    )
                data = await response.json(content_type=None)
        except asyncio.TimeoutError as err:
            raise UpdateFailed(f"Timeout communicating with Aquilo device at {self.api_url}") from err
        except aiohttp.ClientError as err:
            raise UpdateFailed(f"Error communicating with Aquilo device at {self.api_url}: {err}") from err
        except Exception as err:
            raise UpdateFailed(f"Unexpected error communicating with Aquilo device: {err}") from err

        if not isinstance(data, dict):
            raise UpdateFailed(f"Invalid payload received from Aquilo: expected JSON object, got {type(data)}")

        sensors = data.get("sensors")
        if not sensors or not isinstance(sensors, list) or len(sensors) == 0:
            raise UpdateFailed("Invalid payload from Aquilo: 'sensors' list is missing or empty")

        sensor_data = sensors[0]
        if not isinstance(sensor_data, dict):
            raise UpdateFailed("Invalid payload from Aquilo: sensors[0] is not an object")

        sensor_id = sensor_data.get("id")
        lvl = sensor_data.get("lvl")
        pct = sensor_data.get("pct")
        lst_read_raw = sensor_data.get("lstRead")

        # Parse timestamp and compute minutes interval
        parsed_dt = parse_timestamp(lst_read_raw)
        min_interval: float | None = None
        if parsed_dt:
            now_dt = dt_util.utcnow()
            diff_seconds = (now_dt - parsed_dt).total_seconds()
            if diff_seconds >= 0:
                min_interval = round(diff_seconds / 60.0, 1)

        return {
            "sensor_id": str(sensor_id) if sensor_id is not None else "unknown",
            "lvl": float(lvl) if lvl is not None else None,
            "pct": float(pct) if pct is not None else None,
            "lstRead_raw": lst_read_raw,
            "lstRead": parsed_dt,
            "mininterval": min_interval,
            "raw_attributes": sensor_data,
        }
