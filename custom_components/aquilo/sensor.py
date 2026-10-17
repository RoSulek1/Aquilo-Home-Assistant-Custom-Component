"""Sensor platform for Aquilo Septic Tank Monitor integration."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
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
    """Class describing Aquilo sensor entities."""

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


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Aquilo sensor entities based on a config entry."""
    coordinator: AquiloDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]

    entities = [
        AquiloSensor(
            coordinator=coordinator,
            description=description,
            entry=entry,
        )
        for description in SENSOR_TYPES
    ]

    async_add_entities(entities)


class AquiloSensor(CoordinatorEntity[AquiloDataUpdateCoordinator], SensorEntity):
    """Representation of an Aquilo sensor."""

    entity_description: AquiloSensorEntityDescription

    def __init__(
        self,
        coordinator: AquiloDataUpdateCoordinator,
        description: AquiloSensorEntityDescription,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._entry = entry

        # Unique ID combining entry and sensor key
        sensor_id = coordinator.data.get("sensor_id", entry.entry_id)
        self._attr_unique_id = f"aquilo_{sensor_id}_{description.key}"

        # Assign friendly name prefixed by tank name
        tank_name = entry.data.get(CONF_NAME, "Aquilo")
        self._attr_name = f"{tank_name} {description.name}"

        # Device info ties all sensors into one device card in Home Assistant
        host = entry.data.get(CONF_HOST, "")
        clean_host = host.replace("http://", "").replace("https://", "").rstrip("/")
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=tank_name,
            manufacturer="Aquilo",
            model="Septic Tank Level Monitor",
            configuration_url=f"http://{clean_host}",
            sw_version="1.0.0",
        )

    @property
    def native_value(self) -> Any:
        """Return the state of the sensor."""
        if not self.coordinator.data:
            return None
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return entity specific state attributes."""
        if not self.coordinator.data or not self.entity_description.attr_fn:
            return None
        return self.entity_description.attr_fn(self.coordinator.data)
