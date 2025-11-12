import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom auth hook that wraps Clerk authentication
 * Provides a consistent interface for authentication state
 * and maintains backward compatibility with existing code
 */
export const useAuth = () => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check admin status when user changes
    if (clerkUser?.id) {
      checkAdminStatus(clerkUser.id);
    } else {
      setIsAdmin(false);
    }
  }, [clerkUser?.id]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Map Clerk user to a simplified user object for backward compatibility
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    fullName: clerkUser.fullName || '',
    imageUrl: clerkUser.imageUrl,
  } : null;

  // Session object for backward compatibility
  const session = isSignedIn ? { user } : null;

  return { 
    user, 
    session, 
    loading: !isLoaded, 
    isAdmin,
    // Note: signOut is now handled by Clerk's SignOutButton or useClerk hook
    signOut: async () => {
      // This is a placeholder - actual sign out should use Clerk's methods
      console.warn('Use Clerk SignOutButton or useClerk().signOut() instead');
    }
  };
};
