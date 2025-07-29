import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Home, 
  ArrowLeft, 
  Search,
  Play,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const suggestedActions = [
    { label: 'Start New Round', icon: Play, path: '/rounds', variant: 'default' as const },
    { label: 'View Statistics', icon: BarChart3, path: '/stats', variant: 'outline' as const },
    { label: 'Round History', icon: Search, path: '/history', variant: 'outline' as const },
  ];

  const handleGoHome = () => {
    if (user) {
      navigate('/rounds');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">Page Not Found</CardTitle>
            <Badge variant="destructive" className="text-sm">
              Error 404
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or may have been moved.
            </p>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              {location.pathname}
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleGoHome} className="w-full gap-2">
              <Home className="h-4 w-4" />
              Go to {user ? 'Rounds' : 'Home'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {user && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
              <div className="space-y-2">
                {suggestedActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.path}
                      variant={action.variant}
                      size="sm"
                      onClick={() => navigate(action.path)}
                      className="w-full gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
