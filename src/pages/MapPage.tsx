import Navigation from '@/components/Navigation';
import MapSection from '@/components/MapSection';
import Footer from '@/components/Footer';

const MapPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <MapSection />
      </main>
      <Footer />
    </div>
  );
};

export default MapPage;
