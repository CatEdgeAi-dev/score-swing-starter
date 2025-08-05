import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Calendar, Loader2, Trash2 } from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoading } from '@/components/ui/page-loading';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FlightLobbyProps {
  onCreateFlight: () => void;
  onJoinFlight?: () => void;
}

export const FlightLobby: React.FC<FlightLobbyProps> = ({ onCreateFlight, onJoinFlight }) => {
  const { availableFlights, joinFlight, deleteFlight, isLoading, refreshFlights } = useFlightContext();
  const { user } = useAuth();

  useEffect(() => {
    refreshFlights();
  }, [refreshFlights]);

  const handleJoinFlight = async (flightId: string) => {
    try {
      await joinFlight(flightId);
      // Trigger the workflow modal for the joined player
      onJoinFlight?.();
    } catch (error) {
      console.error('Failed to join flight:', error);
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    try {
      await deleteFlight(flightId);
    } catch (error) {
      console.error('Failed to delete flight:', error);
    }
  };

  const isUserInFlight = (flight: any) => {
    return flight.players.some((player: any) => player.userId === user?.id);
  };

  const isFlightCreator = (flight: any) => {
    return flight.createdBy === user?.id;
  };

  const canJoinFlight = (flight: any) => {
    return !isUserInFlight(flight) && flight.players.length < 4;
  };

  if (isLoading && availableFlights.length === 0) {
    return <PageLoading message="Loading available flights..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Available Flights</h2>
          <p className="text-muted-foreground">Join an existing flight or create a new one</p>
        </div>
        <Button onClick={onCreateFlight}>
          Create New Flight
        </Button>
      </div>

      {availableFlights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No flights available</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a flight for today
            </p>
            <Button onClick={onCreateFlight}>
              Create Flight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availableFlights.map((flight) => (
            <Card key={flight.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{flight.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {flight.courseName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {flight.datePlayedInfo}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={flight.status === 'waiting' ? 'secondary' : 'outline'}>
                    {flight.status === 'waiting' ? 'Waiting for Players' : 'In Progress'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {flight.players.length} / 4 players
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {flight.players.map((player, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {player.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                   <div className="flex gap-2">
                     {isFlightCreator(flight) && (
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Delete Flight</AlertDialogTitle>
                             <AlertDialogDescription>
                               Are you sure you want to delete "{flight.name}"? This action cannot be undone and will remove all players from the flight.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={() => handleDeleteFlight(flight.id)}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                             >
                               Delete Flight
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     )}
                     
                     {isUserInFlight(flight) ? (
                       <Button variant="outline" disabled>
                         Already Joined
                       </Button>
                     ) : canJoinFlight(flight) ? (
                       <Button 
                         onClick={() => handleJoinFlight(flight.id)}
                         disabled={isLoading}
                       >
                         {isLoading ? (
                           <>
                             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                             Joining...
                           </>
                         ) : (
                           'Join Flight'
                         )}
                       </Button>
                     ) : (
                       <Button variant="outline" disabled>
                         Flight Full
                       </Button>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={refreshFlights}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Flights'
          )}
        </Button>
      </div>
    </div>
  );
};