# GraphCastHeatmap Component

A React component for visualizing GraphCast weather forecast data as an interactive heatmap overlay on a Leaflet map.

## Features

✅ **Leaflet Heatmap Integration**
- Displays weather forecast data as a color-coded heatmap
- Covers Maharashtra region (18-21°N, 73-77°E)
- Smooth color gradient from green (low risk) to red (high risk)

✅ **Data Transformation**
- Converts GraphCast forecast response to heatmap data points
- Normalizes risk scores to 0-1 range for color mapping
- Handles missing data gracefully with validation
- Generates spatial grid with realistic variation

✅ **Interactive Features**
- Click on map to view detailed metrics popup
- Hover tooltips with location coordinates and risk values
- Date slider to animate through 10-day forecast
- Metric selector (rainfall risk, temperature extreme, soil moisture)

## Installation

The component requires the following dependencies (already installed):

```bash
npm install leaflet leaflet.heat react-leaflet @types/leaflet @types/leaflet.heat
```

## Usage

### Basic Usage

```tsx
import GraphCastHeatmap from '@/components/agriculture/GraphCastHeatmap';

function MyComponent() {
  const [forecastData, setForecastData] = useState(null);

  // Fetch forecast data from API
  useEffect(() => {
    fetch('/api/graphcast_forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 18.5204,
        longitude: 73.8567,
        forecast_days: 10,
      }),
    })
      .then(res => res.json())
      .then(data => setForecastData(data));
  }, []);

  return <GraphCastHeatmap forecastData={forecastData} />;
}
```

### With Props

```tsx
<GraphCastHeatmap
  forecastData={forecastData}
  selectedDate="2024-01-15"
  metric="rain_risk"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `forecastData` | `GraphCastForecastResponse` | `undefined` | Forecast data from GraphCast API |
| `selectedDate` | `string` | `undefined` | ISO date string to select specific forecast day |
| `metric` | `'rain_risk' \| 'temp_extreme' \| 'soil_moisture_proxy'` | `'rain_risk'` | Initial metric to display |

## Data Format

The component expects data in the following format:

```typescript
interface GraphCastForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  forecast: Array<{
    date: string; // ISO 8601
    rain_risk: number; // 0-100
    temp_extreme: number; // 0-100
    soil_moisture_proxy: number; // 0-100
    confidence_score: number; // 0-1
    raw_data: {
      precipitation_mm: number;
      temp_max_c: number;
      temp_min_c: number;
      humidity_percent: number;
    };
  }>;
  metadata: {
    model_version: string;
    generated_at: string;
    cache_hit: boolean;
    inference_time_ms: number;
  };
}
```

## Interactive Features

### Map Click
Click anywhere on the map to view detailed metrics for that location:
- Rainfall Risk
- Temperature Extreme
- Soil Moisture
- Raw weather data (precipitation, temperature, humidity)
- Confidence score

### Date Slider
Use the slider to navigate through forecast days (1-10). The heatmap updates in real-time to show the selected day's forecast.

### Metric Selector
Switch between three agricultural metrics:
- 🌧️ **Rainfall Risk**: Risk of excessive or insufficient rainfall
- 🌡️ **Temperature Extreme**: Risk of extreme temperatures affecting crops
- 💧 **Soil Moisture**: Estimated soil moisture levels

## Color Scale

The heatmap uses a 5-color gradient:
- 🟢 Green (0.0): Low risk
- 🟡 Yellow (0.5): Moderate risk
- 🔴 Red (1.0): High risk

## Requirements Satisfied

This component satisfies the following requirements from the GraphCast integration spec:

- **Requirement 5.1**: Displays heatmap overlay on agriculture page map showing rainfall risk across Maharashtra
- **Requirement 5.3**: Interactive tooltips on hover showing metrics
- **Requirement 5.4**: Updates visualization within 2 seconds of receiving data

## Example

See `GraphCastHeatmapExample.tsx` for a complete working example with API integration and mock data fallback.

## Notes

- The component automatically handles loading states
- Missing or invalid data is handled gracefully with console warnings
- The map is bounded to Maharashtra region for optimal performance
- Heatmap data is generated with spatial variation for realistic appearance
- All coordinates use WGS84 (EPSG:4326) projection

## Performance

- Heatmap layer is recreated when metric or date changes
- Previous layers are properly cleaned up to prevent memory leaks
- Grid generation uses ~289 points for smooth visualization
- Map rendering is optimized with Leaflet's built-in performance features
