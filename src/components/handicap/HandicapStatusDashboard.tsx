import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users, 
  Trophy,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { HandicapWizard } from './HandicapWizard';

interface HandicapStatusDashboardProps {
  userProfile?: {
    whs_index?: number;
    handicap_proof_url?: string;
    handicap_status?: string;
    handicap_submitted_at?: string;
    handicap_reviewed_at?: string;
    handicap_rejection_reason?: string;
    display_name?: string;
  };
  onUpdate?: () => void;
}

export const HandicapStatusDashboard: React.FC<HandicapStatusDashboardProps> = ({ 
  userProfile, 
  onUpdate 
}) => {
  const [showWizard, setShowWizard] = useState(false);
  
  const handicapStatus = userProfile?.handicap_status || 'none';
  const hasHandicap = handicapStatus === 'approved';
  const isPending = handicapStatus === 'pending';
  const isRejected = handicapStatus === 'rejected';

  // Mock data for demonstration - in real app, this would come from actual data
  const mockStats = {
    roundsPlayed: 12,
    averageScore: 89,
    improvement: -2.3,
    communityRank: 45,
    upcomingTournaments: 3
  };

  const getStatusIcon = () => {
    switch (handicapStatus) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (handicapStatus) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const getStatusText = () => {
    switch (handicapStatus) {
      case 'approved':
        return {
          title: 'Handicap Verified',
          subtitle: `Your WHS Index of ${userProfile?.whs_index} is verified and active`,
          action: 'Update Handicap'
        };
      case 'pending':
        return {
          title: 'Under Review',
          subtitle: 'Your handicap submission is being reviewed by our team',
          action: 'Check Status'
        };
      case 'rejected':
        return {
          title: 'Submission Rejected',
          subtitle: userProfile?.handicap_rejection_reason || 'Please resubmit with valid documentation',
          action: 'Resubmit Handicap'
        };
      default:
        return {
          title: 'No Handicap Set',
          subtitle: 'Set up your handicap to unlock tournaments and accurate flight matching',
          action: 'Set Up Handicap'
        };
    }
  };

  const statusInfo = getStatusText();

  if (showWizard) {
    return (
      <HandicapWizard
        onComplete={() => {
          setShowWizard(false);
          onUpdate?.();
        }}
        onCancel={() => setShowWizard(false)}
        initialData={{
          ...(userProfile?.whs_index != null ? { whs_index: userProfile.whs_index } : {}),
          ...(userProfile?.handicap_proof_url ? { proof_image_url: userProfile.handicap_proof_url } : {})
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold text-lg">{statusInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{statusInfo.subtitle}</p>
              </div>
            </div>
            {hasHandicap && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Progress for pending submissions */}
          {isPending && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Review Progress</span>
                <span>Step 2 of 3</span>
              </div>
              <Progress value={66} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Estimated completion: 1-2 business days
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowWizard(true)}
              variant={hasHandicap ? "outline" : "default"}
              className="flex-1"
            >
              {hasHandicap ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {statusInfo.action}
                </>
              )}
            </Button>
            
            {hasHandicap && (
              <Button variant="outline" size="icon">
                <TrendingUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - only show if user has approved handicap */}
      {hasHandicap && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mockStats.roundsPlayed}</div>
              <div className="text-sm text-muted-foreground">Rounds Played</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mockStats.averageScore}</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {mockStats.improvement}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Improvement</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <div className="text-2xl font-bold">#{mockStats.communityRank}</div>
              </div>
              <div className="text-sm text-muted-foreground">Community Rank</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      {hasHandicap && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Available Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Upcoming Tournaments</p>
                <p className="text-sm text-muted-foreground">
                  {mockStats.upcomingTournaments} tournaments available for your handicap range
                </p>
              </div>
              <Button size="sm">View</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Find Playing Partners</p>
                <p className="text-sm text-muted-foreground">
                  Connect with golfers at your skill level
                </p>
              </div>
              <Button size="sm" variant="outline">Browse</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};