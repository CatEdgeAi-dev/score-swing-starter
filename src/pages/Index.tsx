import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ScorecardSkeleton } from '@/components/scorecard/LoadingSpinner';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check if this is a new user who hasn't seen onboarding
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          navigate('/onboarding');
        } else {
          navigate('/rounds');
        }
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  // Show loading while determining where to redirect
  return <ScorecardSkeleton />;
};

export default Index;
