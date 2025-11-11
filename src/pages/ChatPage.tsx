import Navigation from '@/components/Navigation';
import ClimateChat from '@/components/ClimateChat';
import Footer from '@/components/Footer';

const ChatPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <ClimateChat />
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage;
