import { MapPin, Brain, LineChart, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: 1,
    icon: MapPin,
    title: 'Select Your Location',
    description: 'Choose your farm location on our interactive map or enter coordinates to get started.',
    color: 'blue',
  },
  {
    number: 2,
    icon: Brain,
    title: 'AI Analyzes Data',
    description: 'Our AI processes satellite imagery, weather patterns, and historical data to generate insights.',
    color: 'purple',
  },
  {
    number: 3,
    icon: LineChart,
    title: 'Get Forecasts & Insights',
    description: 'Receive detailed weather forecasts, crop recommendations, and agricultural advisories.',
    color: 'cyan',
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'Make Informed Decisions',
    description: 'Use data-driven insights to optimize planting, irrigation, and harvest timing.',
    color: 'green',
  },
];

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
  },
  cyan: {
    gradient: 'from-cyan-500 to-teal-500',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500',
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500',
  },
};

export const HowItWorks = () => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Progressively reveal steps
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps((prev) => [...new Set([...prev, index])]);
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Get started in minutes with our simple, powerful workflow
          </p>
        </div>

        {/* Steps Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-cyan-500 to-green-500 transform -translate-y-1/2 opacity-20" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colors = colorClasses[step.color as keyof typeof colorClasses];
              const isVisible = visibleSteps.includes(index);

              return (
                <div
                  key={index}
                  className={`relative transition-all duration-700 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  }`}
                >
                  {/* Step Card */}
                  <div className="relative bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 h-full">
                    {/* Step Number Badge */}
                    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className={`mb-6 w-16 h-16 rounded-xl bg-gradient-to-br ${colors.gradient} p-3 mx-auto lg:mx-0`}>
                      <Icon className="w-full h-full text-white" />
                    </div>

                    {/* Content */}
                    <h3 className={`text-xl font-bold mb-3 ${colors.text}`}>
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow Connector (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-16">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Start making smarter decisions today with ClimaSense AI
          </p>
        </div>
      </div>
    </section>
  );
};
