import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HandicapSubmission {
  id: string;
  user_id: string;
  whs_index: number;
  proof_image_url: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  notes?: string;
  profiles?: {
    display_name?: string;
  };
}

const AdminHandicapReview: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<HandicapSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<HandicapSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // First get submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('handicap_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Then get profile data for each submission
      const submissionsWithProfiles = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', submission.user_id)
            .single();

          return {
            ...submission,
            profiles: profile
          };
        })
      );

      setSubmissions(submissionsWithProfiles as HandicapSubmission[]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load handicap submissions.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission: HandicapSubmission) => {
    if (!user) return;

    setProcessing(true);
    try {
      // Update submission status
      const { error: submissionError } = await supabase
        .from('handicap_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          notes
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Update user profile with approved handicap
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          whs_index: submission.whs_index,
          handicap_proof_url: submission.proof_image_url,
          handicap_status: 'approved',
          handicap_reviewed_at: new Date().toISOString(),
          handicap_reviewed_by: user.id
        })
        .eq('id', submission.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Handicap approved",
        description: `${submission.profiles?.display_name || 'User'}'s handicap has been approved.`,
      });

      fetchSubmissions();
      setSelectedSubmission(null);
      setNotes('');
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve handicap submission.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (submission: HandicapSubmission) => {
    if (!user || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      // Update submission status
      const { error: submissionError } = await supabase
        .from('handicap_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason,
          notes
        })
        .eq('id', submission.id);

      if (submissionError) throw submissionError;

      // Update user profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          handicap_status: 'rejected',
          handicap_reviewed_at: new Date().toISOString(),
          handicap_reviewed_by: user.id,
          handicap_rejection_reason: rejectionReason
        })
        .eq('id', submission.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Handicap rejected",
        description: `${submission.profiles?.display_name || 'User'}'s handicap has been rejected.`,
      });

      fetchSubmissions();
      setSelectedSubmission(null);
      setRejectionReason('');
      setNotes('');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject handicap submission.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col">
          <TopBar title="Handicap Review" />
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading submissions...</p>
            </div>
          </div>
          <BottomTabs />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Handicap Review" />
        
        <div className="flex-1 p-4 space-y-4 pb-24">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No submissions to review</h3>
                <p className="text-muted-foreground">All handicap submissions have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{submission.profiles?.display_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {formatDate(submission.submitted_at)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">WHS Index</Label>
                      <p className="text-lg font-semibold">{submission.whs_index}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Proof Image</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Image
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Handicap Proof Image</DialogTitle>
                          </DialogHeader>
                          <img
                            src={submission.proof_image_url}
                            alt="Handicap proof"
                            className="w-full h-auto rounded-lg border"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {submission.status === 'pending' && (
                    <div className="flex gap-2">
                      <Dialog open={selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedSubmission(null);
                          setRejectionReason('');
                          setNotes('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Handicap</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Notes (optional)</Label>
                              <Textarea
                                placeholder="Add any notes about this approval..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(submission)}
                                disabled={processing}
                                className="flex-1"
                              >
                                {processing ? 'Approving...' : 'Confirm Approval'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedSubmission(null)}
                                disabled={processing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Handicap</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Rejection Reason *</Label>
                              <Textarea
                                placeholder="Please provide a reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <Label>Additional Notes (optional)</Label>
                              <Textarea
                                placeholder="Add any additional notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(submission)}
                                disabled={!rejectionReason.trim() || processing}
                                className="flex-1"
                              >
                                {processing ? 'Rejecting...' : 'Confirm Rejection'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectionReason('');
                                  setNotes('');
                                }}
                                disabled={processing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {submission.status !== 'pending' && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {submission.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                        {submission.reviewed_at && formatDate(submission.reviewed_at)}
                      </p>
                      {submission.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">
                          Reason: {submission.rejection_reason}
                        </p>
                      )}
                      {submission.notes && (
                        <p className="text-sm mt-1">
                          Notes: {submission.notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <BottomTabs />
      </div>
    </ProtectedRoute>
  );
};

export default AdminHandicapReview;