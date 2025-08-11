import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Search, 
  X, 
  Crown,
  User,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
  handicap?: number;
}

interface FlightManagementProps {
  flightId?: string;
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onRemovePlayer: (playerId: string) => void;
  onReorderPlayers: (players: Player[]) => void;
  maxPlayers?: number;
}

export const FlightManagement: React.FC<FlightManagementProps> = ({
  flightId,
  players,
  onAddPlayer,
  onRemovePlayer,
  onReorderPlayers,
  maxPlayers = 4
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleAddGuest = () => {
    if (!guestName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a guest name"
      });
      return;
    }

    if (players.length >= maxPlayers) {
      toast({
        variant: "destructive",
        title: "Flight Full",
        description: `Maximum ${maxPlayers} players allowed`
      });
      return;
    }

    onAddPlayer({
      name: guestName.trim(),
      isRegistered: false
    });

    setGuestName('');
    toast({
      title: "Guest Added",
      description: `${guestName} has been added to the flight`
    });
  };

  const handleSearchFriends = async () => {
    if (!friendSearch.trim()) return;

    setIsSearching(true);
    try {
      // Get current user to exclude them from search
      const { data: { user } } = await supabase.auth.getUser();
      
      // Split search terms for more flexible name matching
      const searchTerms = friendSearch.trim().toLowerCase().split(' ').filter(term => term.length > 0);
      
      let query = supabase
        .from('profiles')
        .select('id, display_name, whs_index')
        .limit(10);

      if (user?.id) {
        query = query.neq('id', user.id); // Exclude current user when available
      }

      // Create OR conditions for each search term against display_name
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => `display_name.ilike.%${term}%`).join(',');
        query = query.or(searchConditions);
      }

      const { data: profiles, error } = await query;

      if (error) {
        throw error;
      }

      const searchResults: Player[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.display_name || 'Unknown User',
        isRegistered: true,
        userId: profile.id,
        ...(profile.whs_index != null ? { handicap: Number(profile.whs_index) } : {})
      }));

      setSearchResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Failed to search for friends"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = (friend: Player) => {
    if (players.length >= maxPlayers) {
      toast({
        variant: "destructive",
        title: "Flight Full",
        description: `Maximum ${maxPlayers} players allowed`
      });
      return;
    }

    if (players.some(p => p.userId === friend.userId)) {
      toast({
        variant: "destructive",
        title: "Already Added",
        description: `${friend.name} is already in this flight`
      });
      return;
    }

    onAddPlayer(friend);
    setSearchResults(searchResults.filter(r => r.id !== friend.id));
    toast({
      title: "Friend Added",
      description: `${friend.name} has been added to the flight`
    });
  };

  const handleRemovePlayer = (player: Player) => {
    onRemovePlayer(player.id);
    toast({
      title: "Player Removed",
      description: `${player.name} has been removed from the flight`
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Flight Players</span>
            <Badge variant="secondary">
              {players.length}/{maxPlayers}
            </Badge>
          </CardTitle>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={players.length >= maxPlayers}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Players to Flight</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="guest" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="guest">Add Guest</TabsTrigger>
                  <TabsTrigger value="friends">Find Friends</TabsTrigger>
                </TabsList>
                
                <TabsContent value="guest" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-name">Guest Name</Label>
                    <Input
                      id="guest-name"
                      placeholder="Enter guest player name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGuest()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Guest players won't have access to round history unless they create an account
                    </p>
                  </div>
                  <Button onClick={handleAddGuest} className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Add as Guest
                  </Button>
                </TabsContent>
                
                <TabsContent value="friends" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="friend-search">Search Registered Users</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="friend-search"
                        placeholder="Search by name or email"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchFriends()}
                      />
                      <Button 
                        onClick={handleSearchFriends} 
                        disabled={isSearching}
                        size="sm"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium">{friend.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>Registered User</span>
                                {friend.handicap !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">
                                      Handicap: {friend.handicap.toFixed(1)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddFriend(friend)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {friendSearch.trim() && searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-4 text-muted-foreground">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No players found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Registered friends will have full access to their round history and stats
                  </p>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No players added yet</p>
            <p className="text-xs">Add guests or invite friends to play together</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-background"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                    <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {player.isRegistered ? (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.isRegistered ? 'Registered User' : 'Guest Player'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {index > 0 && ( // Don't allow removing the flight creator
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePlayer(player)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {players.length > 0 && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>• Playing order: 1st player tees off first</p>
              <p>• Guest players need to register to access round history</p>
              <p>• Flight creator cannot be removed</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};