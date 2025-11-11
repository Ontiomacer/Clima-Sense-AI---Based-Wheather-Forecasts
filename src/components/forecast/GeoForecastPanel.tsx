import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Map, Droplets, Leaf, Thermometer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGEEData } from '@/hooks/useGEEData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoForecastPanelProps {
  location: { lat: number; lon: number; name: string };
}

const GEEOverlay = ({ tileUrl, mapId, token }: any) => {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    if (tileUrl) {
      const layer = L.tileLayer(tileUrl, {
        attribution: '© Google Earth Engine',
        opacity: 0.7,
        maxZoom: 18,
      });

      layer.addTo(map);
      layerRef.current = layer;
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [tileUrl, mapId, token, map]);

  return null;
};

const GeoForecastPanel = ({ location }: GeoForecastPanelProps) => {
  const [activeDataset, setActiveDataset] = useState<'rainfall' | 'ndvi' | 'temperature'>('rainfall');
  const [tooltipData, setTooltipData] = useState<any>(null);

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: geeData, loading } = useGEEData(activeDataset, {
    start: startDate,
    end: endDate,
  });

  const datasets = [
    { id: 'rainfall' as const, label: 'Rainfall', icon: Droplets, color: 'text-blue-600' },
    { id: 'ndvi' as const, label: 'NDVI', icon: Leaf, color: 'text-green-600' },
    { id: 'temperature' as const, label: 'Temperature', icon: Thermometer, color: 'text-red-600' },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-600" />
          Interactive Geo Forecast Panel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time satellite data from Google Earth Engine
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDataset} onValueChange={(v) => setActiveDataset(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {datasets.map((dataset) => (
              <TabsTrigger key={dataset.id} value={dataset.id} className="gap-2">
                <dataset.icon className={`w-4 h-4 ${dataset.color}`} />
                {dataset.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative h-[400px] rounded-lg overflow-hidden border border-border">
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading {activeDataset} data...</p>
                </div>
              </div>
            )}

            <MapContainer
              center={[location.lat, location.lon]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {geeData && (
                <GEEOverlay
                  tileUrl={geeData.tileUrl}
                  mapId={geeData.mapId}
                  token={geeData.token}
                />
              )}
            </MapContainer>

            {/* Tooltip overlay */}
            {tooltipData && (
              <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-20">
                <div className="text-sm font-semibold mb-2">📍 {location.name}</div>
                <div className="text-xs space-y-1">
                  {activeDataset === 'rainfall' && (
                    <>
                      <div>Rainfall: 185mm (↑12%)</div>
                      <div>30-day total</div>
                    </>
                  )}
                  {activeDataset === 'ndvi' && (
                    <>
                      <div>NDVI: 0.46</div>
                      <div>Vegetation Health: Moderate</div>
                    </>
                  )}
                  {activeDataset === 'temperature' && (
                    <>
                      <div>Temperature: 29°C</div>
                      <div>Above average</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          {geeData && (
            <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-muted/20">
              <span className="text-sm font-medium">Legend:</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-32 rounded"
                  style={{
                    background: `linear-gradient(to right, ${geeData.visParams.palette.map((c: string) => c.startsWith('#') ? c : `#${c}`).join(', ')})`,
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {geeData.visParams.min} - {geeData.visParams.max}
                </span>
              </div>
              {geeData.source && (
                <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary ml-auto">
                  {geeData.source === 'real-gee-data' ? '✓ Real GEE Data' : '⚠ Mock Data'}
                </span>
              )}
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GeoForecastPanel;
