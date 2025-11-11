import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';
import ClimateMap from './ClimateMap';
import { useLanguage } from '@/i18n/LanguageContext';

const MapSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="map" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.map.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.map.subtitle}
          </p>
        </div>

        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-interactive" />
                  CHIRPS Rainfall & NDVI Visualization
                </CardTitle>
                <CardDescription>Powered by Google Earth Engine satellite data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ClimateMap />

            {/* Map Controls Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <div className="font-medium text-sm">CHIRPS Rainfall</div>
                  <div className="text-xs text-muted-foreground">Daily precipitation data from satellites</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <div className="font-medium text-sm">MODIS NDVI</div>
                  <div className="text-xs text-muted-foreground">Vegetation health index</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                <div>
                  <div className="font-medium text-sm">ECMWF Temperature</div>
                  <div className="text-xs text-muted-foreground">Surface temperature anomalies</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default MapSection;
