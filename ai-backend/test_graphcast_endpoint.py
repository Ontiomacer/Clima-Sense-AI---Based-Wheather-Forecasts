"""
Pytest tests for GraphCast forecast endpoint
Run with: pytest test_graphcast_endpoint.py -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from graphcast.data_models import (
    ForecastResult, ForecastDay, ForecastMetadata, 
    Location, RawWeatherData
)

# Import the FastAPI app
from main import app

# Create test client
client = TestClient(app)


def create_mock_forecast_result(lat: float, lon: float, days: int = 10) -> ForecastResult:
    """Create a mock ForecastResult for testing"""
    location = Location(
        latitude=lat,
        longitude=lon,
        region="Pune, Maharashtra"
    )
    
    forecast_days = []
    base_date = datetime.now()
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        raw_weather = RawWeatherData(
            precipitation_mm=5.0 + i * 2.0,
            temp_max_c=32.0 + i * 0.5,
            temp_min_c=22.0 + i * 0.3,
            temp_mean_c=27.0 + i * 0.4,
            humidity_percent=65.0 + i * 1.5,
            wind_speed_ms=3.5 + i * 0.2
        )
        
        forecast_day = ForecastDay(
            date=date,
            rain_risk=30.0 + i * 5.0,
            temp_extreme=20.0 + i * 3.0,
            soil_moisture_proxy=60.0 - i * 2.0,
            confidence_score=0.95 - i * 0.05,
            raw_weather=raw_weather
        )
        
        forecast_days.append(forecast_day)
    
    metadata = ForecastMetadata(
        model_version="graphcast-v1.0",
        generated_at=datetime.now(),
        cache_hit=False,
        inference_time_ms=5000,
        era5_timestamp=datetime.now()
    )
    
    return ForecastResult(
        location=location,
        forecast_days=forecast_days,
        metadata=metadata
    )


class TestGraphCastForecastEndpoint:
    """Test suite for /api/graphcast_forecast endpoint"""
    
    def test_valid_forecast_request(self):
        """Test successful forecast request with valid coordinates"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Check response status (200 for success, 503 if system not initialized)
        assert response.status_code in [200, 503], \
            f"Expected 200 or 503, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            assert "location" in data
            assert "forecast" in data
            assert "metadata" in data
            
            # Validate location
            assert data["location"]["latitude"] == request_data["latitude"]
            assert data["location"]["longitude"] == request_data["longitude"]
            assert "region" in data["location"]
            
            # Validate forecast array
            assert isinstance(data["forecast"], list)
            assert len(data["forecast"]) <= request_data["forecast_days"]
            
            # Validate first forecast day structure
            if len(data["forecast"]) > 0:
                first_day = data["forecast"][0]
                assert "date" in first_day
                assert "rain_risk" in first_day
                assert "temp_extreme" in first_day
                assert "soil_moisture_proxy" in first_day
                assert "confidence_score" in first_day
                assert "raw_data" in first_day
                
                # Validate metric ranges
                assert 0 <= first_day["rain_risk"] <= 100
                assert 0 <= first_day["temp_extreme"] <= 100
                assert 0 <= first_day["soil_moisture_proxy"] <= 100
                assert 0 <= first_day["confidence_score"] <= 1
                
                # Validate raw data
                raw_data = first_day["raw_data"]
                assert "precipitation_mm" in raw_data
                assert "temp_max_c" in raw_data
                assert "temp_min_c" in raw_data
                assert "humidity_percent" in raw_data
            
            # Validate metadata
            assert "model_version" in data["metadata"]
            assert "generated_at" in data["metadata"]
            assert "cache_hit" in data["metadata"]
            assert "inference_time_ms" in data["metadata"]
            assert isinstance(data["metadata"]["cache_hit"], bool)
            assert isinstance(data["metadata"]["inference_time_ms"], int)
    
    def test_invalid_coordinates_outside_bounds(self):
        """Test error response for coordinates outside Maharashtra bounds"""
        # Test coordinates outside Maharashtra (New Delhi)
        request_data = {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (Pydantic validation) or 400 (endpoint validation)
        assert response.status_code in [400, 422]
        
        data = response.json()
        assert "error" in data or "detail" in data
        
        # Error message should mention coordinate bounds or validation
        error_msg = str(data).lower()
        assert "latitude" in error_msg or "longitude" in error_msg or "bound" in error_msg or "maharashtra" in error_msg
    
    def test_invalid_latitude_too_low(self):
        """Test error response for latitude below minimum"""
        request_data = {
            "latitude": 17.5,  # Below 18.0 minimum
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422]
    
    def test_invalid_latitude_too_high(self):
        """Test error response for latitude above maximum"""
        request_data = {
            "latitude": 21.5,  # Above 21.0 maximum
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422]
    
    def test_invalid_longitude_too_low(self):
        """Test error response for longitude below minimum"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 72.5,  # Below 73.0 minimum
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422]
    
    def test_invalid_longitude_too_high(self):
        """Test error response for longitude above maximum"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 77.5,  # Above 77.0 maximum
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error) or 400
        assert response.status_code in [400, 422]
    
    def test_invalid_forecast_days_too_high(self):
        """Test error response for forecast_days above maximum"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 15  # Above 10 maximum
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_invalid_forecast_days_zero(self):
        """Test error response for forecast_days of zero"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 0
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 422 (validation error)
        assert response.status_code == 422
    
    def test_default_forecast_days(self):
        """Test that forecast_days defaults to 10 when not provided"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should accept request (200 or 503)
        assert response.status_code in [200, 503]
        
        if response.status_code == 200:
            data = response.json()
            # Should return up to 10 days
            assert len(data["forecast"]) <= 10
    
    def test_caching_behavior(self):
        """Test that second request for same location uses cache"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        # First request
        response1 = client.post("/api/graphcast_forecast", json=request_data)
        
        if response1.status_code != 200:
            pytest.skip("GraphCast system not available")
        
        data1 = response1.json()
        cache_hit_1 = data1["metadata"]["cache_hit"]
        time_1 = data1["metadata"]["inference_time_ms"]
        
        # Second request (should hit cache)
        response2 = client.post("/api/graphcast_forecast", json=request_data)
        
        assert response2.status_code == 200
        data2 = response2.json()
        cache_hit_2 = data2["metadata"]["cache_hit"]
        time_2 = data2["metadata"]["inference_time_ms"]
        
        # Second request should be cached
        assert cache_hit_2 == True, "Second request should hit cache"
        
        # Cached response should be faster
        assert time_2 < time_1 or cache_hit_1 == True, \
            "Cached response should be faster than initial inference"
    
    def test_different_locations_no_cache_collision(self):
        """Test that different locations don't share cache"""
        request_data_1 = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        request_data_2 = {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "forecast_days": 10
        }
        
        # Request for location 1
        response1 = client.post("/api/graphcast_forecast", json=request_data_1)
        
        if response1.status_code != 200:
            pytest.skip("GraphCast system not available")
        
        # Request for location 2
        response2 = client.post("/api/graphcast_forecast", json=request_data_2)
        
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Locations should be different
        assert data1["location"]["latitude"] != data2["location"]["latitude"]
        assert data1["location"]["longitude"] != data2["location"]["longitude"]
    
    def test_shorter_forecast_period(self):
        """Test requesting fewer than 10 days"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 5
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        if response.status_code != 200:
            pytest.skip("GraphCast system not available")
        
        data = response.json()
        
        # Should return exactly 5 days or fewer
        assert len(data["forecast"]) <= 5
    
    def test_response_format_matches_specification(self):
        """Test that response format exactly matches API specification"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        if response.status_code != 200:
            pytest.skip("GraphCast system not available")
        
        data = response.json()
        
        # Top-level keys
        assert set(data.keys()) == {"location", "forecast", "metadata"}
        
        # Location keys
        assert set(data["location"].keys()) == {"latitude", "longitude", "region"}
        
        # Forecast array
        assert isinstance(data["forecast"], list)
        
        if len(data["forecast"]) > 0:
            # Forecast day keys
            forecast_day = data["forecast"][0]
            expected_keys = {
                "date", "rain_risk", "temp_extreme", 
                "soil_moisture_proxy", "confidence_score", "raw_data"
            }
            assert set(forecast_day.keys()) == expected_keys
            
            # Raw data keys
            raw_data = forecast_day["raw_data"]
            expected_raw_keys = {
                "precipitation_mm", "temp_max_c", 
                "temp_min_c", "humidity_percent"
            }
            assert set(raw_data.keys()) == expected_raw_keys
        
        # Metadata keys
        expected_metadata_keys = {
            "model_version", "generated_at", 
            "cache_hit", "inference_time_ms"
        }
        assert set(data["metadata"].keys()) == expected_metadata_keys
    
    def test_missing_required_fields(self):
        """Test error response when required fields are missing"""
        # Missing latitude
        request_data = {
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        assert response.status_code == 422
        
        # Missing longitude
        request_data = {
            "latitude": 18.5204,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        assert response.status_code == 422
    
    def test_invalid_data_types(self):
        """Test error response for invalid data types"""
        # String instead of float for latitude
        request_data = {
            "latitude": "invalid",
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        assert response.status_code == 422
        
        # String instead of int for forecast_days
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": "invalid"
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        assert response.status_code == 422
    
    @patch('main.graphcast_initialized', False)
    def test_graphcast_not_initialized(self):
        """Test error response when GraphCast system is not initialized"""
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 503 Service Unavailable
        assert response.status_code == 503
        
        data = response.json()
        error_msg = data.get("error", data.get("detail", "")).lower()
        assert "graphcast" in error_msg or "unavailable" in error_msg
    
    def test_edge_case_boundary_coordinates(self):
        """Test coordinates exactly at Maharashtra boundaries"""
        # Test all four corners of the boundary
        boundary_coords = [
            (18.0, 73.0),  # Southwest corner
            (18.0, 77.0),  # Southeast corner
            (21.0, 73.0),  # Northwest corner
            (21.0, 77.0),  # Northeast corner
        ]
        
        for lat, lon in boundary_coords:
            request_data = {
                "latitude": lat,
                "longitude": lon,
                "forecast_days": 5
            }
            
            response = client.post("/api/graphcast_forecast", json=request_data)
            
            # Should accept boundary coordinates (200 or 503)
            assert response.status_code in [200, 503], \
                f"Boundary coordinates ({lat}, {lon}) should be valid"


class TestGraphCastErrorHandling:
    """Test suite for GraphCast error handling scenarios"""
    
    @patch('main.graphcast_inference_pipeline')
    def test_era5_data_unavailable_error(self, mock_pipeline):
        """Test error handling when ERA5 data is unavailable"""
        # Mock inference pipeline to raise ERA5 error
        mock_pipeline.run_inference = AsyncMock(
            side_effect=Exception("ERA5 data fetch failed")
        )
        
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 503 with retry-after header
        if response.status_code == 503:
            assert "retry-after" in response.headers or "Retry-After" in response.headers
    
    @patch('main.graphcast_inference_pipeline')
    def test_model_inference_timeout_error(self, mock_pipeline):
        """Test error handling when model inference times out"""
        # Mock inference pipeline to raise timeout error
        mock_pipeline.run_inference = AsyncMock(
            side_effect=Exception("Inference timeout exceeded")
        )
        
        request_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        response = client.post("/api/graphcast_forecast", json=request_data)
        
        # Should return 500 Internal Server Error
        assert response.status_code in [500, 503]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])