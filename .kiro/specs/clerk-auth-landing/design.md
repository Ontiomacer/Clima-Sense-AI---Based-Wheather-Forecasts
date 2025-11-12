# Design Document - Clerk Authentication & Landing Page

## Overview

This design implements Clerk authentication and creates a professional landing page for ClimaSense AI. The solution replaces Supabase authentication with Clerk, introduces a public landing page as the entry point, and protects application routes with authentication middleware.

## Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── ClerkProvider.tsx          # Clerk wrapper component
│   │   ├── ProtectedRoute.tsx         # Route protection HOC
│   │   └── SignInButton.tsx           # Reusable sign-in button
│   ├── landing/
│   │   ├── Hero.tsx                   # Hero section with CTA
│   │   ├── Features.tsx               # Feature showcase grid
│   │   ├── HowItWorks.tsx            # Process explanation
│   │   ├── Stats.tsx                  # Statistics/metrics
│   │   ├── Testimonials.tsx           # User testimonials (optional)
│   │   └── CTASection.tsx             # Final call-to-action
│   └── layout/
│       ├── LandingNav.tsx             # Landing page navigation
│       └── AppNav.tsx                 # Authenticated app navigation
├── pages/
│   ├── LandingPage.tsx                # New landing page
│   ├── SignInPage.tsx                 # Clerk sign-in page
│   ├── SignUpPage.tsx                 # Clerk sign-up page
│   └── [existing pages...]            # Protected with auth
└── hooks/
    └── useAuth.ts                     # Updated for Clerk
```

### Authentication Flow

```
User visits "/" 
    ↓
Landing Page displayed
    ↓
User clicks "Get Started" or "Sign In"
    ↓
Redirected to Clerk sign-in/sign-up
    ↓
After authentication
    ↓
Redirected to Dashboard
    ↓
Access to all protected routes granted
```

### Route Configuration

```typescript
Public Routes:
- / (Landing Page)
- /about
- /contact
- /sign-in (Clerk)
- /sign-up (Clerk)

Protected Routes (require authentication):
- /dashboard
- /forecast
- /map
- /chat
- /agriculture
- /insights
- /settings
```

## Components and Interfaces

### 1. Clerk Provider Setup

```typescript
// src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

### 2. Protected Route Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Checks authentication status
// Redirects to sign-in if not authenticated
// Renders children if authenticated
```

### 3. Landing Page Sections

#### Hero Section
- **Purpose**: Capture attention, communicate value
- **Elements**:
  - Animated headline with gradient text
  - Subheadline explaining the platform
  - Primary CTA button (Get Started)
  - Secondary CTA button (Learn More)
  - Background: Animated gradient or climate imagery
  - Floating elements (clouds, data points)

#### Features Section
- **Purpose**: Showcase key capabilities
- **Elements**:
  - 6 feature cards in grid layout
  - Icons for each feature
  - Short descriptions
  - Hover animations
- **Features to highlight**:
  1. AI-Powered Forecasting
  2. Agricultural Analysis
  3. Satellite Data Integration
  4. Multi-language Support
  5. Real-time Weather Data
  6. Climate Insights

#### How It Works Section
- **Purpose**: Explain the process
- **Elements**:
  - 3-4 step process
  - Visual flow diagram
  - Icons and illustrations
  - Progressive reveal animation

#### Stats Section
- **Purpose**: Build credibility
- **Elements**:
  - Animated counters
  - Key metrics (forecasts generated, accuracy, users)
  - Visual emphasis with large numbers

#### CTA Section
- **Purpose**: Convert visitors
- **Elements**:
  - Compelling headline
  - Sign-up button
  - Trust indicators

## Data Models

### User Authentication (Clerk)

```typescript
interface ClerkUser {
  id: string;
  emailAddresses: EmailAddress[];
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ClerkUser | null;
}
```

### Landing Page Content

```typescript
interface Feature {
  icon: React.ComponentType;
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
  suffix?: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType;
}
```

## Error Handling

### Authentication Errors
- Missing Clerk keys → Display setup instructions
- Network errors → Show retry button
- Invalid session → Redirect to sign-in
- Rate limiting → Display wait message

### Route Protection
- Unauthenticated access → Redirect to sign-in with return URL
- Session expiry → Refresh token or re-authenticate
- Permission errors → Display access denied message

## Testing Strategy

### Unit Tests
- ProtectedRoute component logic
- Authentication state management
- Landing page component rendering
- Button click handlers

### Integration Tests
- Complete authentication flow
- Route protection enforcement
- Navigation between public and protected routes
- Sign-in/sign-out functionality

### E2E Tests
- User journey: Landing → Sign Up → Dashboard
- User journey: Landing → Sign In → Dashboard
- Protected route access without auth
- Sign out and return to landing

## Design System

### Color Palette

```css
Primary Colors:
- Primary Blue: #3B82F6
- Primary Green: #10B981
- Accent Orange: #F59E0B

