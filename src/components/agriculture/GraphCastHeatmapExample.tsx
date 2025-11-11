import { useState, useEffect } from 'react';
import GraphCastHeatmap from './GraphCastHeatmap';

/**
 * Example usage of GraphCastHeatmap component
 * This demonstrates how to integrate the heatmap with GraphCast API data
 */
const GraphCastHeatmapExample = () => {
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGraphCastForecast();
  }, []);

  const fetchGraphCastForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      // Example: Fetch forecast for Pune, Maharashtra
      const response = await fetch('/api/graphcast_forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: 18.5204,
          longitude: 73.8567,
          forecast_days: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      console.error('Failed to fetch GraphCast forecast:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
      
      // Use mock data for demonstration
      setForecastData(getMockForecastData());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error && !forecastData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchGraphCastForecast}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ Using mock data: {error}
        </div>
      )}
      <GraphCastHeatmap forecastData={forecastData} />
    </div>
  );
};

// Mock data for demonstration purposes
const getMockForecastData = () => ({
  location: {
    latitude: 18.5204,
    longitude: 73.8567,
    region: 'Pune, Maharashtra',
  },
  forecast: Array.from({ length: 10 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString(),
      rain_risk: Math.random() * 100,
      temp_extreme: Math.random() * 100,
      soil_moisture_proxy: 30 + Math.random() * 40,
      confidence_score: 0.95 - i * 0.05,
      raw_data: {
        precipitation_mm: Math.random() * 50,
        temp_max_c: 30 + Math.random() * 10,
        temp_min_c: 20 + Math.random() * 5,
        humidity_percent: 60 + Math.random() * 30,
      },
    };
  }),
  metadata: {
    model_version: 'GraphCast-v1.0',
    generated_at: new Date().toISOString(),
    cache_hit: false,
    inference_time_ms: 1500,
  },
});

export default GraphCastHeatmapExample;
