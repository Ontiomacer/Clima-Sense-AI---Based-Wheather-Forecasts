"""
Integration tests for GraphCast Inference Pipeline
Tests end-to-end inference flow, output format, and timeout handling.
"""

import pytest
import asyncio
import time
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import numpy as np
    import xarray as xr
except ImportError:
    pytest.skip("NumPy or XArray not installed", allow_module_level=True)

from graphcast.inference_pipeline import (
    GraphCastInferencePipeline,
    ForecastResult,
    Location,
    ForecastDay,
    RawWeatherData
)
from graphcast.model_manager import GraphCastModelManager
from graphcast.era5_fetcher import ERA5DataFetcher
from graphcast.config import REGION_BOUNDARIES


class MockERA5DataFetcher(ERA5DataFetcher):
    """Mock ERA5 data fetcher for testing"""
    
    async def fetch_initial_conditions(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ):
        """Return mock ERA5 data"""
        # Create synthetic ERA5 dataset
        lats = np.linspace(lat_min, lat_max, 10)
        lons = np.linspace(lon_min, lon_max, 10)
        
        # Create data arrays
        temp_data = np.random.uniform(280, 310, (10, 10))  # Kelvin
        pressure_data = np.random.uniform(95000, 105000, (10, 10))  # Pascal
        humidity_data = np.random.uniform(30, 90, (10, 10))  # Percent
        u_wind_data = np.random.uniform(-5, 5, (10, 10))  # m/s
        v_wind_data = np.random.uniform(-5, 5, (10, 10))  # m/s
        
        # Create xarray dataset
        dataset = xr.Dataset(
            {
                't2m': (['latitude', 'longitude'], temp_data),
                'sp': (['latitude', 'longitude'], pressure_data),
                'r': (['latitude', 'longitude'], humidity_data),
                'u10': (['latitude', 'longitude'], u_wind_data),
                'v10': (['latitude', 'longitude'], v_wind_data),
            },
            coords={
                'latitude': lats,
                'longitude': lons,
            },
            attrs={'timestamp': timestamp}
        )
        
        return dataset


@pytest.fixture
def mock_model_manager():
    """Create mock model manager"""
    manager = GraphCastModelManager(device="cpu")
    # Simulate loaded model
    manager._is_loaded = True
    manager.model = {"loaded": True, "device": "cpu"}
    return manager


@pytest.fixture
def mock_data_fetcher(tmp_path):
    """Create mock data fetcher"""
    return MockERA5DataFetcher(cache_dir=str(tmp_path / "era5_cache"))


@pytest.fixture
def inference_pipeline(mock_model_manager, mock_data_fetcher):
    """Create inference pipeline with mocks"""
    return GraphCastInferencePipeline(mock_model_manager, mock_data_fetcher)


@pytest.mark.asyncio
async def test_end_to_end_inference(inference_pipeline):
    """Test complete inference flow from input to output"""
    # Use coordinates within Maharashtra bounds
    lat = 18.5
    lon = 73.8
    forecast_days = 5
    
    # Run inference
    result = await inference_pipeline.run_inference(lat, lon, forecast_days)
    
    # Verify result is not None
    assert result is not None, "Inference should return a result"
    
    # Verify result type
    assert isinstance(result, ForecastResult), "Result should be ForecastResult"
    
    # Verify location
    assert isinstance(result.location, Location)
    assert result.location.latitude == lat
    assert result.location.longitude == lon
    assert result.location.region is not None
    
    # Verify forecast days
    assert len(result.forecast_days) == forecast_days
    
    for day in result.forecast_days:
        assert isinstance(day, ForecastDay)
        assert isinstance(day.date, datetime)
        assert isinstance(day.raw_weather, RawWeatherData)
        
        # Verify confidence score is in valid range
        assert 0.0 <= day.confidence_score <= 1.0
    
    # Verify metadata
    assert result.metadata is not None
    assert result.metadata.model_version is not None
    assert result.metadata.inference_time_ms >= 0
    
    print(f"✓ End-to-end inference test passed")
    print(f"  Generated {len(result.forecast_days)} days of forecast")
    print(f"  Inference time: {result.metadata.inference_time_ms}ms")


