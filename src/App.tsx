import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FlightProvider } from "./contexts/FlightContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RoundSelection from "./pages/RoundSelection";
import Scorecard from "./pages/Scorecard";
import RoundHistory from "./pages/RoundHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FlightProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/rounds" element={<RoundSelection />} />
              <Route path="/scorecard" element={<Scorecard />} />
              <Route path="/history" element={<RoundHistory />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FlightProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
