import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryclient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../components/ui/toaster";
import { TooltipProvider } from "../components/ui/tooltip";
import ComprehensivePDFEditor from "../ComprehensivePDFEditor";


function Router() {
  return (
    <Switch>
      <Route path="/" component={ComprehensivePDFEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ComprehensivePDFEditor />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
