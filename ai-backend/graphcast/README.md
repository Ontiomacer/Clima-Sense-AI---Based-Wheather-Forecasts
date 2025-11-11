# GraphCast Integration Module

This module provides GraphCast weather forecasting capabilities for the ClimaSense platform.

## Structure

```
graphcast/
├── __init__.py              # Module exports
├── config.py                # Configuration settings
├── model_manager.py         # Model loading and management
├── download_weights.py      # Weight download utility
└── test_model_manager.py    # Unit tests
```

## Configuration

The `config.py` file contains:
- Model paths and URLs
- Region boundaries (Maharashtra: 18-21°N, 73-77°E)
- Cache settings (24-hour TTL)
- Inference settings (CPU/GPU, timeouts)
- ERA5 data configuration
- Agricultural thresholds for Maharashtra

## Model Manager

The `GraphCastModelManager` class handles:
- Lazy loading of model weights
- CPU/GPU device selection
- Model validation and checksum verification
- Concurrent loading protection

### Usage

```python
from graphcast import GraphCastModelManager

# Initialize manager
manager = GraphCastModelManager(device="auto")

# Load model (lazy loading)
await manager.load_model()

# Check if loaded
if manager.is_model_loaded():
    print("Model ready for inference")

# Get model info
info = manager.get_model_info()
print(f"Model version: {info['version']}")
```

## Downloading Weights

Use the download utility to fetch GraphCast model weights:

```bash
# Download weights
python -m graphcast.download_weights

# Force re-download
python -m graphcast.download_weights --force

# Custom URL or path
python -m graphcast.download_weights --url <url> --output <path>
```

Weights are stored in `./models/graphcast/` by default.

## Testing

Run unit tests with pytest:

```bash
# Install dependencies first
pip install -r requirements.txt

# Run tests
pytest graphcast/test_model_manager.py -v
```

## Dependencies

Required packages (added to requirements.txt):
- jax[cpu]>=0.4.20
- dm-haiku>=0.0.10
- xarray>=2023.1.0
- numpy>=1.24.0
- scipy>=1.10.0
- tqdm>=4.66.0

## Directory Structure

The module creates the following directories:
- `models/graphcast/` - Model weights storage
- `cache/forecasts/` - Forecast cache (24-hour TTL)
- `data/era5/` - ERA5 initial conditions cache

## Next Steps

This completes Task 1 of the GraphCast integration. Next tasks:
1. Implement ERA5 data fetching (Task 2)
2. Build GraphCast inference pipeline (Task 3)
3. Implement agricultural metrics calculator (Task 4)

## Notes

- GraphCast is a research-grade model - predictions should be validated
- Model weights are ~1GB in size
- CPU inference: ~300s, GPU inference: ~60s
- Licensed under Apache 2.0
