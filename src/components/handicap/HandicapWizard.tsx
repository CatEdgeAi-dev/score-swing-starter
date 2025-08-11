import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  ArrowLeft,
  Eye,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Tesseract from 'tesseract.js';

interface HandicapWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialData?: {
    whs_index?: number;
    proof_image_url?: string;
  };
}

type WizardStep = 'introduction' | 'capture' | 'extract' | 'confirm' | 'submit';

interface ExtractedData {
  value: number | null;
  confidence: number;
  text?: string;
}

export const HandicapWizard: React.FC<HandicapWizardProps> = ({ 
  onComplete, 
  onCancel, 
  initialData 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('introduction');
  const [whsIndex, setWhsIndex] = useState<string>(initialData?.whs_index?.toString() || '');
  const [proofImage, setProofImage] = useState<string | null>(initialData?.proof_image_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({ value: null, confidence: 0 });
  const [errors, setErrors] = useState<{ whsIndex?: string }>({});

  const steps: WizardStep[] = ['introduction', 'capture', 'extract', 'confirm', 'submit'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const validateWhsIndex = (value: string): string | undefined => {
    if (!value) return 'WHS Index is required';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < 0.0 || num > 54.0) return 'WHS Index must be between 0.0 and 54.0';
    return undefined;
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

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
      setCurrentStep('extract');
      
      toast({
        title: "Image uploaded successfully",
        description: "Processing image to extract handicap value...",
      });

      // Start OCR extraction
      await extractHandicapFromImage(publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const extractHandicapFromImage = async (imageUrl: string) => {
    setIsExtracting(true);
    try {
      console.log('Starting OCR extraction for:', imageUrl);
      
      // Use Tesseract.js for OCR
      const { data: { text, confidence } } = await Tesseract.recognize(
        imageUrl,
        'eng',
        {
          logger: m => console.log(m) // Optional: log progress
        }
      );
      
      console.log('OCR completed. Extracted text:', text);
      console.log('OCR confidence:', confidence);
      
      // Extract handicap index from text using multiple patterns
      const handicapPatterns = [
        /Handicap\s+Index[:\s]+(\d+\.?\d*)/i,
        /WHS\s+Index[:\s]+(\d+\.?\d*)/i,
        /Index[:\s]+(\d+\.?\d*)/i,
        /Handicap[:\s]+(\d+\.?\d*)/i,
        // Look for numbers that could be handicap (0.0 to 54.0)
        /(\d{1,2}\.\d)/g
      ];
      
      let extractedValue: number | null = null;
      let extractedConfidence = confidence / 100; // Convert to 0-1 scale
      
      // Try each pattern
      for (const pattern of handicapPatterns) {
        const match = text.match(pattern);
        if (match) {
          const value = parseFloat(match[1]);
          // Validate it's a reasonable handicap value
          if (value >= 0.0 && value <= 54.0) {
            extractedValue = value;
            console.log(`Found handicap using pattern: ${pattern}, value: ${value}`);
            break;
          }
        }
      }
      
      // If no specific pattern worked, look for any decimal numbers in valid range
      if (!extractedValue) {
        const decimalMatches = text.match(/(\d{1,2}\.\d)/g);
        if (decimalMatches) {
          for (const match of decimalMatches) {
            const value = parseFloat(match);
            if (value >= 0.0 && value <= 54.0) {
              extractedValue = value;
              console.log(`Found handicap from decimal scan: ${value}`);
              break;
            }
          }
        }
      }
      
      const extraction: ExtractedData = {
        value: extractedValue,
        confidence: extractedConfidence,
        text: text.substring(0, 200) // Store first 200 chars for debugging
      };
      
      setExtractedData(extraction);
      setCurrentStep('confirm');
      
      if (extractedValue) {
        toast({
          title: "Handicap detected!",
          description: `Found handicap index: ${extractedValue}. Please verify it's correct.`,
        });
      } else {
        toast({
          title: "Image processed",
          description: "Couldn't automatically detect handicap. Please enter manually.",
        });
      }
      
    } catch (error) {
      console.error('OCR extraction error:', error);
      
      // Fallback: still proceed to confirmation step
      setExtractedData({ value: null, confidence: 0, text: 'OCR failed' });
      setCurrentStep('confirm');
      
      toast({
        variant: "destructive",
        title: "OCR failed",
        description: "Could not extract text from image. Please enter handicap manually.",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !whsIndex || !proofImage) return;

    const whsError = validateWhsIndex(whsIndex);
    if (whsError) {
      setErrors({ whsIndex: whsError });
      return;
    }

    setIsSubmitting(true);
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
        title: "Handicap submitted successfully!",
        description: "Your handicap information has been submitted for verification. You'll be notified once it's reviewed.",
      });

      onComplete();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Failed to submit handicap for review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'introduction':
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Set Up Your Handicap</h3>
              <p className="text-muted-foreground mb-4">
                Having a verified handicap allows you to participate in tournaments, 
                join appropriate flights, and track your progress accurately.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  A screenshot of your official WHS Index from your MGA app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Your current handicap index number (0.0 - 54.0)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  About 2-3 minutes to complete the process
                </li>
              </ul>
            </div>
            <Button onClick={() => setCurrentStep('capture')} className="w-full">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 'capture':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Upload Handicap Proof</h3>
              <p className="text-muted-foreground">
                Take a screenshot of your official handicap from your MGA app
              </p>
            </div>

            {proofImage ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={proofImage}
                    alt="Handicap proof"
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setProofImage(null);
                      setExtractedData({ value: null, confidence: 0 });
                    }}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Retake Photo
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('extract')} 
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a clear screenshot showing your official WHS Index
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </>
                    )}
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        );

      case 'extract':
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {isExtracting ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Sparkles className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {isExtracting ? 'Processing Image...' : 'Image Processed'}
              </h3>
              <p className="text-muted-foreground">
                {isExtracting 
                  ? 'Our AI is extracting your handicap information from the image'
                  : 'Image processing complete. Please verify the information below.'
                }
              </p>
            </div>
            
            {isExtracting ? (
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : (
              <Button onClick={() => setCurrentStep('confirm')} className="w-full">
                Continue to Verification
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Verify Your Information</h3>
              <p className="text-muted-foreground">
                Please confirm your handicap information is correct
              </p>
            </div>

            {proofImage && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Uploaded Image</Label>
                <div className="relative">
                  <img
                    src={proofImage}
                    alt="Handicap proof"
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm"
                    onClick={() => window.open(proofImage, '_blank')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Full
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="confirm-whs-index" className="text-sm font-medium">
                  WHS Index
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      Your official World Handicap System Index as shown in your MGA app.
                      This should be a decimal number (e.g., 12.3).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {extractedData.value && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Detected: {extractedData.value}
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      {Math.round(extractedData.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => setWhsIndex(extractedData.value?.toString() || '')}
                  >
                    Use this value
                  </Button>
                </div>
              )}
              
              <Input
                id="confirm-whs-index"
                type="number"
                step="0.1"
                min="0.0"
                max="54.0"
                placeholder="e.g., 12.3"
                value={whsIndex}
                onChange={(e) => {
                  setWhsIndex(e.target.value);
                  const error = validateWhsIndex(e.target.value);
                  setErrors(prev => {
                    const { whsIndex: _omit, ...rest } = prev;
                    return error ? { ...rest, whsIndex: error } : rest;
                  });
                }}
                className={`h-12 text-lg ${errors.whsIndex ? 'border-destructive' : ''}`}
              />
              {errors.whsIndex && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.whsIndex}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('capture')}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep('submit')}
                disabled={!whsIndex || !!errors.whsIndex}
                className="flex-1"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'submit':
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to Submit</h3>
              <p className="text-muted-foreground mb-4">
                Your handicap information is ready for verification by our team.
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-3">Submission Summary:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WHS Index:</span>
                  <span className="font-medium">{whsIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proof Image:</span>
                  <span className="font-medium">✓ Uploaded</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Review Time:</span>
                  <span className="font-medium">1-2 business days</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('confirm')}
                disabled={isSubmitting}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Review
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <Card className="max-w-lg mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Handicap Verification</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              ×
            </Button>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};