import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FlightProvider } from "./contexts/FlightContext";
import { ScorecardProvider } from "./components/scorecard/ScorecardContext";
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
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import SharedRound from "./pages/SharedRound";
import NotFound from "./pages/NotFound";
import AdminHandicapReview from "./pages/AdminHandicapReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FlightProvider>
        <ScorecardProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-background">
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
              <Route path="/performance" element={
                <RouteLoadingWrapper>
                  <Stats />
                </RouteLoadingWrapper>
              } />
              <Route path="/profile" element={
                <RouteLoadingWrapper>
                  <Profile />
                </RouteLoadingWrapper>
              } />
              <Route path="/community" element={
                <RouteLoadingWrapper>
                  <Community />
                </RouteLoadingWrapper>
              } />
              <Route path="/settings" element={
                <RouteLoadingWrapper>
                  <Settings />
                </RouteLoadingWrapper>
              } />
              <Route path="/onboarding" element={
                <RouteLoadingWrapper>
                  <Onboarding />
                </RouteLoadingWrapper>
              } />
              <Route path="/shared/:roundId" element={
                <RouteLoadingWrapper>
                  <SharedRound />
                </RouteLoadingWrapper>
              } />
              <Route path="/admin/handicap-review" element={
                <RouteLoadingWrapper>
                  <AdminHandicapReview />
                </RouteLoadingWrapper>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={
                <RouteLoadingWrapper>
                  <NotFound />
                </RouteLoadingWrapper>
              } />
                </Routes>
              </div>
          </BrowserRouter>
        </TooltipProvider>
      </ScorecardProvider>
    </FlightProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
