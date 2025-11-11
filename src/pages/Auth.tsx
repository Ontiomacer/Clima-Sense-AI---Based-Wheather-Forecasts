import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().trim().min(1, { message: "Full name is required" }).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  useEffect(() => {
    // Auto-create demo account on first load
    const createDemoAccount = async () => {
      const { error } = await supabase.auth.signUp({
        email: 'demo@climasense.com',
        password: 'demo123',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: 'Demo User',
          },
        },
      });
      // Ignore errors - account might already exist
      if (!error || error.message.includes('already registered')) {
        // Success or already exists - both are fine
      }
    };

    // Create demo account silently
    createDemoAccount();

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.parse(formData);
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: validation.email,
        password: validation.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Account created!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to sign up",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.omit({ fullName: true }).parse(formData);

      const { error } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password: validation.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to sign in",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@climasense.com',
      password: 'demo123',
      fullName: '',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-interactive/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-interactive/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMS4xMDUuODk1LTIgMi0yczIgLjg5NSAyIDItLjg5NSAyLTIgMi0yLS44OTUtMi0yem0tMjAgNGMwLTEuMTA1Ljg5NS0yIDItMnMyIC44OTUgMiAyLS44OTUgMi0yIDItMi0uODk1LTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* Animated decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-interactive/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <Card className="w-full max-w-md relative backdrop-blur-xl bg-card/98 border-accent/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-fade-in">
        <CardHeader className="text-center space-y-6 pb-8 pt-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-accent blur-xl opacity-50 rounded-full" />
            <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-accent flex items-center justify-center font-bold text-4xl text-primary shadow-glow animate-scale-in">
              CS
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold text-primary-foreground drop-shadow-sm">
              ClimaSense
            </CardTitle>
            <CardDescription className="text-base text-primary-foreground/90 font-medium">
              Sign in to access climate intelligence
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          {/* Enhanced Demo Credentials Banner */}
          <div className="relative bg-gradient-to-r from-accent/20 via-accent/15 to-interactive/20 border-2 border-accent/40 rounded-xl p-5 space-y-3 shadow-soft overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-interactive/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <p className="text-sm font-bold text-foreground">Demo Account Available</p>
                  </div>
                  <div className="space-y-1 bg-card/50 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="opacity-70">Email:</span>
                      <span className="font-mono font-semibold text-foreground">demo@climasense.com</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="opacity-70">Password:</span>
                      <span className="font-mono font-semibold text-foreground">demo123</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={fillDemoCredentials}
                  className="shrink-0 bg-gradient-accent hover:opacity-90 shadow-glow transition-all"
                >
                  Use Demo
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary/5 backdrop-blur-sm p-1 h-12">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-gradient-accent data-[state=active]:text-primary data-[state=active]:shadow-glow transition-all rounded-md font-medium"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-gradient-accent data-[state=active]:text-primary data-[state=active]:shadow-glow transition-all rounded-md font-medium"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-8">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-semibold text-foreground">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 bg-background/70 backdrop-blur-sm border-2 border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-semibold text-foreground">
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-background/70 backdrop-blur-sm border-2 border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all rounded-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-accent hover:opacity-90 hover:scale-[1.02] transition-all shadow-glow font-semibold text-primary text-base rounded-lg" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-12 bg-background/70 backdrop-blur-sm border-2 border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold text-foreground">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 bg-background/70 backdrop-blur-sm border-2 border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-background/70 backdrop-blur-sm border-2 border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all rounded-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-accent hover:opacity-90 hover:scale-[1.02] transition-all shadow-glow font-semibold text-primary text-base rounded-lg" 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
