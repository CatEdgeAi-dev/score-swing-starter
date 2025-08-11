import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
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

interface FlightCreationFormProps {
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
  onCancel?: () => void;
}

export const FlightCreationForm: React.FC<FlightCreationFormProps> = ({
  onCreateFlight,
  currentUser,
  onCancel
}) => {
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
  const [isCreating, setIsCreating] = useState(false);
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
      
      // ===== DEBUG: FORM SUBMISSION START =====
      console.group('📝 FLIGHT CREATION FORM DEBUG');
      console.log('🚀 Form submission initiated');
      console.log('📋 Flight details:', {
        name: flightName,
        courseName: courseName,
        playerCount: players.length
      });
      console.log('👥 Players being submitted:', players.map((p, index) => ({
        index: index + 1,
        id: p.id,
        name: p.name,
        isRegistered: p.isRegistered,
        userId: p.userId,
        email: p.email,
        hasUserId: !!p.userId,
        playerType: p.isRegistered ? 'REGISTERED' : 'GUEST'
      })));
      console.log('🔍 Guest players analysis:', {
        totalGuests: players.filter(p => !p.isRegistered).length,
        guestPlayers: players.filter(p => !p.isRegistered).map(p => ({
          name: p.name,
          hasUserId: !!p.userId,
          id: p.id
        }))
      });
      console.groupEnd();
      // ===== DEBUG: FORM SUBMISSION END =====
      
      await onCreateFlight({
        name: flightName,
        courseName: courseName,
        players: players
      });
    } catch (error) {
      console.error('❌ Failed to create flight:', error);
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
        {onCancel && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={handleCreateFlight}
          disabled={!flightName.trim() || !courseName.trim() || isCreating}
        >
          {isCreating ? 'Creating Flight...' : 'Create Flight & Set Handicaps'}
        </Button>
      </div>
    </div>
  );
};