"""
End-to-End Integration Tests for GraphCast Integration
Tests complete user flows, API integration, error handling, and caching behavior.

Run with: pytest test_e2e_integration.py -v
"""

import pytest
import requests
import time
from datetime import datetime
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
PUNE_COORDS = {"latitude": 18.5204, "longitude": 73.8567}
MUMBAI_COORDS = {"latitude": 19.0760, "longitude": 72.8777}
INVALID_COORDS = {"latitude": 28.6139, "longitude": 77.2090}  # New Delhi


class TestForecastGenerationFlow:
    """Test suite for subtask 15.1: Test forecast generation flow"""
    
    def test_forecast_request_pune_coordinates(self):
        """Make API request to /api/graphcast_forecast with Pune coordinates"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        # Should return 200 (success) or 503 (service unavailable)
        assert response.status_code in [200, 503], \
            f"Expected 200 or 503, got {response.status_code}: {response.text}"
        
        if response.status_code == 503:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify response structure
        assert "location" in data, "Response should contain 'location'"
        assert "forecast" in data, "Response should contain 'forecast'"
        assert "metadata" in data, "Response should contain 'metadata'"
        
        print(f"✓ Successfully received forecast for Pune")
        print(f"  Location: {data['location']['region']}")
        print(f"  Forecast days: {len(data['forecast'])}")
    
    def test_response_contains_10_days_forecast(self):
        """Verify response contains 10 days of forecast data"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify forecast array length
        assert isinstance(data["forecast"], list), "Forecast should be a list"
        assert len(data["forecast"]) == 10, \
            f"Expected 10 forecast days, got {len(data['forecast'])}"
        
        # Verify each day has required fields
        for i, day in enumerate(data["forecast"]):
            assert "date" in day, f"Day {i} missing 'date'"
            assert "rain_risk" in day, f"Day {i} missing 'rain_risk'"
            assert "temp_extreme" in day, f"Day {i} missing 'temp_extreme'"
            assert "soil_moisture_proxy" in day, f"Day {i} missing 'soil_moisture_proxy'"
            assert "confidence_score" in day, f"Day {i} missing 'confidence_score'"
            assert "raw_data" in day, f"Day {i} missing 'raw_data'"
        
        print(f"✓ Response contains all 10 forecast days with required fields")
    
    def test_agricultural_metrics_within_expected_ranges(self):
        """Check agricultural metrics are within expected ranges"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Check each forecast day
        for i, day in enumerate(data["forecast"]):
            # Rain risk: 0-100
            assert 0 <= day["rain_risk"] <= 100, \
                f"Day {i}: rain_risk {day['rain_risk']} out of range [0, 100]"
            
            # Temperature extreme: 0-100
            assert 0 <= day["temp_extreme"] <= 100, \
                f"Day {i}: temp_extreme {day['temp_extreme']} out of range [0, 100]"
            
            # Soil moisture proxy: 0-100
            assert 0 <= day["soil_moisture_proxy"] <= 100, \
                f"Day {i}: soil_moisture_proxy {day['soil_moisture_proxy']} out of range [0, 100]"
            
            # Confidence score: 0-1
            assert 0 <= day["confidence_score"] <= 1, \
                f"Day {i}: confidence_score {day['confidence_score']} out of range [0, 1]"
            
            # Raw data validation
            raw = day["raw_data"]
            assert raw["precipitation_mm"] >= 0, \
                f"Day {i}: precipitation cannot be negative"
            assert -50 <= raw["temp_max_c"] <= 60, \
                f"Day {i}: temp_max_c {raw['temp_max_c']} out of reasonable range"
            assert -50 <= raw["temp_min_c"] <= 60, \
                f"Day {i}: temp_min_c {raw['temp_min_c']} out of reasonable range"
            assert raw["temp_min_c"] <= raw["temp_max_c"], \
                f"Day {i}: temp_min should be <= temp_max"
            assert 0 <= raw["humidity_percent"] <= 100, \
                f"Day {i}: humidity_percent {raw['humidity_percent']} out of range [0, 100]"
        
        print(f"✓ All agricultural metrics within expected ranges")
        print(f"  Rain risk: 0-100 ✓")
        print(f"  Temp extreme: 0-100 ✓")
        print(f"  Soil moisture: 0-100 ✓")
        print(f"  Confidence: 0-1 ✓")
    
    def test_metadata_includes_cache_hit_and_inference_time(self):
        """Verify metadata includes cache_hit and inference_time_ms"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        metadata = data["metadata"]
        
        # Verify required metadata fields
        assert "cache_hit" in metadata, "Metadata missing 'cache_hit'"
        assert "inference_time_ms" in metadata, "Metadata missing 'inference_time_ms'"
        assert "model_version" in metadata, "Metadata missing 'model_version'"
        assert "generated_at" in metadata, "Metadata missing 'generated_at'"
        
        # Verify data types
        assert isinstance(metadata["cache_hit"], bool), \
            "cache_hit should be boolean"
        assert isinstance(metadata["inference_time_ms"], (int, float)), \
            "inference_time_ms should be numeric"
        assert metadata["inference_time_ms"] >= 0, \
            "inference_time_ms should be non-negative"
        
        print(f"✓ Metadata contains all required fields")
        print(f"  cache_hit: {metadata['cache_hit']}")
        print(f"  inference_time_ms: {metadata['inference_time_ms']}")
        print(f"  model_version: {metadata['model_version']}")


