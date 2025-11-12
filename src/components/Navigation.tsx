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

  // Routes that should always show LandingNav (only landing page and auth pages)
  const landingOnlyRoutes = ['/', '/sign-in', '/sign-up'];
  const isLandingRoute = landingOnlyRoutes.includes(location.pathname);

  // Don't render navigation while Clerk is loading
  if (!isLoaded) {
    return null;
  }

  // Show LandingNav only for landing page and auth pages when not signed in
  if (isLandingRoute && !isSignedIn) {
    return <LandingNav />;
  }

  // Show AppNav for all other routes (including About/Contact) when signed in
  if (isSignedIn) {
    return <AppNav />;
  }

  // Show LandingNav for public pages when not signed in
  return <LandingNav />;
};

export default Navigation;
