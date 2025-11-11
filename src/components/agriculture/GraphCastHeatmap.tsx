import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { MapContainer, TileLayer, useMap, Popup, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Extend Leaflet types for heatmap
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: any
  ): L.Layer;
}

interface GraphCastForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  forecast: Array<{
    date: string;
    rain_risk: number;
    temp_extreme: number;
    soil_moisture_proxy: number;
    confidence_score: number;
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

interface GraphCastHeatmapProps {
  forecastData?: GraphCastForecastResponse;
  selectedDate?: string;
  metric?: 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy';
}

// Maharashtra region bounds
const MAHARASHTRA_BOUNDS: L.LatLngBoundsExpression = [
  [18.0, 73.0], // Southwest
  [21.0, 77.0], // Northeast
];

const MAHARASHTRA_CENTER: L.LatLngExpression = [19.5, 75.0];

// Interactive click handler component - memoized to prevent unnecessary re-renders
const MapClickHandler = memo(({
  onLocationClick,
}: {
  onLocationClick: (lat: number, lon: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationClick(lat, lng);
    },
  });
  return null;
});

// Heatmap layer component - memoized to prevent unnecessary re-renders
const HeatmapLayer = memo(({
  data,
  metric,
  dateIndex,
}: {
  data: GraphCastForecastResponse | undefined;
  metric: 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy';
  dateIndex: number;
}) => {
  const map = useMap();
  const heatmapLayerRef = useRef<L.Layer | null>(null);

  // Memoize heatmap data generation to avoid recalculation
  const heatmapData = useMemo(() => {
    const validData = handleMissingData(data);
    if (!validData) return [];
    return generateHeatmapData(validData, metric, dateIndex);
  }, [data, metric, dateIndex]);

  useEffect(() => {
    if (heatmapData.length === 0) {
      console.warn('No heatmap data points generated');
      return;
    }

    // Remove existing heatmap layer
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
    }

    // Create heatmap layer with color gradient
    const heatmapLayer = (L as any).heatLayer(heatmapData, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.0: '#00ff00', // Green (low risk)
        0.3: '#7fff00',
        0.5: '#ffff00', // Yellow (moderate risk)
        0.7: '#ff7f00',
        1.0: '#ff0000', // Red (high risk)
      },
    });

    heatmapLayer.addTo(map);
    heatmapLayerRef.current = heatmapLayer;

    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
    };
  }, [heatmapData, map]);

  return null;
});

// Generate heatmap data points from forecast
const generateHeatmapData = (
  data: GraphCastForecastResponse,
  metric: 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy',
  dateIndex: number = 0
): Array<[number, number, number]> => {
  // Create a grid of points around the forecast location
  const { latitude, longitude } = data.location;
  const forecastDay = data.forecast[dateIndex];
  
  if (!forecastDay) return [];

  // Get the metric value and normalize to 0-1 range
  const metricValue = normalizeMetricValue(forecastDay[metric], metric);

  // Generate grid points covering Maharashtra region
  const points: Array<[number, number, number]> = [];
  const gridSize = 8; // Larger grid for better coverage
  const spacing = 0.3; // degrees (~33km at this latitude)

  // Center the grid on the forecast location
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      const lat = latitude + i * spacing;
      const lon = longitude + j * spacing;

      // Check if within Maharashtra bounds
      if (lat >= 18.0 && lat <= 21.0 && lon >= 73.0 && lon <= 77.0) {
        // Calculate distance from center for gradient effect
        const distance = Math.sqrt(i * i + j * j);
        const maxDistance = Math.sqrt(gridSize * gridSize * 2);
        const distanceFactor = 1 - (distance / maxDistance) * 0.3; // Reduce intensity with distance

        // Add spatial variation for realistic appearance
        const spatialVariation = (Math.sin(lat * 10) * Math.cos(lon * 10)) * 0.15;
        
        // Combine factors
        let intensity = metricValue * distanceFactor + spatialVariation;
        
        // Clamp to valid range [0, 1]
        intensity = Math.max(0, Math.min(1, intensity));
        
        points.push([lat, lon, intensity]);
      }
    }
  }

  return points;
};

// Normalize metric values to 0-1 range for heatmap
const normalizeMetricValue = (
  value: number,
  metric: 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy'
): number => {
  // All metrics are already in 0-100 range, normalize to 0-1
  let normalized = value / 100;
  
  // For soil moisture, invert the scale (low moisture = high risk)
  if (metric === 'soil_moisture_proxy') {
    normalized = 1 - normalized;
  }
  
  return Math.max(0, Math.min(1, normalized));
};

// Transform lat/lon coordinates (already in WGS84, no transformation needed for Leaflet)
const transformCoordinates = (lat: number, lon: number): [number, number] => {
  // Leaflet uses WGS84 (EPSG:4326) by default, same as our data
  return [lat, lon];
};

// Handle missing data points gracefully
const handleMissingData = (
  data: GraphCastForecastResponse | undefined
): GraphCastForecastResponse | null => {
  if (!data) return null;
  
  // Validate forecast data exists
  if (!data.forecast || data.forecast.length === 0) {
    console.warn('No forecast data available');
    return null;
  }
  
  // Validate location data
  if (!data.location || 
      typeof data.location.latitude !== 'number' || 
      typeof data.location.longitude !== 'number') {
    console.warn('Invalid location data');
    return null;
  }
  
  return data;
};

