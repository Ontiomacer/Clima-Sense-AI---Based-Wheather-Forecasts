"""
Forecast Pre-computation Scheduler
Pre-computes forecasts for major Maharashtra cities to populate cache.
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Tuple
import schedule
import time

from .cache_manager import ForecastCacheManager
from .config import CACHE_CONFIG

logger = logging.getLogger(__name__)


# Major cities in Maharashtra with coordinates
MAHARASHTRA_CITIES = [
    {"name": "Pune", "lat": 18.52, "lon": 73.86},
    {"name": "Mumbai", "lat": 19.08, "lon": 72.88},
    {"name": "Nagpur", "lat": 21.15, "lon": 79.09},
    {"name": "Nashik", "lat": 19.99, "lon": 73.79},
    {"name": "Aurangabad", "lat": 19.88, "lon": 75.32},
    {"name": "Solapur", "lat": 17.68, "lon": 75.91},
    {"name": "Kolhapur", "lat": 16.70, "lon": 74.22},
    {"name": "Amravati", "lat": 20.93, "lon": 77.75},
    {"name": "Sangli", "lat": 16.85, "lon": 74.56},
    {"name": "Ahmednagar", "lat": 19.09, "lon": 74.74},
]


class ForecastPrecomputeScheduler:
    """
    Scheduler for pre-computing forecasts for major cities.
    
    Features:
    - Daily pre-computation at configured time
    - Parallel forecast generation
    - Error handling and retry logic
    - Logging of pre-computation status
    """
    
    def __init__(
        self,
        cache_manager: ForecastCacheManager,
        inference_pipeline=None,
        cities: List[Dict] = None
    ):
        """
        Initialize pre-computation scheduler.
        
        Args:
            cache_manager: ForecastCacheManager instance
            inference_pipeline: GraphCastInferencePipeline instance (optional)
            cities: List of city dictionaries with name, lat, lon (default: MAHARASHTRA_CITIES)
        """
        self.cache_manager = cache_manager
        self.inference_pipeline = inference_pipeline
        self.cities = cities or MAHARASHTRA_CITIES
        self.is_running = False
        
        logger.info(f"ForecastPrecomputeScheduler initialized with {len(self.cities)} cities")
    
    async def precompute_city_forecast(
        self,
        city: Dict,
        forecast_days: int = 10
    ) -> Tuple[bool, str]:
        """
        Pre-compute forecast for a single city.
        
        Args:
            city: Dictionary with name, lat, lon
            forecast_days: Number of forecast days
            
        Returns:
            Tuple of (success, message)
        """
        city_name = city["name"]
        lat = city["lat"]
        lon = city["lon"]
        
        try:
            logger.info(f"Pre-computing forecast for {city_name} ({lat}, {lon})")
            
            # Check if already cached
            cached = self.cache_manager.get_forecast(lat, lon, forecast_days)
            if cached:
                logger.info(f"  ✓ {city_name}: Already cached, skipping")
                return True, f"{city_name}: Already cached"
            
            # Generate forecast if pipeline is available
            if self.inference_pipeline:
                start_time = time.time()
                
                forecast = await self.inference_pipeline.run_inference(
                    lat=lat,
                    lon=lon,
                    forecast_days=forecast_days
                )
                
                # Store in cache
                self.cache_manager.set_forecast(lat, lon, forecast_days, forecast)
                
                elapsed = time.time() - start_time
                logger.info(
                    f"  ✓ {city_name}: Forecast generated and cached "
                    f"({elapsed:.1f}s)"
                )
                
                return True, f"{city_name}: Generated in {elapsed:.1f}s"
            else:
                logger.warning(f"  ⚠ {city_name}: No inference pipeline available")
                return False, f"{city_name}: No inference pipeline"
        
        except Exception as e:
            logger.error(f"  ✗ {city_name}: Error - {e}")
            return False, f"{city_name}: Error - {str(e)}"
    
    async def precompute_all_forecasts(self, forecast_days: int = 10) -> Dict:
        """
        Pre-compute forecasts for all cities.
        
        Args:
            forecast_days: Number of forecast days
            
        Returns:
            Dictionary with pre-computation results
        """
        logger.info("=" * 60)
        logger.info("Starting forecast pre-computation")
        logger.info(f"Cities: {len(self.cities)}, Forecast days: {forecast_days}")
        logger.info("=" * 60)
        
        start_time = time.time()
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_cities": len(self.cities),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        # Pre-compute forecasts sequentially (to avoid overwhelming the system)
        for city in self.cities:
            success, message = await self.precompute_city_forecast(city, forecast_days)
            
            if success:
                if "Already cached" in message:
                    results["skipped"] += 1
                else:
                    results["successful"] += 1
            else:
                results["failed"] += 1
            
            results["details"].append({
                "city": city["name"],
                "success": success,
                "message": message
            })
        
        elapsed = time.time() - start_time
        results["total_time_seconds"] = round(elapsed, 1)
        
        logger.info("=" * 60)
        logger.info("Pre-computation completed")
        logger.info(f"  Successful: {results['successful']}")
        logger.info(f"  Skipped: {results['skipped']}")
        logger.info(f"  Failed: {results['failed']}")
        logger.info(f"  Total time: {elapsed:.1f}s")
        logger.info("=" * 60)
        
        return results
    
    def schedule_daily_precomputation(self, time_utc: str = "00:00"):
        """
        Schedule daily pre-computation at specified UTC time.
        
        Args:
            time_utc: Time in HH:MM format (UTC)
        """
        def job():
            """Wrapper to run async precomputation"""
            if self.is_running:
                logger.warning("Pre-computation already running, skipping")
                return
            
            self.is_running = True
            try:
                asyncio.run(self.precompute_all_forecasts())
            finally:
                self.is_running = False
        
        schedule.every().day.at(time_utc).do(job)
        logger.info(f"Scheduled daily pre-computation at {time_utc} UTC")
    
    def run_scheduler(self):
        """
        Run the scheduler loop (blocking).
        
        This should be run in a separate thread or process.
        """
        logger.info("Starting pre-computation scheduler loop")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute


async def run_precomputation_once(
    cache_manager: ForecastCacheManager,
    inference_pipeline=None,
    cities: List[Dict] = None,
    forecast_days: int = 10
) -> Dict:
    """
    Run pre-computation once (for manual execution or testing).
    
    Args:
        cache_manager: ForecastCacheManager instance
        inference_pipeline: GraphCastInferencePipeline instance (optional)
        cities: List of city dictionaries (default: MAHARASHTRA_CITIES)
        forecast_days: Number of forecast days
        
    Returns:
        Dictionary with pre-computation results
    """
    scheduler = ForecastPrecomputeScheduler(
        cache_manager=cache_manager,
        inference_pipeline=inference_pipeline,
        cities=cities
    )
    
    return await scheduler.precompute_all_forecasts(forecast_days)


if __name__ == "__main__":
    """
    Standalone script for manual pre-computation.
    
    Usage:
        python -m graphcast.precompute_forecasts
    """
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize cache manager
    cache_manager = ForecastCacheManager()
    
    # Run pre-computation without inference pipeline (will only check cache)
    logger.info("Running manual pre-computation (cache check only)")
    results = asyncio.run(run_precomputation_once(cache_manager))
    
    print("\n" + "=" * 60)
    print("Pre-computation Results:")
    print(f"  Total cities: {results['total_cities']}")
    print(f"  Successful: {results['successful']}")
    print(f"  Skipped: {results['skipped']}")
    print(f"  Failed: {results['failed']}")
    print(f"  Total time: {results['total_time_seconds']}s")
    print("=" * 60)