class TestFrontendVisualization:
    """Test suite for subtask 15.2: Test frontend visualization"""
    
    def test_api_response_format_for_heatmap(self):
        """Verify API response format is suitable for heatmap rendering"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify location data for map positioning
        location = data["location"]
        assert "latitude" in location
        assert "longitude" in location
        assert isinstance(location["latitude"], (int, float))
        assert isinstance(location["longitude"], (int, float))
        
        # Verify forecast data has metrics for heatmap
        for day in data["forecast"]:
            # These metrics should be available for heatmap visualization
            assert "rain_risk" in day
            assert "temp_extreme" in day
            assert "soil_moisture_proxy" in day
            assert "date" in day
            
            # Verify metrics are numeric
            assert isinstance(day["rain_risk"], (int, float))
            assert isinstance(day["temp_extreme"], (int, float))
            assert isinstance(day["soil_moisture_proxy"], (int, float))
        
        print(f"✓ API response format suitable for heatmap rendering")
    
    def test_api_response_format_for_metrics_table(self):
        """Verify API response format is suitable for metrics table display"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify forecast array is suitable for table display
        assert isinstance(data["forecast"], list)
        assert len(data["forecast"]) > 0
        
        for i, day in enumerate(data["forecast"]):
            # Table columns
            assert "date" in day, f"Day {i} missing date for table"
            assert "rain_risk" in day, f"Day {i} missing rain_risk for table"
            assert "temp_extreme" in day, f"Day {i} missing temp_extreme for table"
            assert "soil_moisture_proxy" in day, f"Day {i} missing soil_moisture for table"
            assert "confidence_score" in day, f"Day {i} missing confidence for table"
            
            # Expandable row data
            assert "raw_data" in day, f"Day {i} missing raw_data for expandable row"
            raw = day["raw_data"]
            assert "precipitation_mm" in raw
            assert "temp_max_c" in raw
            assert "temp_min_c" in raw
            assert "humidity_percent" in raw
        
        print(f"✓ API response format suitable for metrics table display")
    
    def test_date_selection_data_availability(self):
        """Test that data is available for date selection functionality"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify dates are sequential and parseable
        dates = []
        for day in data["forecast"]:
            date_str = day["date"]
            # Parse ISO 8601 date
            try:
                parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                dates.append(parsed_date)
            except ValueError:
                pytest.fail(f"Date {date_str} is not valid ISO 8601 format")
        
        # Verify dates are sequential
        for i in range(1, len(dates)):
            delta = (dates[i] - dates[i-1]).days
            assert delta == 1, f"Dates should be sequential, got {delta} day gap"
        
        print(f"✓ Date data suitable for date selection functionality")
        print(f"  First date: {dates[0].strftime('%Y-%m-%d')}")
        print(f"  Last date: {dates[-1].strftime('%Y-%m-%d')}")
    
    def test_tooltip_data_completeness(self):
        """Verify data completeness for tooltip display on hover"""
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 5
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=60
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        
        # Verify each day has complete data for tooltips
        for i, day in enumerate(data["forecast"]):
            # Tooltip should show: location, date, metrics, raw weather
            assert "date" in day
            assert "rain_risk" in day
            assert "temp_extreme" in day
            assert "soil_moisture_proxy" in day
            assert "raw_data" in day
            
            raw = day["raw_data"]
            # Tooltip raw data
            assert "precipitation_mm" in raw
            assert "temp_max_c" in raw
            assert "temp_min_c" in raw
            assert "humidity_percent" in raw
            
            # Verify no None values that would break tooltips
            assert day["rain_risk"] is not None
            assert day["temp_extreme"] is not None
            assert day["soil_moisture_proxy"] is not None
            assert raw["precipitation_mm"] is not None
            assert raw["temp_max_c"] is not None
        
        print(f"✓ Complete data available for tooltip display")


class TestErrorScenarios:
    """Test suite for subtask 15.3: Test error scenarios"""
    
    def test_invalid_coordinates_outside_maharashtra(self):
        """Test with invalid coordinates (outside Maharashtra)"""
        request_data = {
            "latitude": INVALID_COORDS["latitude"],
            "longitude": INVALID_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=30
        )
        
        # Should return 400 or 422 (validation error)
        assert response.status_code in [400, 422], \
            f"Expected 400 or 422 for invalid coordinates, got {response.status_code}"
        
        data = response.json()
        
        # Verify error message is present
        assert "error" in data or "detail" in data, \
            "Error response should contain error message"
        
        # Verify error message mentions coordinates or bounds
        error_msg = str(data).lower()
        assert any(keyword in error_msg for keyword in 
                  ["latitude", "longitude", "bound", "maharashtra", "range"]), \
            "Error message should mention coordinate validation"
        
        print(f"✓ Invalid coordinates correctly rejected")
        print(f"  Status code: {response.status_code}")
        print(f"  Error message present: Yes")
    
    def test_coordinates_below_minimum_bounds(self):
        """Test coordinates below minimum Maharashtra bounds"""
        test_cases = [
            {"latitude": 17.5, "longitude": 73.8567, "forecast_days": 10},  # Lat too low
            {"latitude": 18.5204, "longitude": 72.5, "forecast_days": 10},  # Lon too low
        ]
        
        for request_data in test_cases:
            response = requests.post(
                f"{BASE_URL}/api/graphcast_forecast",
                json=request_data,
                timeout=30
            )
            
            assert response.status_code in [400, 422], \
                f"Expected error for {request_data}, got {response.status_code}"
        
        print(f"✓ Coordinates below minimum bounds correctly rejected")
    
    def test_coordinates_above_maximum_bounds(self):
        """Test coordinates above maximum Maharashtra bounds"""
        test_cases = [
            {"latitude": 21.5, "longitude": 73.8567, "forecast_days": 10},  # Lat too high
            {"latitude": 18.5204, "longitude": 77.5, "forecast_days": 10},  # Lon too high
        ]
        
        for request_data in test_cases:
            response = requests.post(
                f"{BASE_URL}/api/graphcast_forecast",
                json=request_data,
                timeout=30
            )
            
            assert response.status_code in [400, 422], \
                f"Expected error for {request_data}, got {response.status_code}"
        
        print(f"✓ Coordinates above maximum bounds correctly rejected")
    
    def test_appropriate_error_messages_displayed(self):
        """Verify appropriate error messages are displayed for various errors"""
        # Test case 1: Invalid coordinates
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json={"latitude": 28.0, "longitude": 77.0, "forecast_days": 10},
            timeout=30
        )
        
        if response.status_code in [400, 422]:
            data = response.json()
            error_msg = str(data)
            assert len(error_msg) > 0, "Error message should not be empty"
            print(f"✓ Invalid coordinates error message: Present")
        
        # Test case 2: Missing required fields
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json={"latitude": 18.5204},  # Missing longitude
            timeout=30
        )
        
        assert response.status_code == 422, "Missing field should return 422"
        data = response.json()
        assert "detail" in data or "error" in data
        print(f"✓ Missing field error message: Present")
        
        # Test case 3: Invalid data types
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json={"latitude": "invalid", "longitude": 73.8567, "forecast_days": 10},
            timeout=30
        )
        
        assert response.status_code == 422, "Invalid type should return 422"
        data = response.json()
        assert "detail" in data or "error" in data
        print(f"✓ Invalid data type error message: Present")
        
        # Test case 4: Forecast days out of range
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json={"latitude": 18.5204, "longitude": 73.8567, "forecast_days": 15},
            timeout=30
        )
        
        assert response.status_code == 422, "Invalid forecast_days should return 422"
        data = response.json()
        assert "detail" in data or "error" in data
        print(f"✓ Invalid forecast_days error message: Present")


class TestCachingBehavior:
    """Test suite for subtask 15.4: Test caching behavior"""
    
    def test_first_request_inference_time(self):
        """Make first request and note inference time"""
        # Use unique coordinates to avoid existing cache
        request_data = {
            "latitude": 18.6,
            "longitude": 73.9,
            "forecast_days": 10
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=120
        )
        elapsed_time = (time.time() - start_time) * 1000  # Convert to ms
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        metadata = data["metadata"]
        
        # Store for comparison
        self.first_cache_hit = metadata["cache_hit"]
        self.first_inference_time = metadata["inference_time_ms"]
        self.first_elapsed_time = elapsed_time
        
        print(f"✓ First request completed")
        print(f"  Cache hit: {self.first_cache_hit}")
        print(f"  Inference time: {self.first_inference_time}ms")
        print(f"  Total elapsed: {elapsed_time:.0f}ms")
        
        return data
    
    def test_second_request_cache_hit(self):
        """Make second request for same location and verify cache hit"""
        # First request
        request_data = {
            "latitude": 18.7,
            "longitude": 74.0,
            "forecast_days": 10
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=120
        )
        
        if response1.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data1 = response1.json()
        
        # Small delay to ensure cache is written
        time.sleep(0.5)
        
        # Second request (same coordinates)
        response2 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=30
        )
        
        assert response2.status_code == 200, \
            f"Second request failed with status {response2.status_code}"
        
        data2 = response2.json()
        
        # Verify cache hit
        assert data2["metadata"]["cache_hit"] == True, \
            "Second request should hit cache"
        
        print(f"✓ Second request hit cache")
        print(f"  First request cache_hit: {data1['metadata']['cache_hit']}")
        print(f"  Second request cache_hit: {data2['metadata']['cache_hit']}")
    
    def test_cached_response_faster_than_1_second(self):
        """Check response time is significantly faster (<1s) for cached requests"""
        # First request
        request_data = {
            "latitude": 18.8,
            "longitude": 74.1,
            "forecast_days": 10
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=120
        )
        
        if response1.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        time.sleep(0.5)
        
        # Second request (cached)
        start_time = time.time()
        response2 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=30
        )
        elapsed_time = (time.time() - start_time) * 1000  # Convert to ms
        
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Verify cache hit
        if data2["metadata"]["cache_hit"]:
            # Cached response should be fast
            assert elapsed_time < 1000, \
                f"Cached response took {elapsed_time:.0f}ms, expected <1000ms"
            
            print(f"✓ Cached response is fast")
            print(f"  Response time: {elapsed_time:.0f}ms")
            print(f"  Inference time: {data2['metadata']['inference_time_ms']}ms")
        else:
            print(f"⚠ Cache miss on second request (may be expected)")
    
    def test_cache_hit_metadata_true(self):
        """Verify cache_hit: true in metadata for cached requests"""
        # First request
        request_data = {
            "latitude": 18.9,
            "longitude": 74.2,
            "forecast_days": 10
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=120
        )
        
        if response1.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        time.sleep(0.5)
        
        # Second request
        response2 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=30
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Verify metadata structure
        assert "metadata" in data2
        assert "cache_hit" in data2["metadata"]
        assert isinstance(data2["metadata"]["cache_hit"], bool)
        
        # Should be cached
        assert data2["metadata"]["cache_hit"] == True, \
            "cache_hit should be True for second request"
        
        print(f"✓ cache_hit metadata correctly set to True")
    
    def test_different_locations_no_cache_collision(self):
        """Verify different locations don't share cache"""
        # Request 1: Pune
        request1 = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "forecast_days": 10
        }
        
        # Request 2: Mumbai
        request2 = {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "forecast_days": 10
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request1,
            timeout=120
        )
        
        if response1.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        response2 = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request2,
            timeout=120
        )
        
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Verify locations are different
        assert data1["location"]["latitude"] != data2["location"]["latitude"]
        assert data1["location"]["longitude"] != data2["location"]["longitude"]
        
        # Verify forecasts are different (at least some values)
        forecast1_rain = [day["rain_risk"] for day in data1["forecast"]]
        forecast2_rain = [day["rain_risk"] for day in data2["forecast"]]
        
        # At least some values should differ
        assert forecast1_rain != forecast2_rain, \
            "Different locations should have different forecasts"
        
        print(f"✓ Different locations have separate cache entries")


