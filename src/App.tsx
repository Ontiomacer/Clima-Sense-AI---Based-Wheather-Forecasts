import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eager load landing and auth pages for better UX
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

// Lazy load protected routes for code splitting
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ForecastPage = lazy(() => import("./pages/ForecastPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const AgriculturePage = lazy(() => import("./pages/AgriculturePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const Settings = lazy(() => import("./pages/Settings"));

// Lazy load public pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="climasense-theme">
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/about" element={
                  <Suspense fallback={<PageLoader />}>
                    <AboutPage />
                  </Suspense>
                } />
                <Route path="/contact" element={
                  <Suspense fallback={<PageLoader />}>
                    <ContactPage />
                  </Suspense>
                } />

                {/* Protected Routes - Require Authentication */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <DashboardPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/forecast" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <ForecastPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/agriculture" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <AgriculturePage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/map" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <MapPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/insights" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <InsightsPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <ChatPage />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all route for 404 */}
                <Route path="*" element={
                  <Suspense fallback={<PageLoader />}>
                    <NotFound />
                  </Suspense>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
);

export default App;
