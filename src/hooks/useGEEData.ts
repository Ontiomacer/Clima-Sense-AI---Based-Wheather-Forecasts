import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export type DatasetType = 'rainfall' | 'ndvi' | 'temperature';

interface GEEDataResponse {
  success: boolean;
  dataset: DatasetType;
  startDate: string;
  endDate: string;
  tileUrl: string;
  visParams: {
    min: number;
    max: number;
    palette: string[];
  };
  mapId: string;
  token: string;
  source?: string;
  message?: string;
}

export const useGEEData = (dataset: DatasetType, dateRange: { start: string; end: string }) => {
  const [data, setData] = useState<GEEDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGEEData = async () => {
      setLoading(true);
      setError(null);

      try {
        const geeServerUrl = import.meta.env.VITE_GEE_SERVER_URL || 'http://localhost:3001';
        const response = await fetch(`${geeServerUrl}/api/gee-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataset,
            startDate: dateRange.start,
            endDate: dateRange.end,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch GEE data');
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('GEE Data received:', result);
          console.log('Tile URL:', result.tileUrl);
          console.log('Palette:', result.visParams.palette);
          setData(result);
          if (result.message) {
            toast({
              title: 'Info',
              description: result.message,
              variant: 'default',
            });
          }
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGEEData();
  }, [dataset, dateRange.start, dateRange.end, toast]);

  return { data, loading, error };
};