Gradients:
- Hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Feature Cards: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- CTA: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)

Neutral Colors:
- Background: #0F172A (dark) / #FFFFFF (light)
- Surface: #1E293B (dark) / #F8FAFC (light)
- Text Primary: #F1F5F9 (dark) / #0F172A (light)
- Text Secondary: #94A3B8
```

### Typography

```css
Headings:
- H1: 3.5rem (56px), font-weight: 800
- H2: 2.5rem (40px), font-weight: 700
- H3: 1.875rem (30px), font-weight: 600

Body:
- Large: 1.125rem (18px)
- Regular: 1rem (16px)
- Small: 0.875rem (14px)

Font Family: Inter, system-ui, sans-serif
```

### Animations

```css
Transitions:
- Default: 200ms ease-in-out
- Hover: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Page transitions: 400ms ease

Keyframes:
- fadeIn: opacity 0 → 1
- slideUp: translateY(20px) → 0
- float: gentle up/down movement
- pulse: scale animation for CTAs
```

### Spacing System

```css
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)
- 3xl: 4rem (64px)
```

## Performance Considerations

### Code Splitting
- Lazy load protected routes
- Separate landing page bundle
- Dynamic imports for heavy components

### Image Optimization
- Use WebP format with fallbacks
- Lazy load images below fold
- Responsive images with srcset

### Animation Performance
- Use CSS transforms (GPU accelerated)
- Avoid layout thrashing
- Use will-change sparingly
- Implement intersection observer for scroll animations

## Security Considerations

### Clerk Integration
- Store publishable key in environment variables
- Never expose secret key in frontend
- Use Clerk's built-in CSRF protection
- Implement proper session management

### Route Protection
- Server-side validation for API calls
- Client-side route guards
- Secure token storage
- Automatic token refresh

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast ratios ≥ 4.5:1
- Screen reader friendly
- Skip navigation links

## Migration Strategy

### Phase 1: Setup Clerk
1. Install Clerk packages
2. Configure environment variables
3. Wrap app with ClerkProvider
4. Test authentication flow

### Phase 2: Create Landing Page
1. Build landing page components
2. Implement responsive design
3. Add animations
4. Test on multiple devices

### Phase 3: Update Routing
1. Create ProtectedRoute component
2. Update App.tsx routing
3. Set landing page as default
4. Test route protection

### Phase 4: Remove Supabase Auth
1. Remove Supabase auth hooks
2. Update components using auth
3. Clean up unused code
4. Update documentation

### Phase 5: Testing & Polish
1. End-to-end testing
2. Performance optimization
3. Accessibility audit
4. Final UI polish

## Dependencies

### New Packages
```json
{
  "@clerk/clerk-react": "^4.30.0",
  "framer-motion": "^10.16.0",
  "lucide-react": "^0.294.0"
}
```

### Updated Packages
- Remove: @supabase/supabase-js (auth only, keep for database if needed)
- Keep: All existing UI and utility packages

## Deployment Considerations

### Environment Variables (Vercel)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Build Configuration
- No changes to build process
- Clerk works with static builds
- Environment variables injected at build time

### Domain Configuration
- Configure Clerk dashboard with production domain
- Update allowed origins
- Set up redirect URLs

---

**Design Status**: Ready for Implementation

**Estimated Complexity**: Medium

**Implementation Time**: 2-3 hours