const GraphCastHeatmap = memo(({
  forecastData,
  selectedDate,
  metric = 'rain_risk',
}: GraphCastHeatmapProps) => {
  const [currentMetric, setCurrentMetric] = useState<
    'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy'
  >(metric);
  const [dateIndex, setDateIndex] = useState(0);
  const [loading, setLoading] = useState(!forecastData);
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // Update date index when selectedDate changes
  useEffect(() => {
    if (forecastData && selectedDate) {
      const index = forecastData.forecast.findIndex((f) => f.date === selectedDate);
      if (index !== -1) {
        setDateIndex(index);
      }
    }
  }, [selectedDate, forecastData]);

  useEffect(() => {
    if (forecastData) {
      setLoading(false);
    }
  }, [forecastData]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleLocationClick = useCallback((lat: number, lon: number) => {
    setClickedLocation({ lat, lon });
    setShowPopup(true);
  }, []);

  const handleDateChange = useCallback((value: number[]) => {
    setDateIndex(value[0]);
    setShowPopup(false); // Hide popup when changing dates
  }, []);

  const handleMetricChange = useCallback((value: string) => {
    setCurrentMetric(value as 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy');
  }, []);

  // Memoize helper functions
  const getMetricLabel = useCallback((metric: string) => {
    switch (metric) {
      case 'rain_risk':
        return 'Rainfall Risk';
      case 'temp_extreme':
        return 'Temperature Extreme';
      case 'soil_moisture_proxy':
        return 'Soil Moisture';
      default:
        return metric;
    }
  }, []);

  const getMetricColor = useCallback((value: number) => {
    if (value < 30) return 'text-green-600';
    if (value < 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Memoize current forecast to avoid recalculation
  const currentForecast = useMemo(() => 
    forecastData?.forecast[dateIndex],
    [forecastData, dateIndex]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Weather Forecast Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-1 cursor-help">
                        Metric
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Select the agricultural metric to visualize on the heatmap</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select value={currentMetric} onValueChange={handleMetricChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rain_risk">🌧️ Rainfall Risk</SelectItem>
                    <SelectItem value="temp_extreme">🌡️ Temperature Extreme</SelectItem>
                    <SelectItem value="soil_moisture_proxy">💧 Soil Moisture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {forecastData && currentForecast && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Current Value: {getMetricLabel(currentMetric)}
                  </label>
                  <div className="flex items-baseline gap-2">
                    <div className={`text-2xl font-bold ${getMetricColor(currentForecast[currentMetric])}`}>
                      {currentForecast[currentMetric].toFixed(1)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      / 100
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Confidence: {(currentForecast.confidence_score * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>

            {/* Date Slider */}
            {forecastData && forecastData.forecast.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Forecast Day: {new Date(forecastData.forecast[dateIndex].date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Day {dateIndex + 1} of {forecastData.forecast.length}
                  </span>
                </div>
                <Slider
                  value={[dateIndex]}
                  onValueChange={handleDateChange}
                  max={forecastData.forecast.length - 1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{new Date(forecastData.forecast[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(forecastData.forecast[forecastData.forecast.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="h-96 rounded-lg overflow-hidden border relative">
              <MapContainer
                center={MAHARASHTRA_CENTER}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                maxBounds={MAHARASHTRA_BOUNDS}
                maxBoundsViscosity={1.0}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatmapLayer data={forecastData} metric={currentMetric} dateIndex={dateIndex} />
                <MapClickHandler onLocationClick={handleLocationClick} />
                
                {/* Show marker and popup on clicked location */}
                {clickedLocation && showPopup && currentForecast && (
                  <Marker
                    position={[clickedLocation.lat, clickedLocation.lon]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                      iconSize: [12, 12],
                      iconAnchor: [6, 6],
                    })}
                  >
                    <Popup onClose={() => setShowPopup(false)}>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold mb-2 text-sm">
                          Location: {clickedLocation.lat.toFixed(3)}°N, {clickedLocation.lon.toFixed(3)}°E
                        </h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Rainfall Risk:</span>
                            <span className={getMetricColor(currentForecast.rain_risk)}>
                              {currentForecast.rain_risk.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temp Extreme:</span>
                            <span className={getMetricColor(currentForecast.temp_extreme)}>
                              {currentForecast.temp_extreme.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Soil Moisture:</span>
                            <span className={getMetricColor(100 - currentForecast.soil_moisture_proxy)}>
                              {currentForecast.soil_moisture_proxy.toFixed(1)}%
                            </span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between">
                            <span>Precipitation:</span>
                            <span>{currentForecast.raw_data.precipitation_mm.toFixed(1)} mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Temp Range:</span>
                            <span>
                              {currentForecast.raw_data.temp_min_c.toFixed(1)}° - {currentForecast.raw_data.temp_max_c.toFixed(1)}°C
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Humidity:</span>
                            <span>{currentForecast.raw_data.humidity_percent.toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Confidence:</span>
                            <span>{(currentForecast.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
              
              {/* Hover instruction overlay */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs flex items-center gap-2 z-[1000]">
                <Info className="w-4 h-4 text-primary" />
                <span>Click on map to view detailed metrics</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Moderate Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>High Risk</span>
              </div>
            </div>

            {forecastData && (
              <div className="text-xs text-muted-foreground text-center">
                Location: {forecastData.location.region} ({forecastData.location.latitude.toFixed(2)}°N,{' '}
                {forecastData.location.longitude.toFixed(2)}°E)
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

GraphCastHeatmap.displayName = 'GraphCastHeatmap';

export default GraphCastHeatmap;
