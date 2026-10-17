"""Constants for the Aquilo Septic Tank Monitor integration."""
from datetime import timedelta
from typing import Final

DOMAIN: Final = "aquilo"

CONF_HOST: Final = "host"
CONF_NAME: Final = "name"
CONF_SCAN_INTERVAL: Final = "scan_interval"

DEFAULT_NAME: Final = "Aquilo Septic Tank"
DEFAULT_SCAN_INTERVAL: Final = 60  # seconds
MIN_SCAN_INTERVAL: Final = 10  # seconds

ATTR_SENSOR_ID: Final = "sensor_id"
ATTR_LVL: Final = "lvl"
ATTR_PCT: Final = "pct"
ATTR_LST_READ: Final = "lstRead"
ATTR_MIN_INTERVAL: Final = "mininterval"
