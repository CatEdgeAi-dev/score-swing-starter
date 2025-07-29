import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Crown, 
  User, 
  UserCheck, 
  ChevronDown,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  isRegistered: boolean;
  userId?: string;
  email?: string;
}

interface FlightPlayerSelectorProps {
  players: Player[];
  currentPlayer: Player;
  onPlayerSwitch: (player: Player) => void;
  flightName: string;
  className?: string;
}

export const FlightPlayerSelector: React.FC<FlightPlayerSelectorProps> = ({
  players,
  currentPlayer,
  onPlayerSwitch,
  flightName,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getPlayerBadgeColor = (player: Player, isCurrentPlayer: boolean) => {
    if (isCurrentPlayer) return "default";
    return player.isRegistered ? "secondary" : "outline";
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">{flightName}</h3>
              <p className="text-xs text-muted-foreground">
                Playing as: {currentPlayer.name}
              </p>
            </div>
          </div>

          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {getPlayerInitials(currentPlayer.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{currentPlayer.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Switch Player</p>
                <p className="text-xs text-muted-foreground">Track scores for different players</p>
              </div>
              <DropdownMenuSeparator />
              
              {players.map((player, index) => (
                <DropdownMenuItem
                  key={player.id}
                  onClick={() => {
                    onPlayerSwitch(player);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center space-x-3 cursor-pointer",
                    player.id === currentPlayer.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getPlayerInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{player.name}</span>
                        {index === 0 && <Crown className="h-3 w-3 text-yellow-500" />}
                      </div>
                      <div className="flex items-center space-x-1">
                        {player.isRegistered ? (
                          <UserCheck className="h-3 w-3 text-green-600" />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {player.isRegistered ? 'Registered' : 'Guest'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {player.id === currentPlayer.id && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Flight Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick player switcher for mobile */}
        <div className="mt-3 flex space-x-2 overflow-x-auto">
          {players.map((player, index) => (
            <Button
              key={player.id}
              variant={player.id === currentPlayer.id ? "default" : "outline"}
              size="sm"
              onClick={() => onPlayerSwitch(player)}
              className="flex items-center space-x-1 shrink-0"
            >
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs">
                  {getPlayerInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{player.name.split(' ')[0]}</span>
              {index === 0 && <Crown className="h-3 w-3 text-yellow-500 ml-1" />}
            </Button>
          ))}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Switch players to track individual scores in this flight
        </div>
      </CardContent>
    </Card>
  );
};