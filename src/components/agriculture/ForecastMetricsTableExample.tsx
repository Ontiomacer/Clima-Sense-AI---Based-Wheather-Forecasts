import { useState } from 'react';
import ForecastMetricsTable from './ForecastMetricsTable';

// Example usage of ForecastMetricsTable component
const ForecastMetricsTableExample = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Mock forecast data matching the GraphCast API response format
  const mockForecastData = {
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      region: 'Pune, Maharashtra',
    },
    forecast: [
      {
        date: '2024-11-10T00:00:00Z',
        rain_risk: 25.5,
        temp_extreme: 42.3,
        soil_moisture_proxy: 68.2,
        confidence_score: 0.92,
        raw_data: {
          precipitation_mm: 2.3,
          temp_max_c: 32.5,
          temp_min_c: 22.1,
          humidity_percent: 65,
          wind_speed_ms: 3.2,
        },
      },
      {
        date: '2024-11-11T00:00:00Z',
        rain_risk: 68.7,
        temp_extreme: 28.1,
        soil_moisture_proxy: 72.5,
        confidence_score: 0.89,
        raw_data: {
          precipitation_mm: 15.8,
          temp_max_c: 29.3,
          temp_min_c: 21.5,
          humidity_percent: 78,
          wind_speed_ms: 4.5,
        },
      },
      {
        date: '2024-11-12T00:00:00Z',
        rain_risk: 82.3,
        temp_extreme: 35.6,
        soil_moisture_proxy: 58.9,
        confidence_score: 0.85,
        raw_data: {
          precipitation_mm: 28.5,
          temp_max_c: 31.8,
          temp_min_c: 23.2,
          humidity_percent: 82,
          wind_speed_ms: 5.1,
        },
      },
      {
        date: '2024-11-13T00:00:00Z',
        rain_risk: 45.2,
        temp_extreme: 52.8,
        soil_moisture_proxy: 55.3,
        confidence_score: 0.81,
        raw_data: {
          precipitation_mm: 8.2,
          temp_max_c: 34.2,
          temp_min_c: 24.5,
          humidity_percent: 70,
          wind_speed_ms: 3.8,
        },
      },
      {
        date: '2024-11-14T00:00:00Z',
        rain_risk: 18.5,
        temp_extreme: 38.9,
        soil_moisture_proxy: 48.7,
        confidence_score: 0.78,
        raw_data: {
          precipitation_mm: 1.2,
          temp_max_c: 33.5,
          temp_min_c: 23.8,
          humidity_percent: 62,
          wind_speed_ms: 2.9,
        },
      },
      {
        date: '2024-11-15T00:00:00Z',
        rain_risk: 32.8,
        temp_extreme: 44.5,
        soil_moisture_proxy: 42.1,
        confidence_score: 0.74,
        raw_data: {
          precipitation_mm: 4.5,
          temp_max_c: 34.8,
          temp_min_c: 24.2,
          humidity_percent: 58,
          wind_speed_ms: 3.5,
        },
      },
      {
        date: '2024-11-16T00:00:00Z',
        rain_risk: 55.6,
        temp_extreme: 31.2,
        soil_moisture_proxy: 51.8,
        confidence_score: 0.70,
        raw_data: {
          precipitation_mm: 12.3,
          temp_max_c: 30.5,
          temp_min_c: 22.8,
          humidity_percent: 75,
          wind_speed_ms: 4.2,
        },
      },
      {
        date: '2024-11-17T00:00:00Z',
        rain_risk: 72.4,
        temp_extreme: 26.7,
        soil_moisture_proxy: 62.5,
        confidence_score: 0.66,
        raw_data: {
          precipitation_mm: 18.7,
          temp_max_c: 28.9,
          temp_min_c: 21.3,
          humidity_percent: 80,
          wind_speed_ms: 4.8,
        },
      },
      {
        date: '2024-11-18T00:00:00Z',
        rain_risk: 38.9,
        temp_extreme: 48.3,
        soil_moisture_proxy: 45.2,
        confidence_score: 0.62,
        raw_data: {
          precipitation_mm: 6.8,
          temp_max_c: 35.2,
          temp_min_c: 25.1,
          humidity_percent: 64,
          wind_speed_ms: 3.3,
        },
      },
      {
        date: '2024-11-19T00:00:00Z',
        rain_risk: 22.1,
        temp_extreme: 55.8,
        soil_moisture_proxy: 38.6,
        confidence_score: 0.58,
        raw_data: {
          precipitation_mm: 2.1,
          temp_max_c: 36.5,
          temp_min_c: 25.8,
          humidity_percent: 55,
          wind_speed_ms: 2.7,
        },
      },
    ],
    metadata: {
      model_version: 'GraphCast-v1.0',
      generated_at: '2024-11-09T12:00:00Z',
      cache_hit: false,
      inference_time_ms: 45230,
    },
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">ForecastMetricsTable Example</h1>
      
      {selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm">
            <strong>Selected Date:</strong> {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
      )}

      <ForecastMetricsTable
        forecastData={mockForecastData}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
};

export default ForecastMetricsTableExample;
