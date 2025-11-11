"""
GraphCast Inference Pipeline
Orchestrates model execution including preprocessing, inference, and postprocessing.
"""

from __future__ import annotations
import logging
import asyncio
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from dataclasses import dataclass

if TYPE_CHECKING:
    import xarray as xr
    import numpy as np

try:
    import xarray as xr
    import numpy as np
    import jax
    import jax.numpy as jnp
except ImportError:
    xr = None
    np = None
    jax = None
    jnp = None

from .model_manager import GraphCastModelManager
from .era5_fetcher import ERA5DataFetcher
from .config import INFERENCE_CONFIG, REGION_BOUNDARIES
from .profiler import get_profiler

logger = logging.getLogger(__name__)
profiler = get_profiler()


@dataclass
class Location:
    """Location information"""
    latitude: float
    longitude: float
    region: str


@dataclass
class RawWeatherData:
    """Raw weather data for a single time point"""
    precipitation_mm: float
    temp_max_c: float
    temp_min_c: float
    temp_mean_c: float
    humidity_percent: float
    wind_speed_ms: float


@dataclass
class ForecastDay:
    """Forecast data for a single day"""
    date: datetime
    rain_risk: float  # 0-100
    temp_extreme: float  # 0-100
    soil_moisture_proxy: float  # 0-100
    confidence_score: float  # 0-1
    raw_weather: RawWeatherData


@dataclass
class ForecastMetadata:
    """Metadata about the forecast"""
    model_version: str
    generated_at: datetime
    cache_hit: bool
    inference_time_ms: int
    era5_timestamp: datetime


@dataclass
class ForecastResult:
    """Complete forecast result"""
    location: Location
    forecast_days: List[ForecastDay]
    metadata: ForecastMetadata


