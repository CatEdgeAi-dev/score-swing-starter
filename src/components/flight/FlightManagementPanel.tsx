import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Crown, 
  LogOut, 
  UserPlus, 
  Settings,
  Trash2,
  Calendar,
  MapPin
} from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { FlightHandicapSetup } from './FlightHandicapSetup';
import { FlightHandicapValidation } from './FlightHandicapValidation';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { supabase } from '@/integrations/supabase/client';

export const FlightManagementPanel: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentFlight, currentPlayer, leaveFlight, isFlightMode, needsValidation, validationStatuses } = useFlightContext();
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!isFlightMode || !currentFlight) {
    return null;
  }

  const isCreator = currentFlight.createdBy === user?.id;
  const playerCount = currentFlight.players.length;
  
  // Check if all players have handicaps set
  const allHandicapsSet = currentFlight.players.every(player => player.handicap !== undefined);
  
  // Check validation progress
  const allValidationsComplete = validationStatuses.length > 0 && 
    validationStatuses.every(status => status.status === 'validated');
  
  // Delete flight operation
  const deleteFlightOperation = useAsyncOperation(
    async () => {
      if (!currentFlight) return;
      
      const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', currentFlight.id);
        
      if (error) throw error;
    },
    {
      showSuccessToast: true,
      successMessage: `${currentFlight?.name} has been deleted`,
      errorMessage: 'Failed to delete flight'
    }
  );

  const handleLeaveFlight = useCallback(async () => {
    await leaveFlight();
    setShowLeaveDialog(false);
    toast({
      title: "Left Flight",
      description: `You have left ${currentFlight.name}`,
    });
    navigate('/rounds');
  }, [leaveFlight, currentFlight.name, toast, navigate]);

  const handleDeleteFlight = useCallback(async () => {
    const result = await deleteFlightOperation.execute();
    if (result !== null) {
      setShowDeleteDialog(false);
      navigate('/rounds');
    }
  }, [deleteFlightOperation, navigate]);

  // Show handicap setup if handicaps aren't set
  if (!allHandicapsSet) {
    return (
      <>
        <FlightHandicapSetup />
        <Card className="w-full">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowLeaveDialog(true)}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Flight
            </Button>
          </CardContent>
        </Card>
        
        <ConfirmationDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          title="Leave Flight?"
          description={`Are you sure you want to leave ${currentFlight.name}? You'll lose access to the flight scorecard.`}
          confirmLabel="Leave Flight"
          cancelLabel="Stay"
          variant="destructive"
          onConfirm={handleLeaveFlight}
        />
      </>
    );
  }

  // Show validation if handicaps are set but validation isn't complete
  if (needsValidation && !allValidationsComplete) {
    return (
      <>
        <FlightHandicapValidation />
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Complete peer validation to start your round
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowLeaveDialog(true)}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Flight
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <ConfirmationDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
          title="Leave Flight?"
          description={`Are you sure you want to leave ${currentFlight.name}? You'll lose access to the flight scorecard.`}
          confirmLabel="Leave Flight"
          cancelLabel="Stay"
          variant="destructive"
          onConfirm={handleLeaveFlight}
        />
      </>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Flight Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Flight Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{currentFlight.name}</h3>
              {isCreator && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Creator
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{currentFlight.courseName || 'Golf Course'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Players List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Players ({playerCount}/4)</h4>
            <div className="space-y-2">
              {currentFlight.players.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-2 rounded-md ${
                    player.id === currentPlayer?.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-xs">
                       {index + 1}
                     </Badge>
                     <span className="text-sm font-medium">{player.name}</span>
                     {player.handicap !== undefined && (
                       <Badge variant="secondary" className="text-xs">
                         {player.handicap}
                       </Badge>
                     )}
                     {player.email && (
                       <span className="text-xs text-muted-foreground">({player.email})</span>
                     )}
                   </div>
                  {player.id === currentPlayer?.id && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
              ))}
            </div>
            
            {playerCount < 4 && isCreator && (
              <Button variant="outline" size="sm" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Add Player
              </Button>
            )}
          </div>

          <Separator />

           {/* Flight Actions */}
           <div className="space-y-2">
             <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
               <p className="text-sm text-green-800 font-medium">✓ Validation Complete</p>
               <p className="text-xs text-green-700">Ready to start your round!</p>
             </div>
             
              <Button 
                onClick={() => {
                  sessionStorage.setItem('fromRounds', 'true');
                  navigate('/scorecard');
                }}
                className="w-full gap-2"
              >
                Start Round
              </Button>
             
             {isCreator ? (
               <>
                 <Button variant="outline" size="sm" className="w-full gap-2">
                   <Settings className="h-4 w-4" />
                   Flight Settings
                 </Button>
                 <Button 
                   variant="destructive" 
                   size="sm" 
                   className="w-full gap-2"
                   onClick={() => setShowDeleteDialog(true)}
                 >
                   <Trash2 className="h-4 w-4" />
                   Delete Flight
                 </Button>
               </>
             ) : (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full gap-2"
                 onClick={() => setShowLeaveDialog(true)}
               >
                 <LogOut className="h-4 w-4" />
                 Leave Flight
               </Button>
             )}
           </div>
        </CardContent>
      </Card>

      {/* Leave Flight Confirmation */}
      <ConfirmationDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        title="Leave Flight?"
        description={`Are you sure you want to leave ${currentFlight.name}? You'll lose access to the flight scorecard.`}
        confirmLabel="Leave Flight"
        cancelLabel="Stay"
        variant="destructive"
        onConfirm={handleLeaveFlight}
      />

      {/* Delete Flight Confirmation */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Flight?"
        description={`Are you sure you want to delete ${currentFlight.name}? This will remove the flight for all players and cannot be undone.`}
        confirmLabel="Delete Flight"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteFlight}
      />
    </>
  );
};