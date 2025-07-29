import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  MapPin,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Eye,
  Users,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Round {
  id: string;
  courseName: string;
  datePlayedInfo: string;
  totalScore: number;
  totalPutts: number;
  averagePutts: number;
  girPercentage: number;
  fairwayPercentage: number;
  flightName?: string;
  playerName?: string;
  isFlightRound: boolean;
}

interface RoundHistoryCardProps {
  round: Round;
  onViewDetails: (round: Round) => void;
}

const RoundHistoryCard: React.FC<RoundHistoryCardProps> = ({ round, onViewDetails }) => {
  const par = 72;
  const scoreVsPar = round.totalScore - par;
  
  const getScoreStatus = () => {
    if (scoreVsPar < 0) return { text: 'Under Par', icon: TrendingDown, color: 'text-green-600' };
    if (scoreVsPar === 0) return { text: 'Even Par', icon: Minus, color: 'text-blue-600' };
    return { text: 'Over Par', icon: TrendingUp, color: 'text-orange-600' };
  };

  const scoreStatus = getScoreStatus();
  const StatusIcon = scoreStatus.icon;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{round.courseName}</CardTitle>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{round.datePlayedInfo}</span>
              </div>
              {round.isFlightRound && (
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{round.flightName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{round.totalScore}</div>
            <div className={`flex items-center space-x-1 text-xs ${scoreStatus.color}`}>
              <StatusIcon className="h-3 w-3" />
              <span>{scoreVsPar > 0 ? '+' : ''}{scoreVsPar}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Player name display for both solo and flight rounds */}
          {round.playerName && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{round.playerName}</span>
              {round.isFlightRound && (
                <Badge variant="outline" className="text-xs">
                  Flight: {round.flightName}
                </Badge>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-primary">{round.averagePutts.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Putts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{round.girPercentage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">GIR</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{round.fairwayPercentage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Fairways</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Badge variant={round.isFlightRound ? "default" : "secondary"}>
              {round.isFlightRound ? "Flight Round" : "Solo Round"}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(round)}
              className="flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>View Details</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RoundHistoryListProps {
  rounds: Round[];
  loading: boolean;
  onViewDetails: (round: Round) => void;
}

export const RoundHistoryList: React.FC<RoundHistoryListProps> = ({
  rounds,
  loading,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'solo' | 'flight'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'course'>('date');

  const filteredAndSortedRounds = rounds
    .filter(round => {
      const matchesSearch = round.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (round.flightName && round.flightName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (round.playerName && round.playerName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'solo' && !round.isFlightRound) ||
                           (filterType === 'flight' && round.isFlightRound);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return a.totalScore - b.totalScore;
        case 'course':
          return a.courseName.localeCompare(b.courseName);
        case 'date':
        default:
          return new Date(b.datePlayedInfo).getTime() - new Date(a.datePlayedInfo).getTime();
      }
    });

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rounds by course or player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                <span className={cn(filterType === 'all' && "font-semibold")}>All Rounds</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('solo')}>
                <span className={cn(filterType === 'solo' && "font-semibold")}>Solo Rounds</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('flight')}>
                <span className={cn(filterType === 'flight' && "font-semibold")}>Flight Rounds</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                <span className={cn(sortBy === 'date' && "font-semibold")}>Sort by Date</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('score')}>
                <span className={cn(sortBy === 'score' && "font-semibold")}>Sort by Score</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('course')}>
                <span className={cn(sortBy === 'course' && "font-semibold")}>Sort by Course</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredAndSortedRounds.length} round{filteredAndSortedRounds.length !== 1 ? 's' : ''} found
        </span>
        {filterType !== 'all' && (
          <Badge variant="outline" className="text-xs">
            {filterType === 'solo' ? 'Solo Rounds' : 'Flight Rounds'}
          </Badge>
        )}
      </div>

      {/* Rounds List */}
      {filteredAndSortedRounds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No rounds found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start playing to see your round history here'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRounds.map((round) => (
            <RoundHistoryCard
              key={round.id}
              round={round}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};