import { useAuth } from "@hooks/use-auth";
import Landing from "./landing";
import ComprehensivePDFEditor from "@components/ComprehensivePDFEditor";
import { Button } from "@ui/button";
import { LogOut, User } from "lucide-react";

function AuthenticatedHome() {
  // When the user is authenticated, this component is rendered. It
  // displays a minimal header with a logo, a greeting, and a sign-out
  // button. The rest of the screen is occupied by the ComprehensivePDFEditor
  // component, which is a full-fledged PDF editor.
  const { user, logout } = useAuth();

  return (
    // The outermost div is the container for the entire page. It has a
    // background color set to the background color of the theme.
    <div className="h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      // The header is a horizontal bar at the top of the screen. It
      // contains the logo, a greeting, and a sign-out button.
      <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
        // The logo is a 70x70 image of the PDF4EVER logo.
        <div className="flex items-center space-x-3">
          <img src="/70x70logo.png" alt="PDF4EVER Logo" className="h-8 w-8" />

          // The greeting is a combination of the user's first and last
          // names, separated by a space.
          <span className="text-xl font-bold">
            <span style={{ color: "#005aff" }}>PDF4</span>
            <span style={{ color: "#ff3900" }}>EVER</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Full-height PDF Editor */}
      <div className="flex-1 overflow-hidden">
        <ComprehensivePDFEditor className="h-full" />
      </div>
    </div>
  );
}
function Home() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show PDF editor immediately without authentication requirement
  return (
    <div className="min-h-screen bg-background">
      {/* PDF Editor at the top - always visible */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="h-screen flex flex-col">
          {/* Header with optional auth */}
          <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <img
                src="/70x70logo.png"
                alt="PDF4EVER Logo"
                className="h-8 w-8"
              />

              <span className="text-xl font-bold">
                <span style={{ color: "#005aff" }}>PDF4</span>
                <span style={{ color: "#ff3900" }}>EVER</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                  <Button size="sm">Sign Up</Button>
                </div>
              )}
            </div>
          </header>

          {/* Full-height PDF Editor - always available */}
          <div className="flex-1 overflow-hidden">
            <ComprehensivePDFEditor className="h-full" />
          </div>
        </div>
      </div>

      {/* Landing page content below the PDF editor */}
      <Landing />
    </div>
  );
}
  export default Home;
