import Navigation from '@/components/Navigation';
import Forecast from '@/components/Forecast';
import Footer from '@/components/Footer';

const ForecastPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Forecast />
      </main>
      <Footer />
    </div>
  );
};

export default ForecastPage;
