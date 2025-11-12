import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface SignInButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

/**
 * SignInButton component that triggers navigation to Clerk sign-in page
 * Styled consistently with the ClimaSense design system
 */
export const SignInButton = ({ 
  variant = "default", 
  size = "default",
  className = "",
  children 
}: SignInButtonProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/sign-in");
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleSignIn}
      className={className}
    >
      {children || (
        <>
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </>
      )}
    </Button>
  );
};
