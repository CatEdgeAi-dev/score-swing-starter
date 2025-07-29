import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FlightProvider } from "./contexts/FlightContext";
import { RouteLoadingWrapper } from "./components/routing/RouteLoadingWrapper";
import { RouteGuard } from "./components/routing/RouteGuard";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import { ContextualHeader } from "./components/navigation/ContextualHeader";
import { QuickActions } from "./components/actions/QuickActions";
import Index from "./pages/Index";
import Login from "./pages/Login";
import RoundSelection from "./pages/RoundSelection";
import Scorecard from "./pages/Scorecard";
import RoundHistory from "./pages/RoundHistory";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
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
            <Breadcrumbs />
            <ContextualHeader />
            <QuickActions />
            <Routes>
              <Route path="/" element={
                <RouteLoadingWrapper>
                  <Index />
                </RouteLoadingWrapper>
              } />
              <Route path="/login" element={
                <RouteLoadingWrapper>
                  <Login />
                </RouteLoadingWrapper>
              } />
              <Route path="/rounds" element={
                <RouteLoadingWrapper>
                  <RoundSelection />
                </RouteLoadingWrapper>
              } />
              <Route path="/scorecard" element={
                <RouteLoadingWrapper>
                  <RouteGuard requiresRoundSetup={true}>
                    <Scorecard />
                  </RouteGuard>
                </RouteLoadingWrapper>
              } />
              <Route path="/history" element={
                <RouteLoadingWrapper>
                  <RoundHistory />
                </RouteLoadingWrapper>
              } />
              <Route path="/stats" element={
                <RouteLoadingWrapper>
                  <Stats />
                </RouteLoadingWrapper>
              } />
              <Route path="/profile" element={
                <RouteLoadingWrapper>
                  <Profile />
                </RouteLoadingWrapper>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <RouteLoadingWrapper>
                  <NotFound />
                </RouteLoadingWrapper>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FlightProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
