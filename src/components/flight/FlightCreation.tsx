import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import { FlightManagement } from './FlightManagement';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
  handicap?: number;
}

interface FlightCreationProps {
  onCreateFlight: (flight: {
    name: string;
    courseName: string;
    players: Player[];
  }) => Promise<void>;
  currentUser: {
    id: string;
    name: string;
    email?: string;
  };
}

export const FlightCreation: React.FC<FlightCreationProps> = ({
  onCreateFlight,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [flightName, setFlightName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    {
      id: currentUser.id,
      name: currentUser.name,
      isRegistered: true,
      userId: currentUser.id,
      ...(currentUser.email ? { email: currentUser.email } : {})
    }
  ]);
  const { toast } = useToast();

  const handleAddPlayer = (newPlayer: Omit<Player, 'id'>) => {
    const player: Player = {
      id: `player-${Date.now()}`,
      ...newPlayer
    };
    setPlayers([...players, player]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const handleReorderPlayers = (reorderedPlayers: Player[]) => {
    setPlayers(reorderedPlayers);
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFlight = async () => {
    if (!flightName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a flight name"
      });
      return;
    }

    if (!courseName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course name"
      });
      return;
    }

    try {
      setIsCreating(true);
      await onCreateFlight({
        name: flightName,
        courseName: courseName,
        players: players
      });

      // Reset form
      setFlightName('');
      setCourseName('');
      setPlayers([{
        id: currentUser.id,
        name: currentUser.name,
        isRegistered: true,
        userId: currentUser.id,
        ...(currentUser.email ? { email: currentUser.email } : {})
      }]);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create flight:', error);
      // Error toast is handled in the context
    } finally {
      setIsCreating(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="w-full cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Create New Flight</h3>
              <p className="text-sm text-muted-foreground">
                Start a round with friends or guests
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Flight</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flight Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-name">Flight Name</Label>
                  <Input
                    id="flight-name"
                    placeholder="e.g., Sunday Morning Round"
                    value={flightName}
                    onChange={(e) => setFlightName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course-name">Course Name</Label>
                  <Input
                    id="course-name"
                    placeholder="e.g., Pebble Beach Golf Links"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{currentDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{courseName || 'Course Name'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Management */}
          <FlightManagement
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onReorderPlayers={handleReorderPlayers}
            maxPlayers={4}
          />

          {/* Flight Summary */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Flight Summary</span>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {players.length} players
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Registered:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {players.filter(p => p.isRegistered).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Guests:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {players.filter(p => !p.isRegistered).length}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  All players will be able to track scores together. Guest players can upgrade to 
                  registered accounts to access round history.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateFlight}
              disabled={!flightName.trim() || !courseName.trim() || isCreating}
            >
              {isCreating ? 'Creating Flight...' : 'Create Flight & Set Handicaps'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};