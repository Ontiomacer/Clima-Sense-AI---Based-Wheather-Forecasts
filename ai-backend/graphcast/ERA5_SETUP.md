# ERA5 Data Fetcher Setup

## Overview

The ERA5DataFetcher class handles retrieval of ERA5 reanalysis data for GraphCast initial conditions. It includes automatic caching, retry logic, and fallback mechanisms.

## Prerequisites

1. **Install dependencies:**
   ```bash
   pip install cdsapi xarray numpy
   ```

2. **Get CDS API credentials:**
   - Register at [Copernicus Climate Data Store](https://cds.climate.copernicus.eu)
   - Get your API key from your profile page
   - Set environment variables:
     ```bash
     export CDS_API_KEY="your-uid:your-api-key"
     export CDS_API_URL="https://cds.climate.copernicus.eu/api/v2"
     ```

## Usage

### Basic Usage

```python
from graphcast.era5_fetcher import ERA5DataFetcher
from datetime import datetime

# Initialize fetcher
fetcher = ERA5DataFetcher()

# Fetch data for Maharashtra region
data = await fetcher.fetch_initial_conditions(
    lat_min=18.0,
    lat_max=21.0,
    lon_min=73.0,
    lon_max=77.0,
    timestamp=datetime.utcnow()
)

# Validate data
if fetcher.validate_data(data):
    print("Data is valid and ready for GraphCast")
```

### Cache Management

```python
# Check cached data
cached = await fetcher.get_cached_data(18.0, 21.0, 73.0, 77.0, timestamp)

# Clean up expired cache entries
deleted_count = await fetcher.cleanup_expired_cache()
print(f"Deleted {deleted_count} expired entries")
```

## Features

### Automatic Caching
- 24-hour TTL for cached data
- File-based storage in `./data/era5/`
- Automatic cache key generation from region and timestamp

### Retry Logic
- Exponential backoff (1s, 2s, 4s, ...)
- Maximum 3 retry attempts
- Handles rate limiting from CDS API

### Fallback Mechanism
- Falls back to cached data from last 24 hours if API fails
- Ensures service availability even during API outages

### Data Validation
- Checks for required atmospheric variables:
  - Temperature (2m)
  - Surface pressure
  - Relative humidity
  - Wind components (u, v at 10m)

## Configuration

Edit `config.py` to customize:

```python
ERA5_CONFIG = {
    "data_dir": DATA_DIR,
    "cache_ttl_seconds": 86400,  # 24 hours
    "required_variables": [...],
    "spatial_resolution": 0.25,  # degrees
    "temporal_resolution": "1H",  # hourly
}
```

## Testing

Run unit tests:

```bash
pytest graphcast/test_era5_fetcher.py -v
```

Tests cover:
- Data retrieval with mocked API responses
- Cache hit/miss scenarios
- Data validation logic
- Fallback to cached data when API fails
- Retry logic with exponential backoff
- Cache expiration and cleanup

## Troubleshooting

### API Authentication Errors
- Verify CDS_API_KEY is set correctly
- Check your CDS account is active
- Ensure you've accepted the ERA5 license terms

### Slow Data Retrieval
- First request may take 1-5 minutes (CDS queue)
- Subsequent requests use cache (< 1 second)
- Consider pre-computing forecasts for common locations

### Missing Variables
- Check ERA5 dataset availability for your time range
- Verify variable names match CDS API specification
- Review logs for specific missing variables

## Performance

- **Cache hit:** < 1 second
- **Cache miss (API call):** 1-5 minutes (depends on CDS queue)
- **Fallback to old cache:** < 1 second
- **Cache storage:** ~10-50 MB per region/timestamp

## Limitations

- Spatial resolution: 0.25° (~25 km)
- Temporal resolution: 1 hour
- Historical data only (3-5 day delay from real-time)
- CDS API rate limits apply
- Requires active internet connection for initial fetch