class TestCompleteUserFlow:
    """Test complete user flow from loading page to viewing data"""
    
    def test_complete_flow_load_to_view(self):
        """Test: load agriculture page → view forecast → interact with data"""
        print("\n" + "="*60)
        print("Testing Complete User Flow")
        print("="*60)
        
        # Step 1: User loads agriculture page and requests forecast
        print("\nStep 1: User requests forecast for their location")
        request_data = {
            "latitude": PUNE_COORDS["latitude"],
            "longitude": PUNE_COORDS["longitude"],
            "forecast_days": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/graphcast_forecast",
            json=request_data,
            timeout=120
        )
        
        if response.status_code != 200:
            pytest.skip("GraphCast service not available")
        
        data = response.json()
        print(f"  ✓ Forecast received: {len(data['forecast'])} days")
        
        # Step 2: User views heatmap (verify data suitable for visualization)
        print("\nStep 2: User views heatmap overlay")
        assert "location" in data
        assert "forecast" in data
        for day in data["forecast"]:
            assert "rain_risk" in day
            assert "date" in day
        print(f"  ✓ Heatmap data available")
        
        # Step 3: User checks metrics table
        print("\nStep 3: User checks metrics table")
        for i, day in enumerate(data["forecast"][:3]):  # Check first 3 days
            print(f"  Day {i+1}: Rain={day['rain_risk']:.1f}, "
                  f"Temp={day['temp_extreme']:.1f}, "
                  f"Soil={day['soil_moisture_proxy']:.1f}")
        print(f"  ✓ Metrics table data complete")
        
        # Step 4: User interacts with date selection
        print("\nStep 4: User selects different dates")
        dates = [day["date"] for day in data["forecast"]]
        print(f"  Available dates: {len(dates)}")
        print(f"  First: {dates[0]}")
        print(f"  Last: {dates[-1]}")
        print(f"  ✓ Date selection data available")
        
        # Step 5: User hovers over location (tooltip data)
        print("\nStep 5: User hovers for tooltip")
        first_day = data["forecast"][0]
        tooltip_data = {
            "date": first_day["date"],
            "rain_risk": first_day["rain_risk"],
            "precipitation": first_day["raw_data"]["precipitation_mm"],
            "temp_max": first_day["raw_data"]["temp_max_c"]
        }
        print(f"  Tooltip data: {tooltip_data}")
        print(f"  ✓ Tooltip data complete")
        
        print("\n" + "="*60)
        print("✅ Complete user flow test passed!")
        print("="*60)


if __name__ == "__main__":
    print("\n" + "="*60)
    print("GraphCast End-to-End Integration Tests")
    print("="*60)
    print(f"Testing server at: {BASE_URL}")
    print("Make sure the backend is running!")
    print("="*60 + "\n")
    
    # Run with pytest
    pytest.main([__file__, "-v", "-s"])
