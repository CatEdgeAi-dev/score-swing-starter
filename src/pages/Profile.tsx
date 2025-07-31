import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { FlightManagementPanel } from '@/components/flight/FlightManagementPanel';
import { useFlightContext } from '@/contexts/FlightContext';
import { HandicapSection } from '@/components/profile/HandicapSection';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const ProfileContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isFlightMode } = useFlightContext();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const handleProfileUpdate = () => {
    fetchUserProfile();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title="Profile" />
      
      <div className="flex-1 p-4 space-y-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            
            {user?.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Member since:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handicap Section */}
        <HandicapSection 
          userProfile={userProfile} 
          onUpdate={handleProfileUpdate}
        />

        {/* Flight Management - only show if in flight mode */}
        {isFlightMode && (
          <FlightManagementPanel />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              More settings and preferences will be available soon.
            </p>
            
            <Button 
              variant="destructive" 
              onClick={signOut}
              className="w-full justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomTabs />
    </div>
  );
};

const Profile: React.FC = () => {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
};

export default Profile;