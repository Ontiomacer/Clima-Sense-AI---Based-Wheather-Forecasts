import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

const stats: Stat[] = [
  {
    value: 50000,
    suffix: '+',
    label: 'Forecasts Generated',
    prefix: '',
  },
  {
    value: 95,
    suffix: '%',
    label: 'Accuracy Rate',
    prefix: '',
  },
  {
    value: 10000,
    suffix: '+',
    label: 'Active Users',
    prefix: '',
  },
  {
    value: 150,
    suffix: '+',
    label: 'Countries Covered',
    prefix: '',
  },
];

const useCountUp = (end: number, duration: number = 2000, isVisible: boolean) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * (end - startValue) + startValue);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  return count;
};

export const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-24 bg-slate-900 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Trusted by Farmers
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Around the World
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join thousands of farmers making data-driven decisions with ClimaSense AI
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const count = useCountUp(stat.value, 2000, isVisible);

            return (
              <div
                key={index}
                className="text-center group"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="relative inline-block">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                  
                  {/* Number */}
                  <div className="relative">
                    <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
                      {stat.prefix}
                      {count.toLocaleString()}
                      {stat.suffix}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <p className="text-lg sm:text-xl text-slate-300 font-medium mt-4">
                  {stat.label}
                </p>

                {/* Decorative Line */}
                <div className="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full group-hover:w-24 transition-all duration-300" />
              </div>
            );
          })}
        </div>

        {/* Bottom Decoration */}
        <div className="mt-20 flex justify-center items-center gap-4 text-slate-400">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-600" />
          <span className="text-sm">Real-time data updated daily</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-600" />
        </div>
      </div>
    </section>
  );
};
