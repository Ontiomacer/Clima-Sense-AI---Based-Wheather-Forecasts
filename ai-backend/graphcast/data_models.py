"""
GraphCast Data Models
Defines data structures for forecast results and related entities.
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Any, Optional
import json


@dataclass
class Location:
    """Geographic location information"""
    latitude: float
    longitude: float
    region: str


@dataclass
class RawWeatherData:
    """Raw weather data from GraphCast predictions"""
    precipitation_mm: float
    temp_max_c: float
    temp_min_c: float
    temp_mean_c: float
    humidity_percent: float
    wind_speed_ms: float


@dataclass
class ForecastDay:
    """Single day forecast with agricultural metrics"""
    date: datetime
    rain_risk: float  # 0-100
    temp_extreme: float  # 0-100
    soil_moisture_proxy: float  # 0-100
    confidence_score: float  # 0-1
    raw_weather: RawWeatherData
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with ISO format dates"""
        data = asdict(self)
        data['date'] = self.date.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ForecastDay':
        """Create from dictionary with ISO format dates"""
        data = data.copy()
        data['date'] = datetime.fromisoformat(data['date'])
        data['raw_weather'] = RawWeatherData(**data['raw_weather'])
        return cls(**data)


@dataclass
class ForecastMetadata:
    """Metadata about forecast generation"""
    model_version: str
    generated_at: datetime
    cache_hit: bool
    inference_time_ms: int
    era5_timestamp: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with ISO format dates"""
        data = asdict(self)
        data['generated_at'] = self.generated_at.isoformat()
        if self.era5_timestamp:
            data['era5_timestamp'] = self.era5_timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ForecastMetadata':
        """Create from dictionary with ISO format dates"""
        data = data.copy()
        data['generated_at'] = datetime.fromisoformat(data['generated_at'])
        if data.get('era5_timestamp'):
            data['era5_timestamp'] = datetime.fromisoformat(data['era5_timestamp'])
        return cls(**data)


@dataclass
class ForecastResult:
    """Complete forecast result with all data"""
    location: Location
    forecast_days: List[ForecastDay]
    metadata: ForecastMetadata
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'location': asdict(self.location),
            'forecast_days': [day.to_dict() for day in self.forecast_days],
            'metadata': self.metadata.to_dict()
        }
    
    def to_json(self) -> str:
        """Serialize to JSON string"""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ForecastResult':
        """Create from dictionary"""
        data = data.copy()
        data['location'] = Location(**data['location'])
        data['forecast_days'] = [ForecastDay.from_dict(day) for day in data['forecast_days']]
        data['metadata'] = ForecastMetadata.from_dict(data['metadata'])
        return cls(**data)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'ForecastResult':
        """Deserialize from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)
