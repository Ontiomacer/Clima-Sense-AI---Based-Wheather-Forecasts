import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { LandingNav } from '@/components/layout/LandingNav';
import { AppNav } from '@/components/layout/AppNav';

/**
 * Navigation component that conditionally renders the appropriate navigation
 * based on authentication state and current route
 * 
 * - LandingNav: For public routes (landing page, about, contact)
 * - AppNav: For authenticated users on protected routes
 */
const Navigation = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // Public routes that should show LandingNav
  const publicRoutes = ['/', '/about', '/contact', '/sign-in', '/sign-up'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Don't render navigation while Clerk is loading
  if (!isLoaded) {
    return null;
  }

  // Show LandingNav for public routes or when user is not signed in
  if (isPublicRoute || !isSignedIn) {
    return <LandingNav />;
  }

  // Show AppNav for authenticated users on protected routes
  return <AppNav />;
};

export default Navigation;