@pytest.mark.asyncio
async def test_output_format_matches_specification(inference_pipeline):
    """Verify output format matches the design specification"""
    lat = 19.0
    lon = 74.0
    
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=3)
    
    assert result is not None
    
    # Check location structure
    assert hasattr(result.location, 'latitude')
    assert hasattr(result.location, 'longitude')
    assert hasattr(result.location, 'region')
    
    # Check forecast day structure
    for day in result.forecast_days:
        # Check required fields
        assert hasattr(day, 'date')
        assert hasattr(day, 'rain_risk')
        assert hasattr(day, 'temp_extreme')
        assert hasattr(day, 'soil_moisture_proxy')
        assert hasattr(day, 'confidence_score')
        assert hasattr(day, 'raw_weather')
        
        # Check raw weather data structure
        raw = day.raw_weather
        assert hasattr(raw, 'precipitation_mm')
        assert hasattr(raw, 'temp_max_c')
        assert hasattr(raw, 'temp_min_c')
        assert hasattr(raw, 'temp_mean_c')
        assert hasattr(raw, 'humidity_percent')
        assert hasattr(raw, 'wind_speed_ms')
        
        # Verify data types and ranges
        assert isinstance(day.date, datetime)
        assert isinstance(day.confidence_score, float)
        assert isinstance(raw.precipitation_mm, float)
        assert isinstance(raw.temp_max_c, float)
        assert isinstance(raw.temp_min_c, float)
        assert isinstance(raw.humidity_percent, float)
        
        # Verify reasonable value ranges
        assert -50 <= raw.temp_min_c <= 60, "Temperature should be in reasonable range"
        assert -50 <= raw.temp_max_c <= 60
        assert raw.temp_min_c <= raw.temp_max_c, "Min temp should be <= max temp"
        assert 0 <= raw.humidity_percent <= 100, "Humidity should be 0-100%"
        assert raw.precipitation_mm >= 0, "Precipitation should be non-negative"
        assert raw.wind_speed_ms >= 0, "Wind speed should be non-negative"
    
    # Check metadata structure
    assert hasattr(result.metadata, 'model_version')
    assert hasattr(result.metadata, 'generated_at')
    assert hasattr(result.metadata, 'cache_hit')
    assert hasattr(result.metadata, 'inference_time_ms')
    assert hasattr(result.metadata, 'era5_timestamp')
    
    print(f"✓ Output format validation passed")


@pytest.mark.asyncio
async def test_inference_with_max_forecast_days(inference_pipeline):
    """Test inference with maximum forecast days (10)"""
    lat = 20.0
    lon = 75.0
    
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=10)
    
    assert result is not None
    assert len(result.forecast_days) == 10
    
    # Verify dates are sequential
    for i in range(1, len(result.forecast_days)):
        prev_date = result.forecast_days[i-1].date
        curr_date = result.forecast_days[i].date
        
        # Dates should be 1 day apart
        delta = (curr_date - prev_date).days
        assert delta == 1, f"Dates should be sequential, got {delta} day gap"
    
    print(f"✓ Max forecast days test passed")


@pytest.mark.asyncio
async def test_inference_limits_excessive_forecast_days(inference_pipeline):
    """Test that excessive forecast days are limited to maximum"""
    lat = 19.5
    lon = 74.5
    
    # Request more than maximum
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=15)
    
    assert result is not None
    # Should be limited to max (10)
    assert len(result.forecast_days) <= 10
    
    print(f"✓ Forecast days limiting test passed")


@pytest.mark.asyncio
async def test_inference_with_invalid_coordinates(inference_pipeline):
    """Test inference with coordinates outside supported region"""
    # Coordinates outside Maharashtra bounds
    lat = 30.0  # Too far north
    lon = 80.0  # Too far east
    
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=5)
    
    # Should return None for invalid coordinates
    assert result is None
    
    print(f"✓ Invalid coordinates test passed")


@pytest.mark.asyncio
async def test_confidence_score_decreases_with_horizon(inference_pipeline):
    """Test that confidence scores decrease with forecast horizon"""
    lat = 19.0
    lon = 74.0
    
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=10)
    
    assert result is not None
    
    # Extract confidence scores
    confidence_scores = [day.confidence_score for day in result.forecast_days]
    
    # Verify scores are decreasing (or at least non-increasing)
    for i in range(1, len(confidence_scores)):
        assert confidence_scores[i] <= confidence_scores[i-1], \
            f"Confidence should decrease with forecast horizon"
    
    # First day should have higher confidence than last day
    assert confidence_scores[0] > confidence_scores[-1]
    
    print(f"✓ Confidence score degradation test passed")


@pytest.mark.asyncio
async def test_preprocessing_handles_missing_data(inference_pipeline):
    """Test that preprocessing handles missing data correctly"""
    # Create ERA5 data with NaN values
    lats = np.linspace(18.0, 21.0, 10)
    lons = np.linspace(73.0, 77.0, 10)
    
    # Create data with some NaN values
    temp_data = np.random.uniform(280, 310, (10, 10))
    temp_data[2:4, 3:5] = np.nan  # Insert NaN values
    
    dataset = xr.Dataset(
        {
            't2m': (['latitude', 'longitude'], temp_data),
            'sp': (['latitude', 'longitude'], np.random.uniform(95000, 105000, (10, 10))),
            'r': (['latitude', 'longitude'], np.random.uniform(30, 90, (10, 10))),
            'u10': (['latitude', 'longitude'], np.random.uniform(-5, 5, (10, 10))),
            'v10': (['latitude', 'longitude'], np.random.uniform(-5, 5, (10, 10))),
        },
        coords={'latitude': lats, 'longitude': lons},
        attrs={'timestamp': datetime.utcnow()}
    )
    
    # Test preprocessing
    preprocessed = inference_pipeline._preprocess_inputs(dataset, 19.0, 74.0)
    
    assert preprocessed is not None
    
    # Verify no NaN values in preprocessed data
    for var_name, var_data in preprocessed['data'].items():
        assert not np.isnan(var_data).any(), f"Variable {var_name} should not contain NaN"
    
    print(f"✓ Missing data handling test passed")


