import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton, useUser } from '@clerk/clerk-react';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * AppNav component for authenticated users
 * Displays navigation for protected routes with Clerk authentication
 */
export const AppNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
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

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-md shadow-card' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigateToPage('/dashboard')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center font-bold">
              CS
            </div>
            <span className="text-xl font-bold">ClimaSense</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigateToPage(item.path)}
                className={`text-sm font-medium transition-colors ${
                  isActivePath(item.path)
                    ? 'text-interactive font-semibold'
                    : 'hover:text-interactive'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <LanguageSelector />
            <ThemeToggle />
            {/* Clerk UserButton with sign-out functionality */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                  userButtonPopoverCard: "shadow-lg",
                }
              }}
            />
          </div>

          {/* Mobile Menu Button & Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <ThemeToggle />
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                }
              }}
            />
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
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateToPage(item.path)}
                  className={`text-left py-2 text-sm font-medium transition-colors ${
                    isActivePath(item.path)
                      ? 'text-interactive font-semibold'
                      : 'hover:text-interactive'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
