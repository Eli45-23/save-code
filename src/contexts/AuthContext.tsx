import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { Database } from '../types/database';

interface SignUpResult {
  success: boolean;
  needsEmailConfirmation: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await supabaseHelpers.getUserProfile(userId);
      setProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Profile creation is now handled automatically in getUserProfile
      // If we still get an error here, it's a more serious issue
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Record sign in analytics
      if (data.user) {
        await supabaseHelpers.recordAnalytics('user_signed_in', {
          method: 'email_password'
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<SignUpResult> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return {
          success: false,
          needsEmailConfirmation: false,
          message: error.message
        };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        return {
          success: true,
          needsEmailConfirmation: true,
          message: 'Please check your email and click the confirmation link to complete your registration.'
        };
      }

      // Record sign up analytics
      if (data.user) {
        await supabaseHelpers.recordAnalytics('user_signed_up', {
          method: 'email_password',
          has_full_name: !!fullName
        });
      }

      return {
        success: true,
        needsEmailConfirmation: false
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        needsEmailConfirmation: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      // Record sign out analytics
      await supabaseHelpers.recordAnalytics('user_signed_out');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'your-app://reset-password', // Configure this URL
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Record password reset analytics
      await supabaseHelpers.recordAnalytics('password_reset_requested');
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      // Record resend confirmation analytics
      await supabaseHelpers.recordAnalytics('confirmation_email_resent');
    } catch (error) {
      console.error('Resend confirmation error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedProfile = await supabaseHelpers.upsertProfile({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      });

      setProfile(updatedProfile);

      // Record profile update analytics
      await supabaseHelpers.recordAnalytics('profile_updated', {
        fields_updated: Object.keys(updates)
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    try {
      await loadUserProfile(user.id);
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    resendConfirmationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};