"""
Forecast Cache Manager
Manages caching of GraphCast forecast results with TTL validation.
"""

import json
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import threading

from .data_models import ForecastResult
from .config import CACHE_CONFIG

logger = logging.getLogger(__name__)


class ForecastCacheManager:
    """
    Manages forecast caching with file-based backend.
    
    Features:
    - File-based storage with organized directory structure
    - TTL-based cache validation
    - Thread-safe operations
    - Automatic cache invalidation
    """
    
    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        ttl_seconds: Optional[int] = None
    ):
        """
        Initialize cache manager.
        
        Args:
            cache_dir: Directory for cache storage (default from config)
            ttl_seconds: Time-to-live in seconds (default from config)
        """
        self.cache_dir = cache_dir or CACHE_CONFIG["cache_dir"]
        self.ttl_seconds = ttl_seconds or CACHE_CONFIG["ttl_seconds"]
        self._lock = threading.Lock()
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"ForecastCacheManager initialized: dir={self.cache_dir}, ttl={self.ttl_seconds}s")
    
    def _generate_cache_key(
        self,
        lat: float,
        lon: float,
        forecast_days: int
    ) -> str:
        """
        Generate cache key from coordinates and forecast parameters.
        
        Args:
            lat: Latitude
            lon: Longitude
            forecast_days: Number of forecast days
            
        Returns:
            Cache key string
        """
        # Round coordinates to 2 decimal places for cache key consistency
        lat_rounded = round(lat, 2)
        lon_rounded = round(lon, 2)
        
        # Create hash from parameters
        key_string = f"{lat_rounded}_{lon_rounded}_{forecast_days}"
        key_hash = hashlib.md5(key_string.encode()).hexdigest()[:8]
        
        return f"forecast_{lat_rounded}_{lon_rounded}_{forecast_days}_{key_hash}"
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """
        Get file path for cache key with organized directory structure.
        
        Args:
            cache_key: Cache key
            
        Returns:
            Path to cache file
        """
        # Organize by date subdirectories (YYYY-MM-DD)
        date_dir = self.cache_dir / datetime.now().strftime("%Y-%m-%d")
        date_dir.mkdir(parents=True, exist_ok=True)
        
        return date_dir / f"{cache_key}.json"
    
    def _is_cache_valid(self, cache_path: Path) -> bool:
        """
        Check if cache file is valid (exists and not expired).
        
        Args:
            cache_path: Path to cache file
            
        Returns:
            True if cache is valid, False otherwise
        """
        if not cache_path.exists():
            return False
        
        # Check file modification time
        mtime = datetime.fromtimestamp(cache_path.stat().st_mtime)
        age_seconds = (datetime.now() - mtime).total_seconds()
        
        return age_seconds < self.ttl_seconds
    
    def get_forecast(
        self,
        lat: float,
        lon: float,
        forecast_days: int
    ) -> Optional[ForecastResult]:
        """
        Retrieve cached forecast if available and valid.
        
        Args:
            lat: Latitude
            lon: Longitude
            forecast_days: Number of forecast days
            
        Returns:
            ForecastResult if cache hit and valid, None otherwise
        """
        cache_key = self._generate_cache_key(lat, lon, forecast_days)
        
        with self._lock:
            # Try current date directory first
            cache_path = self._get_cache_path(cache_key)
            
            if self._is_cache_valid(cache_path):
                try:
                    with open(cache_path, 'r') as f:
                        data = json.load(f)
                    
                    forecast = ForecastResult.from_dict(data)
                    
                    logger.info(
                        f"Cache HIT: {cache_key} "
                        f"(lat={lat}, lon={lon}, days={forecast_days})"
                    )
                    
                    return forecast
                    
                except Exception as e:
                    logger.error(f"Error reading cache {cache_key}: {e}")
                    # Delete corrupted cache file
                    try:
                        cache_path.unlink()
                    except:
                        pass
                    return None
            
            # Also check yesterday's directory (for forecasts near midnight)
            yesterday_dir = self.cache_dir / (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            yesterday_path = yesterday_dir / f"{cache_key}.json"
            
            if self._is_cache_valid(yesterday_path):
                try:
                    with open(yesterday_path, 'r') as f:
                        data = json.load(f)
                    
                    forecast = ForecastResult.from_dict(data)
                    
                    logger.info(
                        f"Cache HIT (yesterday): {cache_key} "
                        f"(lat={lat}, lon={lon}, days={forecast_days})"
                    )
                    
                    return forecast
                    
                except Exception as e:
                    logger.error(f"Error reading cache {cache_key} from yesterday: {e}")
                    return None
            
            logger.info(
                f"Cache MISS: {cache_key} "
                f"(lat={lat}, lon={lon}, days={forecast_days})"
            )
            
            return None
    
    def set_forecast(
        self,
        lat: float,
        lon: float,
        forecast_days: int,
        forecast: ForecastResult
    ) -> bool:
        """
        Store forecast in cache.
        
        Args:
            lat: Latitude
            lon: Longitude
            forecast_days: Number of forecast days
            forecast: ForecastResult to cache
            
        Returns:
            True if successful, False otherwise
        """
        cache_key = self._generate_cache_key(lat, lon, forecast_days)
        cache_path = self._get_cache_path(cache_key)
        
        with self._lock:
            try:
                # Serialize forecast to JSON
                data = forecast.to_dict()
                
                # Write to cache file
                with open(cache_path, 'w') as f:
                    json.dump(data, f, indent=2)
                
                logger.info(
                    f"Cache SET: {cache_key} "
                    f"(lat={lat}, lon={lon}, days={forecast_days})"
                )
                
                return True
                
            except Exception as e:
                logger.error(f"Error writing cache {cache_key}: {e}")
                return False
    
    def invalidate_forecast(
        self,
        lat: float,
        lon: float,
        forecast_days: int
    ) -> bool:
        """
        Invalidate (delete) a specific cached forecast.
        
        Args:
            lat: Latitude
            lon: Longitude
            forecast_days: Number of forecast days
            
        Returns:
            True if deleted, False if not found or error
        """
        cache_key = self._generate_cache_key(lat, lon, forecast_days)
        
        with self._lock:
            # Check current and yesterday directories
            paths_to_check = [
                self._get_cache_path(cache_key),
                self.cache_dir / (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d") / f"{cache_key}.json"
            ]
            
            deleted = False
            for cache_path in paths_to_check:
                if cache_path.exists():
                    try:
                        cache_path.unlink()
                        logger.info(f"Cache INVALIDATED: {cache_key}")
                        deleted = True
                    except Exception as e:
                        logger.error(f"Error deleting cache {cache_key}: {e}")
            
            return deleted
    
    def invalidate_old_forecasts(self) -> int:
        """
        Remove expired forecasts from cache.
        
        Returns:
            Number of forecasts deleted
        """
        deleted_count = 0
        
        with self._lock:
            try:
                # Iterate through all date directories
                for date_dir in self.cache_dir.iterdir():
                    if not date_dir.is_dir():
                        continue
                    
                    # Check if directory is older than TTL
                    try:
                        dir_date = datetime.strptime(date_dir.name, "%Y-%m-%d")
                        age_seconds = (datetime.now() - dir_date).total_seconds()
                        
                        if age_seconds > self.ttl_seconds:
                            # Delete entire directory
                            for cache_file in date_dir.glob("*.json"):
                                try:
                                    cache_file.unlink()
                                    deleted_count += 1
                                except Exception as e:
                                    logger.error(f"Error deleting {cache_file}: {e}")
                            
                            # Try to remove empty directory
                            try:
                                date_dir.rmdir()
                            except:
                                pass
                        else:
                            # Check individual files in recent directories
                            for cache_file in date_dir.glob("*.json"):
                                if not self._is_cache_valid(cache_file):
                                    try:
                                        cache_file.unlink()
                                        deleted_count += 1
                                    except Exception as e:
                                        logger.error(f"Error deleting {cache_file}: {e}")
                    
                    except ValueError:
                        # Invalid directory name, skip
                        continue
                
                if deleted_count > 0:
                    logger.info(f"Cache cleanup: deleted {deleted_count} expired forecasts")
                
            except Exception as e:
                logger.error(f"Error during cache cleanup: {e}")
        
        return deleted_count
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        stats = {
            "cache_dir": str(self.cache_dir),
            "ttl_seconds": self.ttl_seconds,
            "total_forecasts": 0,
            "valid_forecasts": 0,
            "expired_forecasts": 0,
            "total_size_bytes": 0
        }
        
        try:
            for date_dir in self.cache_dir.iterdir():
                if not date_dir.is_dir():
                    continue
                
                for cache_file in date_dir.glob("*.json"):
                    stats["total_forecasts"] += 1
                    stats["total_size_bytes"] += cache_file.stat().st_size
                    
                    if self._is_cache_valid(cache_file):
                        stats["valid_forecasts"] += 1
                    else:
                        stats["expired_forecasts"] += 1
        
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
        
        return stats
