import { useState, useEffect } from 'react';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FlightLobby } from '@/components/flight/FlightLobby';
import { FlightCreationForm } from '@/components/flight/FlightCreationForm';
import { FlightWorkflowModal } from '@/components/flight/FlightWorkflowModal';
import { useAuth } from '@/contexts/AuthContext';
import { useFlightContext } from '@/contexts/FlightContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const Flights = () => {
  const { user } = useAuth();
  const { createFlight, currentFlight, setCurrentFlight } = useFlightContext();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // Check if user is already in a flight and show workflow modal
  useEffect(() => {
    if (currentFlight && !isCreateModalOpen) {
      setIsWorkflowModalOpen(true);
    }
  }, [currentFlight, isCreateModalOpen]);

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Player';
  };

  const currentUser = {
    id: user?.id || '',
    name: getUserName(),
    email: user?.email
  };

  const handleCreateFlight = async (flightData: {
    name: string;
    courseName: string;
    players: any[];
  }) => {
    try {
      await createFlight(flightData);
      setIsCreateModalOpen(false);
      setIsWorkflowModalOpen(true);
    } catch (error) {
      console.error('Failed to create flight:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleJoinFlight = () => {
    setIsWorkflowModalOpen(true);
  };

  // Emergency escape function
  const handleEmergencyEscape = () => {
    setCurrentFlight(null);
    setIsWorkflowModalOpen(false);
    setIsCreateModalOpen(false);
    toast({
      title: "Flight Cleared",
      description: "Emergency flight state cleared. You can now navigate freely.",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Flights" />
        
        <div className="flex-1 max-w-4xl mx-auto p-4 space-y-6 pb-24">
          <div className="text-center space-y-2 py-4">
            <h1 className="text-2xl font-bold text-primary">Golf Flights</h1>
            <p className="text-muted-foreground">
              Join existing flights or create your own lobby for multiplayer rounds
            </p>
            
            {/* Emergency escape button */}
            {(currentFlight || isWorkflowModalOpen) && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">
                  Having trouble navigating? Use the emergency escape below.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleEmergencyEscape}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Exit Flight
                </Button>
              </div>
            )}
          </div>

          <FlightLobby 
            onCreateFlight={handleOpenCreateModal} 
            onJoinFlight={handleJoinFlight}
          />
        </div>
        
        <BottomTabs />
        
        {/* Create Flight Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Flight</DialogTitle>
            </DialogHeader>
            <FlightCreationForm
              onCreateFlight={handleCreateFlight}
              currentUser={currentUser}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
        
        <FlightWorkflowModal 
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Flights;