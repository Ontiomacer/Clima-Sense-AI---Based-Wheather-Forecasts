import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Settings, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToPage = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: t.nav.dashboard },
    { path: '/forecast', label: t.nav.forecast },
    { path: '/agriculture', label: t.nav.agriculture },
    { path: '/map', label: 'Map' },
    { path: '/insights', label: 'Insights' },
    { path: '/chat', label: t.nav.chat },
    { path: '/about', label: t.nav.about },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-md shadow-card' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center font-bold">
              CS
            </div>
            <span className="text-xl font-bold">ClimaSense</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user && navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigateToPage(item.path)}
                className="text-sm font-medium hover:text-interactive transition-colors"
              >
                {item.label}
              </button>
            ))}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="shrink-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
            <LanguageSelector />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              {user && navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateToPage(item.path)}
                  className="text-left py-2 text-sm font-medium hover:text-interactive transition-colors"
                >
                  {item.label}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-sm font-medium hover:text-interactive transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              )}
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-sm font-medium hover:text-interactive transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/auth');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-sm font-medium hover:text-interactive transition-colors flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
