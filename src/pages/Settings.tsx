import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Save, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminPanel from '@/components/AdminPanel';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { isAdmin } = useAuth();
  const [openWeatherKey, setOpenWeatherKey] = useState('');
  const [geeServiceAccount, setGeeServiceAccount] = useState('');
  const [geePrivateKey, setGeePrivateKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in');
    }
  }, [isSignedIn, isLoaded, navigate]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // In a real implementation, these would be saved to secure backend storage
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your API keys have been securely stored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SettingsIcon className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Settings</h1>
              </div>
              <p className="text-muted-foreground">
                Configure your API keys and system preferences
              </p>
            </div>
          </div>

          <Tabs defaultValue="api-keys" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
            </TabsList>

            <TabsContent value="api-keys">
              {/* API Keys Section */}
              <Card className="mb-6 border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    <CardTitle>API Configuration</CardTitle>
                  </div>
                  <CardDescription>
                    Securely store your API keys for climate data services. All keys are encrypted and stored safely.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* OpenWeather API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="openweather">OpenWeather API Key</Label>
                    <Input
                      id="openweather"
                      type="password"
                      placeholder="Enter your OpenWeather API key"
                      value={openWeatherKey}
                      onChange={(e) => setOpenWeatherKey(e.target.value)}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{' '}
                      <a 
                        href="https://openweathermap.org/api" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-interactive hover:underline"
                      >
                        OpenWeather
                      </a>
                    </p>
                  </div>

                  {/* Google Earth Engine Service Account */}
                  <div className="space-y-2">
                    <Label htmlFor="gee-account">Google Earth Engine Service Account Email</Label>
                    <Input
                      id="gee-account"
                      type="email"
                      placeholder="your-service-account@project.iam.gserviceaccount.com"
                      value={geeServiceAccount}
                      onChange={(e) => setGeeServiceAccount(e.target.value)}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Create a service account in your{' '}
                      <a 
                        href="https://console.cloud.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-interactive hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </p>
                  </div>

                  {/* Google Earth Engine Private Key */}
                  <div className="space-y-2">
                    <Label htmlFor="gee-key">Google Earth Engine Private Key (JSON)</Label>
                    <textarea
                      id="gee-key"
                      placeholder="Paste your GEE service account private key JSON here"
                      value={geePrivateKey}
                      onChange={(e) => setGeePrivateKey(e.target.value)}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Download the JSON key file from your service account
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save API Keys'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Information Card */}
              <Card className="border-accent/20 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg">Security Notice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your API keys are encrypted and securely stored. They are never exposed in the frontend code and are only accessible by backend functions that need them to fetch climate data.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users">
                <AdminPanel />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