@pytest.mark.asyncio
async def test_inference_time_measurement(inference_pipeline):
    """Test that inference time is measured correctly"""
    lat = 19.0
    lon = 74.0
    
    start_time = time.time()
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=5)
    elapsed_time = (time.time() - start_time) * 1000  # Convert to ms
    
    assert result is not None
    assert result.metadata.inference_time_ms > 0
    
    # Inference time should be reasonably close to actual elapsed time
    # Allow for some overhead
    assert result.metadata.inference_time_ms <= elapsed_time * 1.5
    
    print(f"✓ Inference time measurement test passed")
    print(f"  Measured: {result.metadata.inference_time_ms}ms")
    print(f"  Actual: {elapsed_time:.0f}ms")


@pytest.mark.asyncio
async def test_daily_aggregation_from_6hour_predictions(inference_pipeline):
    """Test that 6-hour predictions are correctly aggregated to daily values"""
    lat = 19.0
    lon = 74.0
    
    result = await inference_pipeline.run_inference(lat, lon, forecast_days=3)
    
    assert result is not None
    
    for day in result.forecast_days:
        raw = day.raw_weather
        
        # Verify temperature relationships
        assert raw.temp_min_c <= raw.temp_mean_c <= raw.temp_max_c, \
            "Temperature mean should be between min and max"
        
        # Verify all values are finite
        assert np.isfinite(raw.precipitation_mm)
        assert np.isfinite(raw.temp_max_c)
        assert np.isfinite(raw.temp_min_c)
        assert np.isfinite(raw.temp_mean_c)
        assert np.isfinite(raw.humidity_percent)
        assert np.isfinite(raw.wind_speed_ms)
    
    print(f"✓ Daily aggregation test passed")


def test_normalization_parameters():
    """Test that normalization parameters are reasonable"""
    from graphcast.inference_pipeline import GraphCastInferencePipeline
    from graphcast.model_manager import GraphCastModelManager
    from graphcast.era5_fetcher import ERA5DataFetcher
    
    # Create pipeline
    manager = GraphCastModelManager(device="cpu")
    fetcher = ERA5DataFetcher()
    pipeline = GraphCastInferencePipeline(manager, fetcher)
    
    # Test data
    test_data = {
        'temperature': np.array([273.15, 283.15, 293.15]),  # 0°C, 10°C, 20°C
        'pressure': np.array([101325, 100000, 102000]),
        'humidity': np.array([50, 60, 70]),
        'u_wind': np.array([0, 5, -5]),
        'v_wind': np.array([0, 3, -3]),
    }
    
    # Normalize
    normalized = pipeline._normalize_variables(test_data)
    
    # Verify normalization produces reasonable values
    for var_name, var_data in normalized.items():
        # Normalized values should typically be in range [-5, 5] for z-score
        assert np.abs(var_data).max() < 10, \
            f"Normalized {var_name} values seem unreasonable"
    
    print(f"✓ Normalization parameters test passed")


if __name__ == "__main__":
    # Run tests
    print("Running GraphCast Inference Pipeline Integration Tests\n")
    
    # Create fixtures
    import tempfile
    tmp_dir = tempfile.mkdtemp()
    
    manager = GraphCastModelManager(device="cpu")
    manager._is_loaded = True
    manager.model = {"loaded": True, "device": "cpu"}
    
    fetcher = MockERA5DataFetcher(cache_dir=tmp_dir)
    pipeline = GraphCastInferencePipeline(manager, fetcher)
    
    # Run async tests
    async def run_tests():
        await test_end_to_end_inference(pipeline)
        await test_output_format_matches_specification(pipeline)
        await test_inference_with_max_forecast_days(pipeline)
        await test_inference_limits_excessive_forecast_days(pipeline)
        await test_inference_with_invalid_coordinates(pipeline)
        await test_confidence_score_decreases_with_horizon(pipeline)
        await test_preprocessing_handles_missing_data(pipeline)
        await test_inference_time_measurement(pipeline)
        await test_daily_aggregation_from_6hour_predictions(pipeline)
    
    asyncio.run(run_tests())
    
    # Run sync tests
    test_normalization_parameters()
    
    print("\n✅ All integration tests passed!")
