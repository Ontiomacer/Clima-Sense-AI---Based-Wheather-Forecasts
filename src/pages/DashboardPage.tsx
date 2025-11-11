import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';

const DashboardPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
