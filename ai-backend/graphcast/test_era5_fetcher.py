"""
Unit tests for ERA5DataFetcher
Tests data retrieval, caching, validation, and fallback logic.
"""

import pytest
import asyncio
import json
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock, MagicMock

try:
    import xarray as xr
    import numpy as np
    HAS_XARRAY = True
except ImportError:
    HAS_XARRAY = False

from era5_fetcher import ERA5DataFetcher


@pytest.fixture
def temp_cache_dir():
    """Create temporary cache directory for tests."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def mock_dataset():
    """Create mock xarray Dataset with required variables."""
    if not HAS_XARRAY:
        pytest.skip("xarray not installed")
    
    # Create mock data
    data = {
        't2m': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
        'sp': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
        'r': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
        'u10': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
        'v10': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
    }
    
    coords = {
        'time': [datetime.utcnow()],
        'lat': np.linspace(18.0, 21.0, 10),
        'lon': np.linspace(73.0, 77.0, 10),
    }
    
    return xr.Dataset(data, coords=coords)


@pytest.fixture
def fetcher(temp_cache_dir):
    """Create ERA5DataFetcher instance with temp cache."""
    return ERA5DataFetcher(cache_dir=temp_cache_dir, cds_api_key="test_key")


class TestERA5DataFetcher:
    """Test suite for ERA5DataFetcher class."""
    
    def test_initialization(self, temp_cache_dir):
        """Test fetcher initialization."""
        fetcher = ERA5DataFetcher(cache_dir=temp_cache_dir)
        
        assert fetcher.cache_dir == Path(temp_cache_dir)
        assert fetcher.cache_dir.exists()
        assert fetcher.cache_ttl == 86400
        assert len(fetcher.required_variables) == 5
    
    def test_cache_key_generation(self, fetcher):
        """Test cache key generation is consistent."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        
        key1 = fetcher._generate_cache_key(18.0, 21.0, 73.0, 77.0, timestamp)
        key2 = fetcher._generate_cache_key(18.0, 21.0, 73.0, 77.0, timestamp)
        
        assert key1 == key2
        assert len(key1) == 32  # MD5 hash length
    
    def test_cache_key_uniqueness(self, fetcher):
        """Test different inputs generate different cache keys."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        
        key1 = fetcher._generate_cache_key(18.0, 21.0, 73.0, 77.0, timestamp)
        key2 = fetcher._generate_cache_key(18.0, 21.0, 73.0, 77.0, timestamp + timedelta(hours=1))
        key3 = fetcher._generate_cache_key(19.0, 21.0, 73.0, 77.0, timestamp)
        
        assert key1 != key2
        assert key1 != key3
        assert key2 != key3
    
    def test_validate_data_success(self, fetcher, mock_dataset):
        """Test data validation with valid dataset."""
        assert fetcher.validate_data(mock_dataset) is True
    
    def test_validate_data_missing_variable(self, fetcher):
        """Test data validation fails with missing variables."""
        if not HAS_XARRAY:
            pytest.skip("xarray not installed")
        
        # Create dataset missing required variable
        incomplete_data = {
            't2m': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
            'sp': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10)),
            # Missing humidity, wind components
        }
        
        coords = {
            'time': [datetime.utcnow()],
            'lat': np.linspace(18.0, 21.0, 10),
            'lon': np.linspace(73.0, 77.0, 10),
        }
        
        incomplete_dataset = xr.Dataset(incomplete_data, coords=coords)
        
        assert fetcher.validate_data(incomplete_dataset) is False
    
    def test_validate_data_none(self, fetcher):
        """Test data validation fails with None input."""
        assert fetcher.validate_data(None) is False
    
    @pytest.mark.asyncio
    async def test_cache_and_retrieve(self, fetcher, mock_dataset):
        """Test caching and retrieving data."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Cache data
        success = await fetcher._cache_data(
            mock_dataset, lat_min, lat_max, lon_min, lon_max, timestamp
        )
        assert success is True
        
        # Retrieve cached data
        cached_data = await fetcher.get_cached_data(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        assert cached_data is not None
        assert 't2m' in cached_data.variables
    
    @pytest.mark.asyncio
    async def test_cache_miss(self, fetcher):
        """Test cache miss returns None."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        
        cached_data = await fetcher.get_cached_data(
            18.0, 21.0, 73.0, 77.0, timestamp
        )
        
        assert cached_data is None
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self, fetcher, mock_dataset):
        """Test expired cache returns None."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Cache data
        await fetcher._cache_data(
            mock_dataset, lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        # Manually modify metadata to simulate expiration
        cache_key = fetcher._generate_cache_key(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        metadata_file = fetcher.cache_dir / f"{cache_key}.json"
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Set cached_at to 25 hours ago
        old_time = datetime.utcnow() - timedelta(hours=25)
        metadata['cached_at'] = old_time.isoformat()
        
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f)
        
        # Try to retrieve - should return None due to expiration
        cached_data = await fetcher.get_cached_data(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        assert cached_data is None
    
    @pytest.mark.asyncio
    async def test_cleanup_expired_cache(self, fetcher, mock_dataset):
        """Test cleanup removes expired cache entries."""
        timestamp = datetime(2024, 1, 1, 12, 0, 0)
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Cache data
        await fetcher._cache_data(
            mock_dataset, lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        # Manually expire the cache
        cache_key = fetcher._generate_cache_key(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        metadata_file = fetcher.cache_dir / f"{cache_key}.json"
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        old_time = datetime.utcnow() - timedelta(hours=25)
        metadata['cached_at'] = old_time.isoformat()
        
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f)
        
        # Run cleanup
        deleted_count = await fetcher.cleanup_expired_cache()
        
        assert deleted_count == 1
        assert not metadata_file.exists()
    
    @pytest.mark.asyncio
    async def test_fetch_with_cache_hit(self, fetcher, mock_dataset):
        """Test fetch returns cached data when available."""
        timestamp = datetime.utcnow()
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Pre-populate cache
        await fetcher._cache_data(
            mock_dataset, lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        # Mock the CDS API call to ensure it's not called
        with patch.object(fetcher, '_fetch_from_cds_with_retry', return_value=None) as mock_fetch:
            data = await fetcher.fetch_initial_conditions(
                lat_min, lat_max, lon_min, lon_max, timestamp
            )
            
            # Should return cached data without calling API
            assert data is not None
            mock_fetch.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_fetch_with_api_call(self, fetcher, mock_dataset):
        """Test fetch calls API on cache miss."""
        timestamp = datetime.utcnow()
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Mock successful API call
        with patch.object(fetcher, '_fetch_from_cds_with_retry', return_value=mock_dataset):
            data = await fetcher.fetch_initial_conditions(
                lat_min, lat_max, lon_min, lon_max, timestamp
            )
            
            assert data is not None
            assert fetcher.validate_data(data)
    
    @pytest.mark.asyncio
    async def test_fetch_fallback_to_recent_cache(self, fetcher, mock_dataset):
        """Test fetch falls back to recent cached data when API fails."""
        current_time = datetime.utcnow()
        old_time = current_time - timedelta(hours=2)
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Cache old data
        await fetcher._cache_data(
            mock_dataset, lat_min, lat_max, lon_min, lon_max, old_time
        )
        
        # Mock API failure
        with patch.object(fetcher, '_fetch_from_cds_with_retry', return_value=None):
            data = await fetcher.fetch_initial_conditions(
                lat_min, lat_max, lon_min, lon_max, current_time
            )
            
            # Should return old cached data as fallback
            assert data is not None
    
    @pytest.mark.asyncio
    async def test_retry_logic(self, fetcher):
        """Test exponential backoff retry logic."""
        timestamp = datetime.utcnow()
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        call_count = 0
        
        async def mock_fetch_fail(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise Exception("API Error")
        
        with patch.object(fetcher, '_fetch_from_cds', side_effect=mock_fetch_fail):
            with patch('time.sleep'):  # Mock sleep to speed up test
                data = await fetcher._fetch_from_cds_with_retry(
                    lat_min, lat_max, lon_min, lon_max, timestamp
                )
                
                # Should retry max_retries times
                assert call_count == fetcher.max_retries
                assert data is None
    
    @pytest.mark.asyncio
    async def test_validation_failure_returns_none(self, fetcher):
        """Test that invalid data is not cached and returns None."""
        timestamp = datetime.utcnow()
        lat_min, lat_max = 18.0, 21.0
        lon_min, lon_max = 73.0, 77.0
        
        # Create invalid dataset (missing variables)
        if not HAS_XARRAY:
            pytest.skip("xarray not installed")
        
        invalid_data = xr.Dataset({
            't2m': (['time', 'lat', 'lon'], np.random.rand(1, 10, 10))
        })
        
        with patch.object(fetcher, '_fetch_from_cds_with_retry', return_value=invalid_data):
            data = await fetcher.fetch_initial_conditions(
                lat_min, lat_max, lon_min, lon_max, timestamp
            )
            
            # Should return None due to validation failure
            assert data is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
