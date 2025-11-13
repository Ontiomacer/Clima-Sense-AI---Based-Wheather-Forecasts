import { useNavigate } from 'react-router-dom';
import { Cloud, Droplets, Wind, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
      aria-label="Hero section"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        {/* Floating Elements - Using will-change for GPU acceleration */}
        <div className="absolute top-20 left-10 animate-float will-change-transform" aria-hidden="true">
          <Cloud className="w-16 h-16 text-blue-400/30" />
        </div>
        <div className="absolute top-40 right-20 animate-float-delayed will-change-transform" aria-hidden="true">
          <Droplets className="w-12 h-12 text-cyan-400/30" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float-slow will-change-transform" aria-hidden="true">
          <Wind className="w-14 h-14 text-indigo-400/30" />
        </div>
        <div className="absolute bottom-20 right-40 animate-float will-change-transform" aria-hidden="true">
          <Sun className="w-16 h-16 text-yellow-400/30" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8 animate-fade-in">
          {/* Welcome Banner for Judges */}
          <div className="inline-block mb-4 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 backdrop-blur-md border border-cyan-400/30 rounded-full px-6 py-3 shadow-lg">
              <p className="text-cyan-300 font-semibold text-sm sm:text-base flex items-center gap-2 justify-center">
                <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                Welcome Judges of PCCOE-IGC
                <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              </p>
            </div>
          </div>

          {/* Headline with Gradient */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <span className="block text-white mb-2">
              AI-Powered Climate
            </span>
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
              Intelligence for Agriculture
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Harness advanced AI forecasting, satellite data, and real-time weather insights 
            to make smarter agricultural decisions and protect your crops.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/sign-up')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              aria-label="Sign up for free account"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-white/80 text-white hover:bg-white hover:text-slate-900 px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300 backdrop-blur-sm bg-white/10"
              aria-label="Learn more about ClimaSense features"
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Real-time Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>AI-Powered Forecasts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Satellite Integration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
};
