import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Satellite, Maximize2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SatelliteViewProps {
  filters: any;
}

const SatelliteView = ({ filters }: SatelliteViewProps) => {
  const [expanded, setExpanded] = useState(false);

  const satelliteLayers = [
    {
      id: 'ndvi',
      name: 'NDVI (Vegetation)',
      description: 'Normalized Difference Vegetation Index',
      color: 'from-red-500 via-yellow-500 to-green-500',
    },
    {
      id: 'rainfall',
      name: 'Rainfall Anomaly',
      description: 'Deviation from normal rainfall',
      color: 'from-orange-500 via-white to-blue-500',
    },
    {
      id: 'temperature',
      name: 'Temperature Anomaly',
      description: 'Deviation from average temperature',
      color: 'from-blue-500 via-white to-red-500',
    },
    {
      id: 'moisture',
      name: 'Soil Moisture',
      description: 'Surface soil moisture levels',
      color: 'from-yellow-500 via-green-500 to-blue-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-primary" />
            Satellite Visualization
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
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
        <Tabs defaultValue="ndvi">
          <TabsList className="grid w-full grid-cols-4">
            {satelliteLayers.map((layer) => (
              <TabsTrigger key={layer.id} value={layer.id} className="text-xs">
                {layer.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {satelliteLayers.map((layer) => (
            <TabsContent key={layer.id} value={layer.id} className="mt-4">
              <div className="space-y-4">
                {/* Satellite Image Placeholder */}
                <div
                  className={`relative w-full ${expanded ? 'h-[600px]' : 'h-[400px]'} bg-gradient-to-br ${
                    layer.color
                  } rounded-lg overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Satellite className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold">{layer.name}</p>
                      <p className="text-sm opacity-75">{layer.description}</p>
                      <p className="text-xs mt-4 opacity-60">
                        Region: {filters.region.charAt(0).toUpperCase() + filters.region.slice(1)}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        🛰️ Data from Google Earth Engine (MODIS/Sentinel-2)
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-white font-semibold mb-2">Legend</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-32 h-3 rounded bg-gradient-to-r ${layer.color}`}></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/80 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
                    <p className="text-xs">
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-1">
                      <strong>Resolution:</strong> 250m
                    </p>
                    <p className="text-xs mt-1">
                      <strong>Source:</strong> {layer.id === 'ndvi' ? 'MODIS' : 'Sentinel-2'}
                    </p>
                  </div>
                </div>

                {/* Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-1">Average Value</p>
                      <p className="text-2xl font-bold">
                        {layer.id === 'ndvi' && '0.68'}
                        {layer.id === 'rainfall' && '-11%'}
                        {layer.id === 'temperature' && '+2.1°C'}
                        {layer.id === 'moisture' && '42%'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-1">Trend</p>
                      <p className="text-2xl font-bold text-green-500">
                        {layer.id === 'ndvi' && '↑ Improving'}
                        {layer.id === 'rainfall' && '↓ Declining'}
                        {layer.id === 'temperature' && '↑ Rising'}
                        {layer.id === 'moisture' && '↓ Decreasing'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium mb-1">Status</p>
                      <p className="text-2xl font-bold">
                        {layer.id === 'ndvi' && '🟢 Healthy'}
                        {layer.id === 'rainfall' && '🟠 Deficit'}
                        {layer.id === 'temperature' && '🟢 Normal'}
                        {layer.id === 'moisture' && '🟡 Moderate'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Satellite Insights</p>
                  <p className="text-xs text-muted-foreground">
                    {layer.id === 'ndvi' &&
                      'Vegetation index shows healthy crop growth across the region. NDVI values above 0.6 indicate good photosynthetic activity.'}
                    {layer.id === 'rainfall' &&
                      'Rainfall anomaly indicates 11% deficit compared to historical average. Monitor soil moisture and plan irrigation.'}
                    {layer.id === 'temperature' &&
                      'Temperature anomaly shows +2.1°C above normal. Crops are within tolerance but monitor for heat stress.'}
                    {layer.id === 'moisture' &&
                      'Soil moisture at moderate levels. Surface moisture declining - irrigation recommended within 3 days.'}
                  </p>
                </div>
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
