import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Satellite, Brain, Cloud, Globe } from 'lucide-react';

const About = () => {
  const dataSources = [
    {
      icon: Satellite,
      name: 'Google Earth Engine',
      description: 'Satellite imagery and geospatial datasets for comprehensive environmental monitoring',
    },
    {
      icon: Cloud,
      name: 'CHIRPS',
      description: 'Climate Hazards Group InfraRed Precipitation with Station data for rainfall analysis',
    },
    {
      icon: Globe,
      name: 'OpenWeather',
      description: 'Real-time weather data and forecasts for accurate short-term predictions',
    },
    {
      icon: Brain,
      name: 'NASA POWER',
      description: 'Prediction Of Worldwide Energy Resources for solar and meteorological data',
    },
  ];

  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">About ClimaSense</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligence for a Sustainable Planet
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card mb-12 max-w-4xl mx-auto animate-fade-in">
          <CardContent className="p-8">
            <p className="text-lg leading-relaxed text-center">
              ClimaSense uses <span className="font-semibold text-interactive">NASA POWER</span>,{' '}
              <span className="font-semibold text-interactive">OpenWeather</span>, and{' '}
              <span className="font-semibold text-interactive">CHIRPS</span> (via Google Earth Engine) to
              deliver AI-based forecasts and actionable climate insights for sustainable planning. Our mission
              is to transform complex satellite data into accessible intelligence that empowers communities,
              farmers, and policymakers to make informed decisions for a climate-resilient future.
            </p>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-8 text-center">Our Data Partners</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataSources.map((source, index) => {
              const Icon = source.icon;
              return (
                <Card
                  key={source.name}
                  className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-interactive/10">
                        <Icon className="w-8 h-8 text-interactive" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-lg">{source.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">{source.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Section (Placeholder) */}
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <h3 className="text-2xl font-bold mb-6">Our Mission</h3>
          <p className="text-muted-foreground mb-8">
            We believe that access to accurate, timely climate intelligence should be universal. By combining
            cutting-edge AI with proven satellite data sources, we're democratizing climate forecasting and
            making it accessible to those who need it most - from smallholder farmers to urban planners.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-accent/20 text-accent-foreground font-medium">
              Climate Resilience
            </span>
            <span className="px-4 py-2 rounded-full bg-interactive/20 text-interactive font-medium">
              Data-Driven Decisions
            </span>
            <span className="px-4 py-2 rounded-full bg-primary/20 text-primary-foreground font-medium">
              Sustainable Future
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
