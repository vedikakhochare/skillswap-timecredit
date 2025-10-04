import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, User, LogOut, Menu, X, ArrowLeft, MessageCircle, Home } from "lucide-react";
import { SimpleMessageNotification } from "@/components/ui/simple-message-notification";
import { SimpleNotificationBell } from "@/components/ui/simple-notification-bell";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { userProfile } = useUserProfile();
  const userCredits = userProfile?.credits || 0;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Back + Logo */}
          <div className="flex items-center gap-3">
            {location.pathname !== "/" && (
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="px-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-hero rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">SkillSwap</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-smooth">
              Marketplace
            </Link>
            <Link to="/quiz" className="text-sm font-medium hover:text-primary transition-smooth">
              Quiz
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium hover:text-primary transition-smooth">
              How It Works
            </Link>
            <Link to="/community" className="text-sm font-medium hover:text-primary transition-smooth">
              Community
            </Link>
            {user && (
              <Link to="/messages" className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2">
                <SimpleMessageNotification />
                Messages
              </Link>
            )}
          </nav>

          {/* User Area */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 animate-pulse bg-muted rounded-full"></div>
                <div className="h-6 w-12 animate-pulse bg-muted rounded"></div>
              </div>
            ) : user ? (
              <>
                {/* Notifications */}
                <SimpleNotificationBell />
                
                {/* Messages */}
                <Link to="/messages" className="relative">
                  <SimpleMessageNotification />
                </Link>

                {/* Credits display */}
                <div className="hidden sm:block">
                  <CreditBadge amount={userCredits} />
                </div>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"} />
                        <AvatarFallback>
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-background border border-border shadow-lg"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.displayName || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="sm:hidden pt-1">
                          <CreditBadge amount={userCredits} variant="small" />
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/messages")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/post-skill")}>
                      <Clock className="mr-2 h-4 w-4" />
                      Post a Skill
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button size="sm" variant="hero" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link to="/marketplace" className="text-sm font-medium hover:text-primary transition-smooth">
                Marketplace
              </Link>
              <Link to="/quiz" className="text-sm font-medium hover:text-primary transition-smooth">
                Quiz
              </Link>
              <Link to="/how-it-works" className="text-sm font-medium hover:text-primary transition-smooth">
                How It Works
              </Link>
              <Link to="/community" className="text-sm font-medium hover:text-primary transition-smooth">
                Community
              </Link>
              {user && (
                <Link to="/messages" className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2">
                  <SimpleMessageNotification />
                  Messages
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};