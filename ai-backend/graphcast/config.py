"""
GraphCast Configuration
Defines model paths, cache settings, and region boundaries for GraphCast integration.
"""

import os
from pathlib import Path
from typing import Dict, Any

# Base directories
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models" / "graphcast"
CACHE_DIR = BASE_DIR / "cache" / "forecasts"
DATA_DIR = BASE_DIR / "data" / "era5"

# Model configuration
MODEL_CONFIG = {
    "weights_url": "https://github.com/google-deepmind/graphcast/releases/download/v0.1/graphcast_operational.npz",
    "weights_path": MODELS_DIR / "graphcast_operational.npz",
    "weights_checksum": None,  # Will be validated during download
    "model_version": "v0.1",
}

# Region boundaries for Maharashtra, India
REGION_BOUNDARIES = {
    "maharashtra": {
        "lat_min": 18.0,
        "lat_max": 21.0,
        "lon_min": 73.0,
        "lon_max": 77.0,
        "name": "Maharashtra, India"
    }
}

# Cache settings
CACHE_CONFIG = {
    "backend": "file",  # Options: "file", "redis"
    "ttl_seconds": 86400,  # 24 hours
    "cache_dir": CACHE_DIR,
    "enable_precomputation": True,
    "precompute_schedule": "0 0 * * *",  # Daily at 00:00 UTC
}

# Inference settings
INFERENCE_CONFIG = {
    "default_forecast_days": 10,
    "max_forecast_days": 10,
    "timeout_cpu_seconds": 300,
    "timeout_gpu_seconds": 60,
    "device": "cpu",  # Options: "cpu", "cuda", "auto"
    "lazy_loading": True,
}

# ERA5 data settings
ERA5_CONFIG = {
    "data_dir": DATA_DIR,
    "cache_ttl_seconds": 86400,  # 24 hours
    "required_variables": [
        "temperature",
        "pressure",
        "humidity",
        "u_component_of_wind",
        "v_component_of_wind"
    ],
    "spatial_resolution": 0.25,  # degrees
    "temporal_resolution": "1H",  # hourly
}

# Agricultural metrics thresholds for Maharashtra
AGRICULTURAL_THRESHOLDS = {
    "rainfall_risk": {
        "low_threshold": 5.0,  # mm/day - below this is low risk
        "moderate_threshold": 25.0,  # mm/day - above this is high risk
        "flash_flood_intensity": 10.0,  # mm/hour - intensity threshold for flash flood risk
        "cumulative_window_days": 7,  # days for cumulative precipitation calculation
        "high_cumulative_threshold": 100.0,  # mm/week - high risk threshold
    },
    "temperature_optimal_ranges": {
        "rice": {"min": 25.0, "max": 35.0},  # Celsius
        "wheat": {"min": 15.0, "max": 25.0},
        "cotton": {"min": 21.0, "max": 30.0},
        "default": {"min": 20.0, "max": 30.0},  # Default for unknown crops
    },
    "temperature_extreme": {
        "deviation_threshold": 5.0,  # °C - deviation from optimal for risk calculation
        "extreme_heat_threshold": 40.0,  # °C - extreme heat warning
        "extreme_cold_threshold": 10.0,  # °C - extreme cold warning
    },
    "soil_moisture": {
        "field_capacity": 100.0,  # % - maximum soil moisture
        "wilting_point": 0.0,  # % - minimum soil moisture
        "initial_moisture": 50.0,  # % - initial soil moisture state
        "evapotranspiration_base": 5.0,  # mm/day - base ET rate at 25°C
        "et_temp_coefficient": 0.15,  # ET increase per °C above 25°C
        "drainage_coefficient": 0.1,  # fraction of excess water drained per day
        "precipitation_efficiency": 0.8,  # fraction of precipitation that infiltrates
    },
    "confidence": {
        "base_confidence": 0.95,  # confidence for day 1
        "decay_rate": 0.05,  # confidence decrease per day
        "min_confidence": 0.5,  # minimum confidence score
    }
}

# Logging configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "log_inference_metrics": True,
    "log_cache_hits": True,
}


def get_config() -> Dict[str, Any]:
    """
    Get complete configuration dictionary.
    
    Returns:
        Dictionary containing all configuration settings
    """
    return {
        "model": MODEL_CONFIG,
        "region": REGION_BOUNDARIES,
        "cache": CACHE_CONFIG,
        "inference": INFERENCE_CONFIG,
        "era5": ERA5_CONFIG,
        "agricultural": AGRICULTURAL_THRESHOLDS,
        "logging": LOGGING_CONFIG,
    }


def validate_coordinates(lat: float, lon: float, region: str = "maharashtra") -> bool:
    """
    Validate if coordinates are within specified region boundaries.
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        region: Region name (default: "maharashtra")
        
    Returns:
        True if coordinates are valid, False otherwise
    """
    if region not in REGION_BOUNDARIES:
        return False
    
    bounds = REGION_BOUNDARIES[region]
    return (
        bounds["lat_min"] <= lat <= bounds["lat_max"] and
        bounds["lon_min"] <= lon <= bounds["lon_max"]
    )


# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
