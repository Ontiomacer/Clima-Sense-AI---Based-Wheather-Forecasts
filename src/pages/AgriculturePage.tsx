import Navigation from '@/components/Navigation';
import FarmingIndicators from '@/components/agriculture/FarmingIndicators';
import Footer from '@/components/Footer';

const AgriculturePage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20">
        <FarmingIndicators />
      </main>
      <Footer />
    </div>
  );
};

export default AgriculturePage;
