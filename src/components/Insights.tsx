import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, Sprout, AlertTriangle, TrendingUp, Shield, Sun } from 'lucide-react';

const Insights = () => {
  const insights = [
    {
      icon: Droplet,
      title: 'Water Conservation Priority',
      description: 'Implement drip irrigation systems to reduce water usage by 40% in drought-prone regions.',
      priority: 'High',
      color: 'bg-interactive/10 text-interactive',
    },
    {
      icon: Sprout,
      title: 'Crop Yield Optimization',
      description: 'Shift planting schedules by 2 weeks to align with predicted rainfall patterns for 25% better yields.',
      priority: 'High',
      color: 'bg-accent/10 text-accent-foreground',
    },
    {
      icon: AlertTriangle,
      title: 'Drought Risk Alert',
      description: 'Southern regions showing 35% higher drought probability. Early intervention recommended.',
      priority: 'Critical',
      color: 'bg-destructive/10 text-destructive',
    },
  ];

  const adaptations = [
    { icon: Shield, title: 'Climate Resilience', value: '78%', trend: '+12%' },
    { icon: Sun, title: 'Energy Efficiency', value: '65%', trend: '+8%' },
    { icon: TrendingUp, title: 'Sustainable Growth', value: '82%', trend: '+15%' },
  ];

  return (
    <section id="insights" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Sustainability Insights</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Turning satellite data into local resilience and actionable strategies
          </p>
        </div>

        {/* Top Priorities */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Top 3 Adaptation Priorities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card
                  key={insight.title}
                  className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${insight.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          insight.priority === 'Critical'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-interactive/20 text-interactive'
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Adaptation Metrics */}
        <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Adaptation Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {adaptations.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.title} className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 rounded-full bg-accent/20">
                        <Icon className="w-8 h-8 text-accent-foreground" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold mb-2">{metric.value}</div>
                    <div className="text-sm font-medium mb-1">{metric.title}</div>
                    <div className="text-sm text-accent font-semibold">{metric.trend} from baseline</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quote */}
        <div className="text-center max-w-3xl mx-auto p-8 rounded-xl bg-gradient-accent/10 border border-accent/20 animate-fade-in">
          <blockquote className="text-xl md:text-2xl font-semibold mb-4 italic">
            "Turning satellite data into local resilience."
          </blockquote>
          <p className="text-muted-foreground">
            By combining AI forecasting with real-time climate monitoring, we empower communities to adapt,
            conserve resources, and build sustainable futures.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Insights;
