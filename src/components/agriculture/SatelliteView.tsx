import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Satellite, Maximize2, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGEEData } from '@/hooks/useGEEData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SatelliteViewProps {
  filters: any;
}

// Region coordinates for map centering
const REGION_COORDS: Record<string, { lat: number; lon: number; zoom: number }> = {
  maharashtra: { lat: 19.5, lon: 75.0, zoom: 7 },
  pune: { lat: 18.5204, lon: 73.8567, zoom: 10 },
  mumbai: { lat: 19.0760, lon: 72.8777, zoom: 10 },
  nagpur: { lat: 21.1458, lon: 79.0882, zoom: 10 },
  nashik: { lat: 19.9975, lon: 73.7898, zoom: 10 },
};

const SatelliteView = ({ filters }: SatelliteViewProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'ndvi' | 'rainfall' | 'temperature'>('ndvi');
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Calculate date range (last 30 days)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch GEE data for active layer
  const { data: geeData, loading, error } = useGEEData(activeLayer, {
    start: startDate,
    end: endDate,
  });

  const satelliteLayers = [
    {
      id: 'ndvi' as const,
      name: 'NDVI (Vegetation)',
      description: 'Normalized Difference Vegetation Index',
      color: 'from-red-500 via-yellow-500 to-green-500',
      source: 'MODIS/061/MOD13Q1',
    },
    {
      id: 'rainfall' as const,
      name: 'Rainfall',
      description: 'Precipitation data',
      color: 'from-orange-500 via-white to-blue-500',
      source: 'UCSB-CHG/CHIRPS/DAILY',
    },
    {
      id: 'temperature' as const,
      name: 'Temperature',
      description: 'Surface temperature',
      color: 'from-blue-500 via-white to-red-500',
      source: 'ECMWF/ERA5_LAND/DAILY_AGGR',
    },
  ];

  // Initialize map when container is ready
  useEffect(() => {
    // Clean up existing map first
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapInitialized(false);
    }

    if (!mapContainerRef.current) return;

    // Small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const regionCoords = REGION_COORDS[filters.region] || REGION_COORDS.maharashtra;

      try {
        console.log('Initializing Leaflet map...');
        
        // Create map
        const map = L.map(mapContainerRef.current, {
          center: [regionCoords.lat, regionCoords.lon],
          zoom: regionCoords.zoom,
          zoomControl: true,
          preferCanvas: true,
        });

        // Add base layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        mapRef.current = map;
        setMapInitialized(true);

        console.log('Map initialized successfully');

        // Force map to resize after initialization
        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 200);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [filters.region, activeLayer]);

  // Update map center when region changes
  useEffect(() => {
    if (!mapRef.current) return;

    const regionCoords = REGION_COORDS[filters.region] || REGION_COORDS.maharashtra;
    mapRef.current.setView([regionCoords.lat, regionCoords.lon], regionCoords.zoom);
  }, [filters.region]);

  // Update satellite layer when GEE data changes
  useEffect(() => {
    if (!mapRef.current || !geeData || !geeData.tileUrl) return;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    // Add new GEE tile layer
    const tileLayer = L.tileLayer(geeData.tileUrl, {
      attribution: `Google Earth Engine - ${geeData.source || 'GEE'}`,
      maxZoom: 18,
      opacity: 0.7,
    });

    tileLayer.addTo(mapRef.current);
    tileLayerRef.current = tileLayer;

    return () => {
      if (tileLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
    };
  }, [geeData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-primary" />
            Satellite Visualization
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              <Maximize2 className="w-4 h-4 mr-2" />
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeLayer} onValueChange={(value) => setActiveLayer(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            {satelliteLayers.map((layer) => (
              <TabsTrigger key={layer.id} value={layer.id} className="text-xs">
                {layer.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {satelliteLayers.map((layer) => (
            <TabsContent key={layer.id} value={layer.id} className="mt-4">
              <div className="space-y-4">
                {/* Loading State */}
                {loading && (
                  <div className={`relative w-full ${expanded ? 'h-[600px]' : 'h-[400px]'} bg-muted rounded-lg flex items-center justify-center`}>
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Loading satellite data...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Map Container */}
                {!loading && !error && (
                  <div className="relative" key={`map-${layer.id}`}>
                    <div
                      ref={mapContainerRef}
                      id={`map-${layer.id}`}
                      className={`w-full ${expanded ? 'h-[600px]' : 'h-[400px]'} rounded-lg overflow-hidden border border-border bg-gray-100`}
                      style={{ zIndex: 0 }}
                    />

                    {/* Legend */}
                    {geeData && (
                      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 z-[1000]">
                        <p className="text-xs text-white font-semibold mb-2">Legend</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-32 h-3 rounded bg-gradient-to-r ${layer.color}`}></div>
                        </div>
                        <div className="flex justify-between text-xs text-white/80 mt-1">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {geeData && (
                      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white z-[1000]">
                        <p className="text-xs">
                          <strong>Date Range:</strong> {startDate} to {endDate}
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Source:</strong> {layer.source}
                        </p>
                        <p className="text-xs mt-1">
                          <strong>Region:</strong> {filters.region.charAt(0).toUpperCase() + filters.region.slice(1)}
                        </p>
                        {geeData.source && (
                          <p className="text-xs mt-1">
                            <strong>Data:</strong> {geeData.source === 'real-gee-data' ? '🟢 Live' : '🟡 Fallback'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Insights */}
                {geeData && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2">📡 Satellite Data Information</p>
                    <p className="text-xs text-muted-foreground">
                      {layer.id === 'ndvi' &&
                        'NDVI (Normalized Difference Vegetation Index) measures vegetation health. Higher values (green) indicate healthy, dense vegetation, while lower values (brown/red) indicate sparse or stressed vegetation.'}
                      {layer.id === 'rainfall' &&
                        'Rainfall data from CHIRPS shows precipitation patterns. Blue areas indicate higher rainfall, while orange/red areas show lower precipitation.'}
                      {layer.id === 'temperature' &&
                        'Surface temperature from ERA5 Land. Red areas indicate higher temperatures, blue areas show cooler temperatures. Useful for identifying heat stress zones.'}
                    </p>
                    {geeData.message && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        ℹ️ {geeData.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Note:</strong> Satellite data is updated every 8-16 days depending on cloud cover and
            satellite revisit time. Click "Expand" for full-screen view.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SatelliteView;
