import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, CloudRain, Wind, Leaf, AlertCircle, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  
  const metrics = [
    {
      icon: Thermometer,
      title: t.forecast.temperature,
      value: '28.5°C',
      change: '+2.3°',
      trend: 'up',
      description: t.dashboard.currentAvgTemp,
      color: 'text-interactive',
    },
    {
      icon: CloudRain,
      title: t.forecast.precipitation,
      value: '245mm',
      change: '-12%',
      trend: 'down',
      description: t.dashboard.rainfall30Day,
      color: 'text-interactive',
    },
    {
      icon: Wind,
      title: t.forecast.windSpeed,
      value: '12.8 km/h',
      change: '+5%',
      trend: 'up',
      description: t.dashboard.avgWindSpeed,
      color: 'text-interactive',
    },
    {
      icon: Leaf,
      title: t.dashboard.ndvi,
      value: '0.72',
      change: '+0.08',
      trend: 'up',
      description: t.dashboard.vegetationHealth,
      color: 'text-accent',
    },
  ];

  return (
    <section id="dashboard" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.dashboard.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.title}
                className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className="text-3xl font-bold">{metric.value}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={metric.trend === 'up' ? 'text-accent' : 'text-destructive'}>
                        {metric.change}
                      </span>
                      <span className="text-muted-foreground">{metric.description}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Climate Risk Index */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-interactive" />
                {t.dashboard.aiClimateRiskIndex}
              </CardTitle>
              <CardDescription>{t.dashboard.riskAssessment}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-full bg-gradient-accent opacity-20 animate-pulse-glow" />
                  <div className="absolute inset-4 rounded-full bg-accent flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{t.dashboard.moderate}</div>
                      <div className="text-sm text-accent-foreground/80">Risk Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-interactive" />
                {t.dashboard.keyInsights}
              </CardTitle>
              <CardDescription>{t.dashboard.aiRecommendations}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <div>
                    <div className="font-medium">{t.dashboard.waterConservation}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.dashboard.rainfallBelow}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-interactive mt-2" />
                  <div>
                    <div className="font-medium">{t.dashboard.temperatureRising}</div>
                    <div className="text-sm text-muted-foreground">
                      {t.dashboard.expectedAbove}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <div>
                    <div className="font-medium">{t.dashboard.vegetationStrong}</div>
                    <div className="text-sm text-muted-foreground">
                      NDVI index showing positive growth
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