class GraphCastInferencePipeline:
    """
    Orchestrates GraphCast model execution including data preprocessing,
    autoregressive rollout, and output postprocessing.
    """
    
    def __init__(
        self,
        model_manager: GraphCastModelManager,
        data_fetcher: ERA5DataFetcher
    ):
        """
        Initialize inference pipeline.
        
        Args:
            model_manager: GraphCast model manager instance
            data_fetcher: ERA5 data fetcher instance
        """
        self.model_manager = model_manager
        self.data_fetcher = data_fetcher
        
        self.timeout_cpu = INFERENCE_CONFIG["timeout_cpu_seconds"]
        self.timeout_gpu = INFERENCE_CONFIG["timeout_gpu_seconds"]
        self.max_forecast_days = INFERENCE_CONFIG["max_forecast_days"]
        
        logger.info("GraphCastInferencePipeline initialized")
    
    @profiler.profile_function("run_inference")
    async def run_inference(
        self,
        lat: float,
        lon: float,
        forecast_days: int = 10
    ) -> Optional[ForecastResult]:
        """
        Run GraphCast inference for specified location.
        
        Args:
            lat: Latitude in degrees
            lon: Longitude in degrees
            forecast_days: Number of days to forecast (default: 10, max: 10)
            
        Returns:
            ForecastResult or None if inference fails
        """
        start_time = time.time()
        
        try:
            # Validate inputs
            if forecast_days > self.max_forecast_days:
                logger.warning(f"Requested {forecast_days} days, limiting to {self.max_forecast_days}")
                forecast_days = self.max_forecast_days
            
            # Ensure model is loaded
            if not self.model_manager.is_model_loaded():
                logger.info("Model not loaded, loading now...")
                success = await self.model_manager.load_model()
                if not success:
                    logger.error("Failed to load model")
                    return None
            
            # Get region boundaries
            region_name = self._get_region_name(lat, lon)
            if not region_name:
                logger.error(f"Coordinates ({lat}, {lon}) outside supported regions")
                return None
            
            bounds = REGION_BOUNDARIES[region_name]
            
            # Fetch ERA5 initial conditions
            logger.info(f"Fetching ERA5 initial conditions for ({lat}, {lon})")
            timestamp = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            
            with profiler.profile_block("fetch_era5_data"):
                era5_data = await self.data_fetcher.fetch_initial_conditions(
                    lat_min=bounds["lat_min"],
                    lat_max=bounds["lat_max"],
                    lon_min=bounds["lon_min"],
                    lon_max=bounds["lon_max"],
                    timestamp=timestamp
                )
            
            if era5_data is None:
                logger.error("Failed to fetch ERA5 initial conditions")
                return None
            
            # Preprocess inputs
            logger.info("Preprocessing ERA5 data for GraphCast")
            with profiler.profile_block("preprocess_inputs"):
                preprocessed_data = self._preprocess_inputs(era5_data, lat, lon)
            
            if preprocessed_data is None:
                logger.error("Input preprocessing failed")
                return None
            
            # Run inference with timeout
            logger.info(f"Running GraphCast inference for {forecast_days} days")
            timeout = self.timeout_gpu if self.model_manager.device == "gpu" else self.timeout_cpu
            
            try:
                predictions = await asyncio.wait_for(
                    self._run_model_inference(preprocessed_data, forecast_days),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                logger.error(f"Inference timeout after {timeout}s")
                return None
            
            if predictions is None:
                logger.error("Model inference failed")
                return None
            
            # Postprocess outputs
            logger.info("Postprocessing model outputs")
            with profiler.profile_block("postprocess_outputs"):
                forecast_result = self._postprocess_outputs(
                    predictions, lat, lon, region_name, timestamp
                )
            
            # Calculate inference time
            inference_time_ms = int((time.time() - start_time) * 1000)
            
            if forecast_result:
                forecast_result.metadata.inference_time_ms = inference_time_ms
                logger.info(f"Inference completed in {inference_time_ms}ms")
            
            return forecast_result
            
        except Exception as e:
            logger.error(f"Inference pipeline failed: {e}", exc_info=True)
            return None
    
    def _get_region_name(self, lat: float, lon: float) -> Optional[str]:
        """
        Get region name for coordinates.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Region name or None if not in any region
        """
        for region_name, bounds in REGION_BOUNDARIES.items():
            if (bounds["lat_min"] <= lat <= bounds["lat_max"] and
                bounds["lon_min"] <= lon <= bounds["lon_max"]):
                return region_name
        return None
    
    def _preprocess_inputs(
        self,
        era5_data: "xr.Dataset",
        target_lat: float,
        target_lon: float
    ) -> Optional[Dict[str, Any]]:
        """
        Convert ERA5 data to GraphCast input format.
        
        This includes:
        - Converting XArray dataset to JAX arrays
        - Normalizing input variables to model expected ranges
        - Handling missing data with interpolation or default values
        - Reshaping data to match GraphCast input dimensions
        
        Args:
            era5_data: ERA5 dataset from fetcher
            target_lat: Target latitude for forecast
            target_lon: Target longitude for forecast
            
        Returns:
            Dictionary containing preprocessed data or None if preprocessing fails
        """
        try:
            if np is None or jnp is None:
                logger.error("NumPy or JAX not installed")
                return None
            
            # Extract variables from ERA5 dataset
            # Map ERA5 variable names to standard names
            variable_mapping = {
                't2m': 'temperature',
                'sp': 'pressure',
                'r': 'humidity',
                'u10': 'u_wind',
                'v10': 'v_wind'
            }
            
            extracted_data = {}
            
            for era5_var, standard_var in variable_mapping.items():
                if era5_var in era5_data.variables:
                    # Extract data as numpy array
                    data_array = era5_data[era5_var].values
                    
                    # Handle missing data
                    if np.isnan(data_array).any():
                        logger.warning(f"Missing data detected in {standard_var}, interpolating")
                        data_array = self._interpolate_missing_data(data_array)
                    
                    extracted_data[standard_var] = data_array
                else:
                    logger.error(f"Required variable {era5_var} not found in ERA5 data")
                    return None
            
            # Normalize variables to expected ranges
            normalized_data = self._normalize_variables(extracted_data)
            
            # Convert to JAX arrays
            jax_data = {
                key: jnp.array(value) for key, value in normalized_data.items()
            }
            
            # Get spatial coordinates
            if 'latitude' in era5_data.coords and 'longitude' in era5_data.coords:
                lats = era5_data.coords['latitude'].values
                lons = era5_data.coords['longitude'].values
            else:
                logger.error("Latitude/longitude coordinates not found in ERA5 data")
                return None
            
            # Find nearest grid point to target location
            lat_idx = np.argmin(np.abs(lats - target_lat))
            lon_idx = np.argmin(np.abs(lons - target_lon))
            
            preprocessed = {
                'data': jax_data,
                'coordinates': {
                    'latitude': lats,
                    'longitude': lons,
                    'target_lat_idx': lat_idx,
                    'target_lon_idx': lon_idx,
                    'target_lat': target_lat,
                    'target_lon': target_lon
                },
                'timestamp': era5_data.attrs.get('timestamp', datetime.utcnow()),
                'shape': list(jax_data['temperature'].shape)
            }
            
            logger.info(f"Preprocessed data shape: {preprocessed['shape']}")
            return preprocessed
            
        except Exception as e:
            logger.error(f"Error preprocessing inputs: {e}", exc_info=True)
            return None
    
    def _interpolate_missing_data(self, data: "np.ndarray") -> "np.ndarray":
        """
        Interpolate missing data (NaN values) using linear interpolation.
        
        Args:
            data: NumPy array with potential NaN values
            
        Returns:
            Array with NaN values interpolated
        """
        if not np.isnan(data).any():
            return data
        
        # Create a copy to avoid modifying original
        interpolated = data.copy()
        
        # Get mask of valid (non-NaN) values
        valid_mask = ~np.isnan(data)
        
        if not valid_mask.any():
            # All values are NaN, use default value (0)
            logger.warning("All values are NaN, using default value 0")
            return np.zeros_like(data)
        
        # For simplicity, replace NaN with mean of valid values
        # In production, more sophisticated interpolation could be used
        mean_value = np.nanmean(data)
        interpolated[~valid_mask] = mean_value
        
        return interpolated
    
    def _normalize_variables(self, data: Dict[str, "np.ndarray"]) -> Dict[str, "np.ndarray"]:
        """
        Normalize input variables to model expected ranges.
        
        GraphCast expects normalized inputs. This function applies
        standard normalization based on typical atmospheric ranges.
        
        Args:
            data: Dictionary of variable name to numpy array
            
        Returns:
            Dictionary of normalized arrays
        """
        # Normalization parameters (mean, std) for each variable
        # These are approximate values for ERA5 data
        normalization_params = {
            'temperature': {'mean': 273.15, 'std': 20.0},  # Kelvin
            'pressure': {'mean': 101325.0, 'std': 10000.0},  # Pascal
            'humidity': {'mean': 50.0, 'std': 30.0},  # Percent
            'u_wind': {'mean': 0.0, 'std': 5.0},  # m/s
            'v_wind': {'mean': 0.0, 'std': 5.0},  # m/s
        }
        
        normalized = {}
        
        for var_name, var_data in data.items():
            if var_name in normalization_params:
                params = normalization_params[var_name]
                # Z-score normalization: (x - mean) / std
                normalized[var_name] = (var_data - params['mean']) / params['std']
            else:
                # If no normalization params, keep as is
                normalized[var_name] = var_data
        
        return normalized
    
    async def _run_model_inference(
        self,
        preprocessed_data: Dict[str, Any],
        forecast_days: int
    ) -> Optional[Dict[str, Any]]:
        """
        Run GraphCast model inference with autoregressive rollout.
        
        This is a placeholder implementation. In production, this would:
        1. Load the actual GraphCast model
        2. Run autoregressive rollout (each step uses previous prediction)
        3. Generate predictions at 6-hour intervals
        
        Args:
            preprocessed_data: Preprocessed input data
            forecast_days: Number of days to forecast
            
        Returns:
            Dictionary containing model predictions or None if inference fails
        """
        try:
            # This is a placeholder implementation
            # In production, this would call the actual GraphCast model
            
            logger.info(f"Running autoregressive rollout for {forecast_days} days")
            
            # Calculate number of 6-hour steps (4 steps per day)
            num_steps = forecast_days * 4
            
            # Simulate inference (in production, this would be actual model execution)
            # For now, generate synthetic predictions
            predictions = self._generate_synthetic_predictions(
                preprocessed_data, num_steps
            )
            
            return predictions
            
        except Exception as e:
            logger.error(f"Model inference failed: {e}", exc_info=True)
            return None
    
    def _generate_synthetic_predictions(
        self,
        preprocessed_data: Dict[str, Any],
        num_steps: int
    ) -> Dict[str, Any]:
        """
        Generate synthetic predictions for testing.
        
        This is a placeholder that generates realistic-looking weather data.
        In production, this would be replaced with actual GraphCast model inference.
        
        Args:
            preprocessed_data: Preprocessed input data
            num_steps: Number of 6-hour time steps to predict
            
        Returns:
            Dictionary containing synthetic predictions
        """
        coords = preprocessed_data['coordinates']
        target_lat_idx = coords['target_lat_idx']
        target_lon_idx = coords['target_lon_idx']
        
        # Generate synthetic time series
        # Use simple patterns that look like weather data
        np.random.seed(42)  # For reproducibility
        
        # Temperature: sinusoidal pattern with noise (in Kelvin)
        base_temp = 298.15  # ~25°C
        temp_amplitude = 10.0
        temperatures = base_temp + temp_amplitude * np.sin(np.linspace(0, 2*np.pi, num_steps))
        temperatures += np.random.normal(0, 2, num_steps)
        
        # Precipitation: random with occasional spikes (in mm/6h)
        precipitation = np.random.exponential(2.0, num_steps)
        precipitation = np.clip(precipitation, 0, 50)
        
        # Humidity: correlated with precipitation (in %)
        humidity = 50 + 20 * np.sin(np.linspace(0, 2*np.pi, num_steps))
        humidity += precipitation * 0.5
        humidity = np.clip(humidity, 20, 100)
        
        # Wind components (in m/s)
        u_wind = np.random.normal(2.0, 3.0, num_steps)
        v_wind = np.random.normal(1.0, 3.0, num_steps)
        
        # Pressure: slowly varying (in Pa)
        pressure = 101325 + 1000 * np.sin(np.linspace(0, np.pi, num_steps))
        pressure += np.random.normal(0, 200, num_steps)
        
        predictions = {
            'temperature': temperatures,
            'precipitation': precipitation,
            'humidity': humidity,
            'u_wind': u_wind,
            'v_wind': v_wind,
            'pressure': pressure,
            'num_steps': num_steps,
            'coordinates': coords,
            'timestamp': preprocessed_data['timestamp']
        }
        
        return predictions
    
    def _postprocess_outputs(
        self,
        predictions: Dict[str, Any],
        lat: float,
        lon: float,
        region_name: str,
        era5_timestamp: datetime
    ) -> Optional[ForecastResult]:
        """
        Convert model outputs to structured forecast result.
        
        This includes:
        - Extracting weather variables from predictions
        - Denormalizing predictions to physical units
        - Converting JAX arrays back to standard Python types
        - Aggregating 6-hour predictions to daily values
        
        Args:
            predictions: Model prediction dictionary
            lat: Target latitude
            lon: Target longitude
            region_name: Region name
            era5_timestamp: Timestamp of ERA5 initial conditions
            
        Returns:
            ForecastResult or None if postprocessing fails
        """
        try:
            # Extract predictions
            temperatures = predictions['temperature']
            precipitation = predictions['precipitation']
            humidity = predictions['humidity']
            u_wind = predictions['u_wind']
            v_wind = predictions['v_wind']
            num_steps = predictions['num_steps']
            
            # Aggregate 6-hour predictions to daily values using vectorized operations
            num_days = num_steps // 4
            
            # Reshape arrays for efficient daily aggregation
            temps_reshaped = temperatures[:num_days*4].reshape(num_days, 4)
            precip_reshaped = precipitation[:num_days*4].reshape(num_days, 4)
            humidity_reshaped = humidity[:num_days*4].reshape(num_days, 4)
            u_wind_reshaped = u_wind[:num_days*4].reshape(num_days, 4)
            v_wind_reshaped = v_wind[:num_days*4].reshape(num_days, 4)
            
            # Vectorized daily aggregates
            temp_max_c = np.max(temps_reshaped, axis=1) - 273.15  # Convert K to C
            temp_min_c = np.min(temps_reshaped, axis=1) - 273.15
            temp_mean_c = np.mean(temps_reshaped, axis=1) - 273.15
            precip_mm = np.sum(precip_reshaped, axis=1)
            humidity_pct = np.mean(humidity_reshaped, axis=1)
            
            # Calculate wind speed from components - vectorized
            wind_speeds = np.sqrt(u_wind_reshaped**2 + v_wind_reshaped**2)
            wind_speed_ms = np.mean(wind_speeds, axis=1)
            
            # Pre-calculate confidence scores
            confidence_scores = np.maximum(0.5, 1.0 - (np.arange(num_days) * 0.05))
            
            daily_forecasts = []
            
            for day in range(num_days):
                # Use pre-calculated values
                temp_max_val = float(temp_max_c[day])
                temp_min_val = float(temp_min_c[day])
                temp_mean_val = float(temp_mean_c[day])
                precip_val = float(precip_mm[day])
                humidity_val = float(humidity_pct[day])
                wind_speed_val = float(wind_speed_ms[day])
                
                # Create raw weather data
                raw_weather = RawWeatherData(
                    precipitation_mm=precip_val,
                    temp_max_c=temp_max_val,
                    temp_min_c=temp_min_val,
                    temp_mean_c=temp_mean_val,
                    humidity_percent=humidity_val,
                    wind_speed_ms=wind_speed_val
                )
                
                # Calculate forecast date
                forecast_date = era5_timestamp + timedelta(days=day + 1)
                
                # Placeholder values for agricultural metrics
                # These will be calculated by the agricultural metrics calculator
                rain_risk = 0.0
                temp_extreme = 0.0
                soil_moisture_proxy = 0.0
                
                # Use pre-calculated confidence score
                confidence_score = float(confidence_scores[day])
                
                forecast_day = ForecastDay(
                    date=forecast_date,
                    rain_risk=rain_risk,
                    temp_extreme=temp_extreme,
                    soil_moisture_proxy=soil_moisture_proxy,
                    confidence_score=confidence_score,
                    raw_weather=raw_weather
                )
                
                daily_forecasts.append(forecast_day)
            
            # Create location
            location = Location(
                latitude=lat,
                longitude=lon,
                region=REGION_BOUNDARIES[region_name]["name"]
            )
            
            # Create metadata
            metadata = ForecastMetadata(
                model_version=self.model_manager.get_model_info()["version"],
                generated_at=datetime.utcnow(),
                cache_hit=False,
                inference_time_ms=0,  # Will be set by caller
                era5_timestamp=era5_timestamp
            )
            
            # Create forecast result
            result = ForecastResult(
                location=location,
                forecast_days=daily_forecasts,
                metadata=metadata
            )
            
            logger.info(f"Postprocessed {len(daily_forecasts)} days of forecast data")
            return result
            
        except Exception as e:
            logger.error(f"Error postprocessing outputs: {e}", exc_info=True)
            return None
