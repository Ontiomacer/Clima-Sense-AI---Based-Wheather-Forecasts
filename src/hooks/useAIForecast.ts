import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ForecastData {
  date: string;
  dayLabel: string;
  temperature: {
    predicted: number;
    historical: number;
    lower: number;
    upper: number;
  };
  rainfall: {
    predicted: number;
    historical: number;
  };
  humidity: {
    predicted: number;
    historical: number;
  };
}

interface MonthlyForecast {
  month: string;
  monthKey: string;
  temperature: {
    predicted: number;
    historical: number;
    lower: number;
    upper: number;
  };
  rainfall: {
    predicted: number;
    historical: number;
  };
  humidity: {
    predicted: number;
    historical: number;
  };
}

interface AIForecastResponse {
  success: boolean;
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    humidity: number;
    description: string;
  } | null;
  historical: {
    avgTemperature: number;
    avgRainfall: number;
    avgHumidity: number;
    dataPoints: number;
  };
  forecast: {
    daily: ForecastData[];
    monthly: MonthlyForecast[];
  };
  model: {
    type: string;
    trainingDays: number;
    forecastDays: number;
    confidence: string;
    temperatureStdDev: number;
    rainfallStdDev: number;
  };
  generatedAt: string;
}

export const useAIForecast = (lat: number = 20.5937, lon: number = 78.9629, location: string = 'India') => {
  const [data, setData] = useState<AIForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Vercel serverless function in production, local server in development
        const baseUrl = import.meta.env.PROD 
          ? '' 
          : (import.meta.env.VITE_AI_FORECAST_URL || 'http://localhost:3002');
        const aiServerUrl = `${baseUrl}/api/ai-forecast`;
        
        const response = await fetch(aiServerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ lat, lon, location }),
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI forecast');
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('AI Forecast received:', result);
          setData(result);
          toast({
            title: 'Forecast Generated',
            description: `180-day AI forecast ready for ${location}`,
            variant: 'default',
          });
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load forecast';
        setError(errorMessage);
        toast({
          title: 'Forecast Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [lat, lon, location, toast]);

  return { data, loading, error };
};
