/**
 * Custom hook for fetching GraphCast forecast data with lazy loading and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';

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

interface UseGraphCastForecastOptions {
  latitude: number;
  longitude: number;
  forecast_days?: number;
  enabled?: boolean; // Lazy loading control
  cacheTime?: number; // Cache duration in milliseconds
}

interface UseGraphCastForecastResult {
  data: GraphCastForecastResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// In-memory cache for forecast data
const forecastCache = new Map<string, {
  data: GraphCastForecastResponse;
  timestamp: number;
}>();

export const useGraphCastForecast = ({
  latitude,
  longitude,
  forecast_days = 10,
  enabled = true,
  cacheTime = 24 * 60 * 60 * 1000, // 24 hours default
}: UseGraphCastForecastOptions): UseGraphCastForecastResult => {
  const [data, setData] = useState<GraphCastForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Generate cache key
  const getCacheKey = useCallback(() => {
    return `forecast_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${forecast_days}`;
  }, [latitude, longitude, forecast_days]);
  
  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = forecastCache.get(cacheKey);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < cacheTime;
  }, [cacheTime]);
  
  // Fetch forecast data
  const fetchForecast = useCallback(async () => {
    const cacheKey = getCacheKey();
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      const cached = forecastCache.get(cacheKey);
      if (cached && isMountedRef.current) {
        setData(cached.data);
        setIsStale(false);
        return;
      }
    }
    
    // Mark existing data as stale if we're refetching
    if (data) {
      setIsStale(true);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/graphcast_forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          forecast_days,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const forecastData: GraphCastForecastResponse = await response.json();
      
      if (isMountedRef.current) {
        setData(forecastData);
        setIsStale(false);
        
        // Update cache
        forecastCache.set(cacheKey, {
          data: forecastData,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch forecast'));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [latitude, longitude, forecast_days, getCacheKey, isCacheValid, data]);
  
  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    const cacheKey = getCacheKey();
    // Clear cache for this key to force refetch
    forecastCache.delete(cacheKey);
    await fetchForecast();
  }, [getCacheKey, fetchForecast]);
  
  // Effect to fetch data when enabled or dependencies change
  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      fetchForecast();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, fetchForecast]);
  
  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  };
};

// Hook for prefetching forecast data (useful for preloading)
export const usePrefetchForecast = () => {
  const prefetch = useCallback(async (
    latitude: number,
    longitude: number,
    forecast_days: number = 10
  ) => {
    const cacheKey = `forecast_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${forecast_days}`;
    
    // Don't prefetch if already cached
    const cached = forecastCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return;
    }
    
    try {
      const response = await fetch('/api/graphcast_forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          forecast_days,
        }),
      });
      
      if (response.ok) {
        const forecastData: GraphCastForecastResponse = await response.json();
        forecastCache.set(cacheKey, {
          data: forecastData,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      // Silently fail for prefetch
      console.warn('Prefetch failed:', err);
    }
  }, []);
  
  return { prefetch };
};

// Utility to clear forecast cache
export const clearForecastCache = () => {
  forecastCache.clear();
};

// Utility to get cache stats
export const getForecastCacheStats = () => {
  return {
    size: forecastCache.size,
    keys: Array.from(forecastCache.keys()),
  };
};
