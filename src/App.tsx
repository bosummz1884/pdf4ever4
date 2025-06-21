import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../components/ui/tooltip";
import { Toaster } from "../components/ui/toaster";
import { queryClient } from "@/lib/queryClient";

// App pages/components
import Home from "@/pages/home"; // renders editor and landing stacked (your preferred layout)
import Landing from "@/pages/landing";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotFound from "@/pages/not-found";

// If you ever want to show just the editor: import ComprehensivePDFEditor from "@components/ComprehensivePDFEditor";

function AppRouter() {
  return (
    <Switch>
      {/* The home route: editor + landing page together */}
      <Route path="/">
        <Home />
      </Route>
      {/* Standalone landing page */}
      <Route path="/landing">
        <Landing />
      </Route>
      {/* Legal pages */}
      <Route path="/privacy-policy">
        <PrivacyPolicy />
      </Route>
      <Route path="/terms-of-service">
        <TermsOfService />
      </Route>
      {/* 404 fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
