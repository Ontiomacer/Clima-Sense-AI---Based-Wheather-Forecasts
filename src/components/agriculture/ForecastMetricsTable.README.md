# ForecastMetricsTable Component

A comprehensive React component for displaying GraphCast weather forecast data in a sortable, expandable table format with CSV export functionality.

## Features

### ✅ Task 10.1: Table Structure
- **Sortable columns**: Click column headers to sort by date, rain risk, temperature extreme, soil moisture, or confidence
- **Color-coded risk levels**: 
  - Green (0-30): Low risk
  - Yellow (30-60): Moderate risk
  - Red (60-100): High risk
- **Weather condition icons**: Dynamic icons based on precipitation and temperature
- **Visual indicators**: Progress bars for confidence scores, colored badges for risk values

### ✅ Task 10.2: Expandable Row Details
- **Click to expand**: Click any row to view detailed weather data
- **Raw weather metrics**: Precipitation, temperature (min/max), humidity, wind speed
- **Mini-charts**: Visual progress bars showing risk indicators for each metric
- **Formatted values**: All values displayed with appropriate units (mm, °C, %, m/s)

### ✅ Task 10.3: CSV Export
- **One-click export**: Export button in table header
- **Complete data**: Includes all metrics and raw weather data
- **Automatic filename**: Generated with location and date
- **Browser download**: Triggers immediate download with proper CSV formatting

## Usage

```tsx
import ForecastMetricsTable from '@/components/agriculture/ForecastMetricsTable';

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Update other components (e.g., heatmap) based on selected date
  };

  return (
    <ForecastMetricsTable
      forecastData={forecastData}
      onDateSelect={handleDateSelect}
    />
  );
}
```

## Props

### `forecastData` (optional)
Type: `GraphCastForecastResponse`

The forecast data from the GraphCast API. Structure:

```typescript
interface GraphCastForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  forecast: Array<{
    date: string;
    rain_risk: number;          // 0-100
    temp_extreme: number;        // 0-100
    soil_moisture_proxy: number; // 0-100
    confidence_score: number;    // 0-1
    raw_data: {
      precipitation_mm: number;
      temp_max_c: number;
      temp_min_c: number;
      humidity_percent: number;
      wind_speed_ms?: number;
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

### `onDateSelect` (optional)
Type: `(date: string) => void`

Callback function triggered when a row is clicked. Receives the ISO date string of the selected forecast day.

## Features in Detail

### Sorting
- Click any column header to sort by that column
- First click: ascending order
- Second click: descending order
- Visual indicator (arrow icon) shows current sort column

### Risk Level Colors
The component uses a consistent color scheme across all risk metrics:
- **Green** (0-29): Low risk, favorable conditions
- **Yellow** (30-59): Moderate risk, caution advised
- **Red** (60-100): High risk, action required

### Weather Icons
Dynamic icons based on conditions:
- 🌧️ **CloudRain**: Precipitation > 10mm
- 🌡️ **Thermometer**: Temperature > 35°C
- 💧 **Droplets**: Normal conditions

### Expandable Details
Each row can be expanded to show:
1. **Raw Weather Data Cards**: 4 cards showing precipitation, temperature, humidity, and wind
2. **Risk Indicator Bars**: Visual progress bars for all three risk metrics
3. **Formatted Date**: Full date with weekday, month, day, and year

### CSV Export
The exported CSV includes:
- Date (formatted)
- All risk metrics (rain, temperature, soil moisture)
- Confidence score (as percentage)
- All raw weather data (precipitation, temp max/min, humidity, wind speed)

Filename format: `forecast_{region}_{YYYY-MM-DD}.csv`

## Styling

The component uses:
- **shadcn/ui** components (Card, Table, Button)
- **Tailwind CSS** for styling
- **Lucide React** icons
- Responsive design (mobile-friendly)

## Integration with Other Components

This component is designed to work alongside:
- **GraphCastHeatmap**: Share selected date via `onDateSelect` callback
- **AIAdvisory**: Display forecast data in advisory context
- **FarmingIndicators**: Integrate into agriculture page tabs

## Example

See `ForecastMetricsTableExample.tsx` for a complete working example with mock data.

## Requirements Satisfied

- ✅ **Requirement 5.2**: Display forecast data in sortable table format
- ✅ **Requirement 5.4**: Update visualization within 2 seconds of receiving data
- ✅ Visual indicators (icons, colors) for risk levels
- ✅ Expandable rows showing raw weather data
- ✅ Export to CSV functionality
- ✅ Sorting functionality for each column
- ✅ Color coding (green/yellow/red) for risk values
- ✅ Icons for weather conditions
- ✅ Mini-charts for daily trends

## Performance

- Efficient sorting with memoized data
- Minimal re-renders with React state management
- Lazy expansion (only expanded rows render details)
- CSV generation happens client-side (no server request)

## Accessibility

- Keyboard navigation support
- Semantic HTML table structure
- ARIA labels for interactive elements
- Color contrast meets WCAG standards
