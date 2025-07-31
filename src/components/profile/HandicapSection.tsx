import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Camera, Info, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HandicapSectionProps {
  userProfile?: {
    whs_index?: number;
    handicap_proof_url?: string;
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
      const fileName = `${user.id}-handicap-proof-${Date.now()}.${fileExt}`;
      
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

  const handleSave = async () => {
    if (!user) return;

    const whsError = validateWhsIndex(whsIndex);
    if (whsError) {
      setErrors({ whsIndex: whsError });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        handicap_updated_at: new Date().toISOString(),
      };

      if (whsIndex) {
        updateData.whs_index = parseFloat(whsIndex);
      }

      if (proofImage) {
        updateData.handicap_proof_url = proofImage;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Handicap updated",
        description: "Your handicap information has been saved.",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Failed to save handicap information. Please try again.",
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={removeProofImage}
                >
                  <X className="h-3 w-3" />
                </Button>
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
                  disabled={isUploading}
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

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !!errors.whsIndex}
            className="w-full h-11"
          >
            {isSaving ? 'Saving...' : 'Save Handicap Information'}
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};