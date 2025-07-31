import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Camera, Info, Upload, X, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HandicapSectionProps {
  userProfile?: {
    whs_index?: number;
    handicap_proof_url?: string;
    handicap_status?: string;
    handicap_submitted_at?: string;
    handicap_reviewed_at?: string;
    handicap_rejection_reason?: string;
  };
  onUpdate?: () => void;
}

export const HandicapSection: React.FC<HandicapSectionProps> = ({ userProfile, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [whsIndex, setWhsIndex] = useState<string>(userProfile?.whs_index?.toString() || '');
  const [proofImage, setProofImage] = useState<string | null>(userProfile?.handicap_proof_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ whsIndex?: string }>({});

  const validateWhsIndex = (value: string): string | undefined => {
    if (!value) return undefined;
    
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < 0.0 || num > 54.0) return 'WHS Index must be between 0.0 and 54.0';
    
    return undefined;
  };

  const handleWhsIndexChange = (value: string) => {
    setWhsIndex(value);
    const error = validateWhsIndex(value);
    setErrors(prev => ({ ...prev, whsIndex: error }));
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/handicap-proof-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('handicap-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('handicap-proofs')
        .getPublicUrl(fileName);

      setProofImage(publicUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your handicap proof has been uploaded.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
        });
        return;
      }

      handleImageUpload(file);
    }
  };

  const handleSubmitForReview = async () => {
    if (!user || !whsIndex || !proofImage) return;

    const whsError = validateWhsIndex(whsIndex);
    if (whsError) {
      setErrors({ whsIndex: whsError });
      return;
    }

    setIsSaving(true);
    try {
      // Create handicap submission for review
      const { error: submissionError } = await supabase
        .from('handicap_submissions')
        .insert({
          user_id: user.id,
          whs_index: parseFloat(whsIndex),
          proof_image_url: proofImage,
          status: 'pending'
        });

      if (submissionError) throw submissionError;

      // Update profile status to pending
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          handicap_status: 'pending',
          handicap_submitted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Submitted for review",
        description: "Your handicap information has been submitted for verification.",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "Submit failed",
        description: "Failed to submit handicap for review. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeProofImage = async () => {
    if (!user || !proofImage) return;

    try {
      // Extract filename from URL for deletion
      const fileName = proofImage.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('handicap-proofs')
          .remove([fileName]);
      }

      setProofImage(null);

      // Update database to remove the proof URL
      const { error } = await supabase
        .from('profiles')
        .update({ handicap_proof_url: null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Image removed",
        description: "Handicap proof image has been removed.",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "Failed to remove image. Please try again.",
      });
    }
  };

  const getStatusDisplay = () => {
    const status = userProfile?.handicap_status || 'none';
    
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Under Review</p>
              <p className="text-xs text-yellow-600">
                Your handicap submission is being reviewed by our team.
              </p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
              Pending
            </Badge>
          </div>
        );
      
      case 'approved':
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                Verified Handicap: {userProfile?.whs_index}
                <CheckCircle className="h-4 w-4 text-green-600" />
              </p>
              <p className="text-xs text-green-600">
                Your handicap has been verified by our team.
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Verified
            </Badge>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="h-4 w-4 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Submission Rejected</p>
              <p className="text-xs text-red-600">
                {userProfile?.handicap_rejection_reason || 'Please resubmit with valid documentation.'}
              </p>
            </div>
            <Badge variant="destructive">
              Rejected
            </Badge>
          </div>
        );
      
      default:
        return null;
    }
  };

  const isApproved = userProfile?.handicap_status === 'approved';
  const isPending = userProfile?.handicap_status === 'pending';
  const canSubmit = whsIndex && proofImage && !isPending && !isApproved;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Handicap Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {getStatusDisplay()}

          {/* Only show form if not approved */}
          {!isApproved && (
            <>
              {/* WHS Index Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="whs-index" className="text-sm font-medium">
                    WHS Index
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm">
                        Find your official World Handicap System Index on your MGA (Member Golf Association) app or website. 
                        This is typically displayed as a decimal number (e.g., 12.3).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="whs-index"
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="54.0"
                  placeholder="e.g., 12.3"
                  value={whsIndex}
                  onChange={(e) => handleWhsIndexChange(e.target.value)}
                  className={`h-11 ${errors.whsIndex ? 'border-destructive' : ''}`}
                  disabled={isPending}
                />
                {errors.whsIndex && (
                  <p className="text-sm text-destructive">{errors.whsIndex}</p>
                )}
              </div>

              {/* Upload Proof Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload MGA Screenshot</Label>
                
                {proofImage ? (
                  <div className="relative">
                    <img
                      src={proofImage}
                      alt="Handicap proof"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    {!isPending && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                        onClick={removeProofImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload a screenshot of your official handicap from your MGA app
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isPending}
                      className="h-11 min-w-[44px]"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Submit Button */}
              {!isPending && (
                <Button
                  onClick={handleSubmitForReview}
                  disabled={!canSubmit || isSaving || !!errors.whsIndex}
                  className="w-full h-11"
                >
                  {isSaving ? 'Submitting...' : 'Submit for Verification'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};