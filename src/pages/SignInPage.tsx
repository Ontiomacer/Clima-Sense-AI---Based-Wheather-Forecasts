import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

/**
 * SignInPage component using Clerk's SignIn component
 * Styled to match ClimaSense branding with climate-themed background
 */
const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Enhanced gradient background matching ClimaSense theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-blue-600/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-500/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMS4xMDUuODk1LTIgMi0yczIgLjg5NSAyIDItLjg5NSAyLTIgMi0yLS44OTUtMi0yem0tMjAgNGMwLTEuMTA1Ljg5NS0yIDItMnMyIC44OTUgMiAyLS44OTUgMi0yIDItMi0uODk1LTItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* Animated decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* ClimaSense branding header */}
      <div className="absolute top-8 left-8 z-10">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold text-xl text-white shadow-lg group-hover:scale-105 transition-transform">
            CS
          </div>
          <span className="text-2xl font-bold text-white drop-shadow-lg">ClimaSense</span>
        </button>
      </div>

      {/* Clerk SignIn component with custom styling */}
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "backdrop-blur-xl bg-card/95 shadow-2xl border-white/20",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-2 hover:bg-accent/10 transition-all",
              formButtonPrimary: "bg-gradient-to-r from-green-500 to-blue-500 hover:opacity-90 transition-all shadow-lg",
              footerActionLink: "text-primary hover:text-primary/80 font-semibold",
              identityPreviewText: "font-medium",
              formFieldInput: "border-2 focus:border-primary transition-all",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
};

export default SignInPage;
