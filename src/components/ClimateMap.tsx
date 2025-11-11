import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Layers, Calendar, MapPin, X } from 'lucide-react';
import { useGEEData, DatasetType } from '@/hooks/useGEEData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GEELayerProps {
  tileUrl: string;
  mapId: string;
  token: string;
}

const GEELayer = ({ tileUrl, mapId, token }: GEELayerProps) => {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    console.log('GEE Layer - Tile URL:', tileUrl);
    console.log('GEE Layer - Map ID:', mapId);
    console.log('GEE Layer - Token:', token);

    // The tileUrl from GEE already contains the full path, just use it directly
    const layer = L.tileLayer(tileUrl, {
      attribution: '© Google Earth Engine',
      opacity: 0.9,
      maxZoom: 18,
      minZoom: 2,
      crossOrigin: true,
      className: 'gee-layer',
    });

    // Add error handling
    layer.on('tileerror', (error: any) => {
      console.error('Tile loading error:', error);
    });

    layer.on('tileload', () => {
      console.log('Tile loaded successfully');
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [tileUrl, mapId, token, map]);

  return null;
};

interface PointData {
  lat: number;
  lon: number;
  value: number | null;
  loading: boolean;
  locationName?: string;
}

interface MapClickHandlerProps {
  onLocationClick: (lat: number, lon: number) => void;
  selectedPoint: PointData | null;
}

const MapClickHandler = ({ onLocationClick, selectedPoint }: MapClickHandlerProps) => {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return selectedPoint ? (
    <Marker position={[selectedPoint.lat, selectedPoint.lon]}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <p className="font-semibold text-sm mb-1">
            {selectedPoint.locationName || 'Selected Location'}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Lat: {selectedPoint.lat.toFixed(4)}, Lon: {selectedPoint.lon.toFixed(4)}
          </p>
          {selectedPoint.loading ? (
            <p className="text-xs">Loading data...</p>
          ) : selectedPoint.value !== null ? (
            <p className="text-sm font-medium">Value: {selectedPoint.value.toFixed(2)}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No data available</p>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null;
};

const ClimateMap = () => {
  const [activeDataset, setActiveDataset] = useState<DatasetType>('rainfall');
  const [daysBack, setDaysBack] = useState([30]);
  const [selectedPoint, setSelectedPoint] = useState<PointData | null>(null);
  const [showDataPanel, setShowDataPanel] = useState(false);
  
  // Use dates from 2025 (current year)
  // CHIRPS data is available up to near-present with ~2 day delay
  // Using October 2025 as end date (adjust based on data availability)
  const endDate = '2025-10-01';
  const startDate = new Date(new Date('2025-10-01').getTime() - daysBack[0] * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data, loading } = useGEEData(activeDataset, {
    start: startDate,
    end: endDate,
  });

  const handleLocationClick = async (lat: number, lon: number) => {
    setSelectedPoint({
      lat,
      lon,
      value: null,
      loading: true,
    });
    setShowDataPanel(true);

    try {
      // Fetch point data from GEE server
      const geeServerUrl = import.meta.env.VITE_GEE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${geeServerUrl}/api/point-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon,
          dataset: activeDataset,
          startDate,
          endDate,
        }),
      });

      const pointData = await response.json();
      
      // Get location name using reverse geocoding
      let locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const geoData = await geoResponse.json();
        if (geoData.address) {
          locationName = geoData.address.city || geoData.address.state || geoData.address.country || locationName;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }

      setSelectedPoint({
        lat,
        lon,
        value: pointData.value,
        loading: false,
        locationName,
      });
    } catch (error) {
      console.error('Error fetching point data:', error);
      setSelectedPoint({
        lat,
        lon,
        value: null,
        loading: false,
      });
    }
  };

  const datasets = [
    { id: 'rainfall' as DatasetType, label: 'Rainfall', color: 'bg-blue-500' },
    { id: 'ndvi' as DatasetType, label: 'NDVI', color: 'bg-green-500' },
    { id: 'temperature' as DatasetType, label: 'Temperature', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {datasets.map((dataset) => (
            <Button
              key={dataset.id}
              variant={activeDataset === dataset.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveDataset(dataset.id)}
              className="gap-2"
            >
              <div className={`w-3 h-3 rounded-full ${dataset.color}`} />
              {dataset.label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Last {daysBack[0]} days
          </span>
        </div>
      </div>

      {/* Date Range Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Date Range</label>
          <span className="text-xs text-muted-foreground">
            {startDate} to {endDate}
          </span>
        </div>
        <Slider
          value={daysBack}
          onValueChange={setDaysBack}
          min={7}
          max={30}
          step={1}
          className="w-full"
        />
      </div>

      {/* Map Container */}
      <div className="relative aspect-video bg-muted/30 rounded-lg overflow-hidden border border-border/50">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Layers className="w-8 h-8 mx-auto animate-pulse text-primary" />
              <p className="text-sm text-muted-foreground">Loading {activeDataset} data...</p>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[20, 78]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {data && (
            <GEELayer
              tileUrl={data.tileUrl}
              mapId={data.mapId}
              token={data.token}
            />
          )}
          
          <MapClickHandler 
            onLocationClick={handleLocationClick}
            selectedPoint={selectedPoint}
          />
        </MapContainer>
        
        {/* Click instruction overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Click anywhere on the map to fetch data</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      {data && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
            <span className="text-sm font-medium">Legend:</span>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-32 rounded"
                style={{
                  background: `linear-gradient(to right, ${data.visParams.palette.map(c => c.startsWith('#') ? c : `#${c}`).join(', ')})`,
                }}
              />
              <span className="text-xs text-muted-foreground">
                {data.visParams.min} - {data.visParams.max}
                {activeDataset === 'temperature' && ' K'}
                {activeDataset === 'rainfall' && ' mm'}
              </span>
            </div>
            {data.source && (
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                {data.source === 'real-gee-data' ? '✓ Real GEE Data' : '⚠ Mock Data'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Point Data Panel */}
      {showDataPanel && selectedPoint && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location Data
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDataPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="text-sm font-medium">
                  {selectedPoint.locationName || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
                <p className="text-sm font-mono">
                  {selectedPoint.lat.toFixed(4)}°, {selectedPoint.lon.toFixed(4)}°
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {activeDataset.charAt(0).toUpperCase() + activeDataset.slice(1)} Data
              </p>
              {selectedPoint.loading ? (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 animate-pulse text-primary" />
                  <span>Fetching data...</span>
                </div>
              ) : selectedPoint.value !== null ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {selectedPoint.value.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {activeDataset === 'temperature' && 'K'}
                      {activeDataset === 'rainfall' && 'mm'}
                      {activeDataset === 'ndvi' && '(index)'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average for period: {startDate} to {endDate}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data available for this location
                </p>
              )}
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                💡 Click anywhere on the map to fetch data for a different location
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClimateMap;
