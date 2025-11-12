import { Brain, Sprout, Satellite, Globe, CloudRain, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Forecasting',
    description: 'Advanced machine learning models predict weather patterns with unprecedented accuracy for up to 10 days ahead.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sprout,
    title: 'Agricultural Analysis',
    description: 'Get crop-specific insights, soil moisture data, and planting recommendations tailored to your farm.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Satellite,
    title: 'Satellite Data Integration',
    description: 'Real-time satellite imagery from Google Earth Engine provides comprehensive environmental monitoring.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Access climate data and forecasts for any location worldwide with interactive 3D visualization.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: CloudRain,
    title: 'Real-time Weather Data',
    description: 'Live weather updates, precipitation forecasts, and severe weather alerts keep you informed.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: TrendingUp,
    title: 'Climate Insights',
    description: 'Historical trends, climate patterns, and long-term projections help you plan for the future.',
    gradient: 'from-orange-500 to-red-500',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 id="features-heading" className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Powerful Features for
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Smart Agriculture
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Everything you need to make data-driven decisions and optimize your agricultural operations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group relative p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`relative mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-3 group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Border Effect */}
                <div className={`absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gradient-to-br group-hover:${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            And many more features to explore...
          </p>
        </div>
      </div>
    </section>
  );
};
