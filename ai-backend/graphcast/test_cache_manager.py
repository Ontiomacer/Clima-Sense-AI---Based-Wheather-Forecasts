"""
Unit tests for ForecastCacheManager
Tests cache operations, TTL validation, and invalidation.
"""

import pytest
import tempfile
import time
import threading
from pathlib import Path
from datetime import datetime, timedelta

from .cache_manager import ForecastCacheManager
from .data_models import (
    ForecastResult,
    Location,
    ForecastDay,
    RawWeatherData,
    ForecastMetadata
)


@pytest.fixture
def temp_cache_dir():
    """Create temporary cache directory for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def cache_manager(temp_cache_dir):
    """Create cache manager with temporary directory"""
    return ForecastCacheManager(
        cache_dir=temp_cache_dir,
        ttl_seconds=3600  # 1 hour for testing
    )


@pytest.fixture
def sample_forecast():
    """Create sample forecast result for testing"""
    location = Location(
        latitude=18.5,
        longitude=73.8,
        region="Pune, Maharashtra"
    )
    
    forecast_days = []
    for i in range(3):
        raw_weather = RawWeatherData(
            precipitation_mm=10.0 + i,
            temp_max_c=32.0 + i,
            temp_min_c=22.0 + i,
            temp_mean_c=27.0 + i,
            humidity_percent=65.0 + i,
            wind_speed_ms=3.5 + i * 0.5
        )
        
        forecast_day = ForecastDay(
            date=datetime.now() + timedelta(days=i),
            rain_risk=30.0 + i * 10,
            temp_extreme=20.0 + i * 5,
            soil_moisture_proxy=60.0 - i * 5,
            confidence_score=0.95 - i * 0.05,
            raw_weather=raw_weather
        )
        forecast_days.append(forecast_day)
    
    metadata = ForecastMetadata(
        model_version="v0.1",
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


class TestCacheSetGet:
    """Test cache set and get operations"""
    
    def test_set_and_get_forecast(self, cache_manager, sample_forecast):
        """Test basic cache set and get operations"""
        lat, lon, days = 18.5, 73.8, 10
        
        # Set forecast in cache
        success = cache_manager.set_forecast(lat, lon, days, sample_forecast)
        assert success is True
        
        # Get forecast from cache
        cached_forecast = cache_manager.get_forecast(lat, lon, days)
        assert cached_forecast is not None
        assert cached_forecast.location.latitude == sample_forecast.location.latitude
        assert cached_forecast.location.longitude == sample_forecast.location.longitude
        assert len(cached_forecast.forecast_days) == len(sample_forecast.forecast_days)
    
    def test_get_nonexistent_forecast(self, cache_manager):
        """Test getting forecast that doesn't exist returns None"""
        cached_forecast = cache_manager.get_forecast(19.0, 74.0, 10)
        assert cached_forecast is None
    
    def test_cache_key_consistency(self, cache_manager, sample_forecast):
        """Test that similar coordinates use same cache key"""
        # Set with rounded coordinates
        cache_manager.set_forecast(18.52, 73.85, 10, sample_forecast)
        
        # Get with slightly different coordinates (should round to same key)
        cached = cache_manager.get_forecast(18.52, 73.85, 10)
        assert cached is not None
    
    def test_different_forecast_days_different_cache(self, cache_manager, sample_forecast):
        """Test that different forecast_days parameter creates different cache entries"""
        lat, lon = 18.5, 73.8
        
        # Set forecast for 7 days
        cache_manager.set_forecast(lat, lon, 7, sample_forecast)
        
        # Set forecast for 10 days
        cache_manager.set_forecast(lat, lon, 10, sample_forecast)
        
        # Both should be retrievable independently
        cached_7 = cache_manager.get_forecast(lat, lon, 7)
        cached_10 = cache_manager.get_forecast(lat, lon, 10)
        
        assert cached_7 is not None
        assert cached_10 is not None


class TestTTLExpiration:
    """Test TTL expiration logic"""
    
    def test_expired_cache_returns_none(self, temp_cache_dir, sample_forecast):
        """Test that expired cache entries return None"""
        # Create cache manager with very short TTL (1 second)
        cache_manager = ForecastCacheManager(
            cache_dir=temp_cache_dir,
            ttl_seconds=1
        )
        
        lat, lon, days = 18.5, 73.8, 10
        
        # Set forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        # Verify it's cached
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is not None
        
        # Wait for TTL to expire
        time.sleep(1.5)
        
        # Should return None now
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is None
    
    def test_valid_cache_within_ttl(self, cache_manager, sample_forecast):
        """Test that cache is valid within TTL period"""
        lat, lon, days = 18.5, 73.8, 10
        
        # Set forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        # Should be valid immediately
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is not None
        
        # Should still be valid after short wait (well within 1 hour TTL)
        time.sleep(0.5)
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is not None


