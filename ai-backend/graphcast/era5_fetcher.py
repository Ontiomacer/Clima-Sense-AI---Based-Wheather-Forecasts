"""
ERA5 Data Fetcher
Handles retrieval of ERA5 reanalysis data for GraphCast initial conditions.
"""

import os
import json
import hashlib
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

try:
    import xarray as xr
    import numpy as np
except ImportError:
    xr = None
    np = None

from .config import ERA5_CONFIG, REGION_BOUNDARIES

logger = logging.getLogger(__name__)


class ERA5DataFetcher:
    """
    Fetches ERA5 reanalysis data for GraphCast initial conditions.
    Implements caching with 24-hour TTL and retry logic with exponential backoff.
    """
    
    def __init__(self, cache_dir: Optional[str] = None, cds_api_key: Optional[str] = None):
        """
        Initialize ERA5 data fetcher.
        
        Args:
            cache_dir: Directory for caching ERA5 data (default: from config)
            cds_api_key: CDS API key for authentication (default: from env)
        """
        self.cache_dir = Path(cache_dir) if cache_dir else ERA5_CONFIG["data_dir"]
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        self.cache_ttl = ERA5_CONFIG["cache_ttl_seconds"]
        self.required_variables = ERA5_CONFIG["required_variables"]
        self.spatial_resolution = ERA5_CONFIG["spatial_resolution"]
        
        # CDS API configuration
        self.cds_api_key = cds_api_key or os.getenv("CDS_API_KEY")
        self.cds_api_url = os.getenv("CDS_API_URL", "https://cds.climate.copernicus.eu/api/v2")
        
        # Retry configuration
        self.max_retries = 3
        self.base_retry_delay = 1  # seconds
        self.max_retry_delay = 60  # seconds
        
        logger.info(f"ERA5DataFetcher initialized with cache_dir: {self.cache_dir}")
    
    async def fetch_initial_conditions(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> Optional[xr.Dataset]:
        """
        Fetch ERA5 data for specified region and time.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for initial conditions
            
        Returns:
            XArray Dataset with ERA5 data, or None if fetch fails
        """
        # Check cache first
        cached_data = await self.get_cached_data(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        if cached_data is not None:
            logger.info(f"Cache hit for ERA5 data at {timestamp}")
            return cached_data
        
        logger.info(f"Cache miss, fetching ERA5 data from API for {timestamp}")
        
        # Fetch from CDS API with retry logic
        data = await self._fetch_from_cds_with_retry(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        
        if data is not None:
            # Validate data
            if self.validate_data(data):
                # Cache the data
                await self._cache_data(
                    data, lat_min, lat_max, lon_min, lon_max, timestamp
                )
                return data
            else:
                logger.error("Fetched data failed validation")
                return None
        
        # If API fetch failed, try to use cached data from last 24 hours
        logger.warning("API fetch failed, attempting to use recent cached data")
        return await self._get_recent_cached_data(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
    
    async def _fetch_from_cds_with_retry(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> Optional[xr.Dataset]:
        """
        Fetch data from CDS API with exponential backoff retry logic.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for data
            
        Returns:
            XArray Dataset or None if all retries fail
        """
        for attempt in range(self.max_retries):
            try:
                data = await self._fetch_from_cds(
                    lat_min, lat_max, lon_min, lon_max, timestamp
                )
                if data is not None:
                    return data
            except Exception as e:
                logger.warning(f"CDS API fetch attempt {attempt + 1} failed: {e}")
                
                if attempt < self.max_retries - 1:
                    # Calculate exponential backoff delay
                    delay = min(
                        self.base_retry_delay * (2 ** attempt),
                        self.max_retry_delay
                    )
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logger.error("All retry attempts exhausted")
        
        return None
    
    async def _fetch_from_cds(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> Optional[xr.Dataset]:
        """
        Fetch data from CDS API.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for data
            
        Returns:
            XArray Dataset or None if fetch fails
        """
        if not self.cds_api_key:
            logger.error("CDS API key not configured")
            return None
        
        try:
            import cdsapi
        except ImportError:
            logger.error("cdsapi package not installed. Install with: pip install cdsapi")
            return None
        
        # Initialize CDS API client
        client = cdsapi.Client(
            url=self.cds_api_url,
            key=self.cds_api_key,
            verify=True
        )
        
        # Prepare request parameters
        request_params = {
            'product_type': 'reanalysis',
            'format': 'netcdf',
            'variable': [
                '2m_temperature',
                'surface_pressure',
                'relative_humidity',
                '10m_u_component_of_wind',
                '10m_v_component_of_wind'
            ],
            'year': timestamp.strftime('%Y'),
            'month': timestamp.strftime('%m'),
            'day': timestamp.strftime('%d'),
            'time': timestamp.strftime('%H:00'),
            'area': [lat_max, lon_min, lat_min, lon_max],  # North, West, South, East
        }
        
        # Create temporary file for download
        temp_file = self.cache_dir / f"temp_era5_{timestamp.strftime('%Y%m%d%H')}.nc"
        
        try:
            # Submit request to CDS
            logger.info(f"Submitting CDS API request for {timestamp}")
            client.retrieve('reanalysis-era5-single-levels', request_params, str(temp_file))
            
            # Load data with xarray
            if xr is None:
                logger.error("xarray not installed")
                return None
            
            dataset = xr.open_dataset(temp_file)
            
            # Clean up temp file
            temp_file.unlink()
            
            logger.info(f"Successfully fetched ERA5 data from CDS API")
            return dataset
            
        except Exception as e:
            logger.error(f"CDS API request failed: {e}")
            if temp_file.exists():
                temp_file.unlink()
            return None
    
    async def get_cached_data(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> Optional[xr.Dataset]:
        """
        Retrieve cached ERA5 data if available and valid.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for data
            
        Returns:
            XArray Dataset or None if cache miss or expired
        """
        cache_key = self._generate_cache_key(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        cache_file = self.cache_dir / f"{cache_key}.nc"
        metadata_file = self.cache_dir / f"{cache_key}.json"
        
        if not cache_file.exists() or not metadata_file.exists():
            return None
        
        # Check if cache is expired
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            cached_time = datetime.fromisoformat(metadata['cached_at'])
            age_seconds = (datetime.utcnow() - cached_time).total_seconds()
            
            if age_seconds > self.cache_ttl:
                logger.info(f"Cache expired (age: {age_seconds}s)")
                return None
            
            # Load cached data
            if xr is None:
                logger.error("xarray not installed")
                return None
            
            dataset = xr.open_dataset(cache_file)
            logger.info(f"Loaded cached ERA5 data (age: {age_seconds}s)")
            return dataset
            
        except Exception as e:
            logger.error(f"Error loading cached data: {e}")
            return None
    
    async def _get_recent_cached_data(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> Optional[xr.Dataset]:
        """
        Get cached data from within the last 24 hours as fallback.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Target timestamp
            
        Returns:
            XArray Dataset or None if no recent cache available
        """
        # Try timestamps within last 24 hours
        for hours_back in range(1, 25):
            fallback_timestamp = timestamp - timedelta(hours=hours_back)
            cached_data = await self.get_cached_data(
                lat_min, lat_max, lon_min, lon_max, fallback_timestamp
            )
            if cached_data is not None:
                logger.info(f"Using cached data from {hours_back} hours ago")
                return cached_data
        
        return None
    
    async def _cache_data(
        self,
        dataset: xr.Dataset,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> bool:
        """
        Cache ERA5 dataset to disk.
        
        Args:
            dataset: XArray Dataset to cache
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for data
            
        Returns:
            True if caching successful, False otherwise
        """
        cache_key = self._generate_cache_key(
            lat_min, lat_max, lon_min, lon_max, timestamp
        )
        cache_file = self.cache_dir / f"{cache_key}.nc"
        metadata_file = self.cache_dir / f"{cache_key}.json"
        
        try:
            # Save dataset
            dataset.to_netcdf(cache_file)
            
            # Save metadata
            metadata = {
                'cached_at': datetime.utcnow().isoformat(),
                'timestamp': timestamp.isoformat(),
                'region': {
                    'lat_min': lat_min,
                    'lat_max': lat_max,
                    'lon_min': lon_min,
                    'lon_max': lon_max
                },
                'ttl_seconds': self.cache_ttl
            }
            
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Cached ERA5 data with key: {cache_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error caching data: {e}")
            return False
    
    def _generate_cache_key(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        timestamp: datetime
    ) -> str:
        """
        Generate cache key from region and timestamp.
        
        Args:
            lat_min: Minimum latitude
            lat_max: Maximum latitude
            lon_min: Minimum longitude
            lon_max: Maximum longitude
            timestamp: Timestamp for data
            
        Returns:
            Cache key string
        """
        key_string = f"{lat_min}_{lat_max}_{lon_min}_{lon_max}_{timestamp.isoformat()}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def validate_data(self, dataset: xr.Dataset) -> bool:
        """
        Validate that dataset contains required atmospheric variables.
        
        Args:
            dataset: XArray Dataset to validate
            
        Returns:
            True if all required variables present, False otherwise
        """
        if dataset is None:
            return False
        
        # Map ERA5 variable names to our required variables
        variable_mapping = {
            't2m': 'temperature',
            'sp': 'pressure',
            'r': 'humidity',
            'u10': 'u_component_of_wind',
            'v10': 'v_component_of_wind'
        }
        
        missing_variables = []
        
        for era5_var, required_var in variable_mapping.items():
            if era5_var not in dataset.variables:
                missing_variables.append(required_var)
        
        if missing_variables:
            logger.error(f"Missing required variables: {missing_variables}")
            return False
        
        logger.info("Data validation passed")
        return True
    
    async def cleanup_expired_cache(self) -> int:
        """
        Remove expired cache entries.
        
        Returns:
            Number of cache entries deleted
        """
        deleted_count = 0
        
        for metadata_file in self.cache_dir.glob("*.json"):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                cached_time = datetime.fromisoformat(metadata['cached_at'])
                age_seconds = (datetime.utcnow() - cached_time).total_seconds()
                
                if age_seconds > self.cache_ttl:
                    # Delete both metadata and data files
                    cache_key = metadata_file.stem
                    cache_file = self.cache_dir / f"{cache_key}.nc"
                    
                    metadata_file.unlink()
                    if cache_file.exists():
                        cache_file.unlink()
                    
                    deleted_count += 1
                    logger.info(f"Deleted expired cache entry: {cache_key}")
                    
            except Exception as e:
                logger.error(f"Error cleaning up cache file {metadata_file}: {e}")
        
        logger.info(f"Cleaned up {deleted_count} expired cache entries")
        return deleted_count