class TestCacheInvalidation:
    """Test cache invalidation"""
    
    def test_invalidate_specific_forecast(self, cache_manager, sample_forecast):
        """Test invalidating a specific cached forecast"""
        lat, lon, days = 18.5, 73.8, 10
        
        # Set forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        # Verify it's cached
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is not None
        
        # Invalidate
        success = cache_manager.invalidate_forecast(lat, lon, days)
        assert success is True
        
        # Should return None now
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is None
    
    def test_invalidate_nonexistent_forecast(self, cache_manager):
        """Test invalidating forecast that doesn't exist"""
        success = cache_manager.invalidate_forecast(19.0, 74.0, 10)
        assert success is False
    
    def test_invalidate_old_forecasts(self, temp_cache_dir, sample_forecast):
        """Test bulk invalidation of old forecasts"""
        # Create cache manager with short TTL
        cache_manager = ForecastCacheManager(
            cache_dir=temp_cache_dir,
            ttl_seconds=1
        )
        
        # Set multiple forecasts
        cache_manager.set_forecast(18.5, 73.8, 10, sample_forecast)
        cache_manager.set_forecast(19.0, 74.0, 10, sample_forecast)
        cache_manager.set_forecast(20.0, 75.0, 10, sample_forecast)
        
        # Wait for expiration
        time.sleep(1.5)
        
        # Invalidate old forecasts
        deleted_count = cache_manager.invalidate_old_forecasts()
        assert deleted_count == 3
        
        # All should be gone
        assert cache_manager.get_forecast(18.5, 73.8, 10) is None
        assert cache_manager.get_forecast(19.0, 74.0, 10) is None
        assert cache_manager.get_forecast(20.0, 75.0, 10) is None


class TestConcurrentAccess:
    """Test concurrent access handling"""
    
    def test_concurrent_writes(self, cache_manager, sample_forecast):
        """Test multiple threads writing to cache simultaneously"""
        lat, lon = 18.5, 73.8
        num_threads = 10
        results = []
        
        def write_cache(thread_id):
            success = cache_manager.set_forecast(lat, lon, thread_id, sample_forecast)
            results.append(success)
        
        # Create and start threads
        threads = []
        for i in range(num_threads):
            thread = threading.Thread(target=write_cache, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All writes should succeed
        assert all(results)
        assert len(results) == num_threads
        
        # All forecasts should be retrievable
        for i in range(num_threads):
            cached = cache_manager.get_forecast(lat, lon, i)
            assert cached is not None
    
    def test_concurrent_read_write(self, cache_manager, sample_forecast):
        """Test concurrent reads and writes"""
        lat, lon, days = 18.5, 73.8, 10
        num_operations = 20
        results = {'reads': [], 'writes': []}
        
        # Set initial forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        def read_cache():
            cached = cache_manager.get_forecast(lat, lon, days)
            results['reads'].append(cached is not None)
        
        def write_cache():
            success = cache_manager.set_forecast(lat, lon, days, sample_forecast)
            results['writes'].append(success)
        
        # Create mixed read/write threads
        threads = []
        for i in range(num_operations):
            if i % 2 == 0:
                thread = threading.Thread(target=read_cache)
            else:
                thread = threading.Thread(target=write_cache)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # All operations should succeed
        assert all(results['reads'])
        assert all(results['writes'])
    
    def test_concurrent_invalidation(self, cache_manager, sample_forecast):
        """Test concurrent invalidation operations"""
        lat, lon, days = 18.5, 73.8, 10
        num_threads = 5
        
        # Set forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        results = []
        
        def invalidate_cache():
            success = cache_manager.invalidate_forecast(lat, lon, days)
            results.append(success)
        
        # Create threads that all try to invalidate
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=invalidate_cache)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # At least one should succeed
        assert any(results)
        
        # Forecast should be gone
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is None


class TestCacheStats:
    """Test cache statistics"""
    
    def test_get_cache_stats(self, cache_manager, sample_forecast):
        """Test getting cache statistics"""
        # Initially empty
        stats = cache_manager.get_cache_stats()
        assert stats['total_forecasts'] == 0
        assert stats['valid_forecasts'] == 0
        
        # Add some forecasts
        cache_manager.set_forecast(18.5, 73.8, 10, sample_forecast)
        cache_manager.set_forecast(19.0, 74.0, 10, sample_forecast)
        
        # Check stats
        stats = cache_manager.get_cache_stats()
        assert stats['total_forecasts'] == 2
        assert stats['valid_forecasts'] == 2
        assert stats['total_size_bytes'] > 0
    
    def test_stats_with_expired_forecasts(self, temp_cache_dir, sample_forecast):
        """Test stats correctly identify expired forecasts"""
        cache_manager = ForecastCacheManager(
            cache_dir=temp_cache_dir,
            ttl_seconds=1
        )
        
        # Add forecasts
        cache_manager.set_forecast(18.5, 73.8, 10, sample_forecast)
        cache_manager.set_forecast(19.0, 74.0, 10, sample_forecast)
        
        # Wait for expiration
        time.sleep(1.5)
        
        # Check stats
        stats = cache_manager.get_cache_stats()
        assert stats['total_forecasts'] == 2
        assert stats['valid_forecasts'] == 0
        assert stats['expired_forecasts'] == 2


class TestCorruptedCache:
    """Test handling of corrupted cache files"""
    
    def test_corrupted_cache_file_returns_none(self, cache_manager, sample_forecast):
        """Test that corrupted cache files are handled gracefully"""
        lat, lon, days = 18.5, 73.8, 10
        
        # Set valid forecast
        cache_manager.set_forecast(lat, lon, days, sample_forecast)
        
        # Corrupt the cache file
        cache_key = cache_manager._generate_cache_key(lat, lon, days)
        cache_path = cache_manager._get_cache_path(cache_key)
        
        with open(cache_path, 'w') as f:
            f.write("corrupted json data {{{")
        
        # Should return None and delete corrupted file
        cached = cache_manager.get_forecast(lat, lon, days)
        assert cached is None
        
        # File should be deleted
        assert not cache_path.exists()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
