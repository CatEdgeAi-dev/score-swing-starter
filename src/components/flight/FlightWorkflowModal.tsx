import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Target, Play } from 'lucide-react';
import { useFlightContextSafe } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FlightHandicapSetup } from './FlightHandicapSetup';
import { FlightHandicapValidation } from './FlightHandicapValidation';
import { useNavigate } from 'react-router-dom';

interface FlightWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightWorkflowModal: React.FC<FlightWorkflowModalProps> = ({
  isOpen,
  onClose
}) => {
  const flightContext = useFlightContextSafe();
  
  // Early return if context is not available yet
  if (!flightContext) {
    return null;
  }
  
  const { currentFlight, needsValidation } = flightContext;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'setup' | 'validation' | 'ready'>('setup');

  useEffect(() => {
    if (!currentFlight || !user) {
      return;
    }

    // Only check flight status once when modal opens, not continuously
    const checkFlightStatus = async () => {
      try {
        const { data: players, error } = await supabase
          .from('flight_players')
          .select('id, handicap')
          .eq('flight_id', currentFlight.id);

        if (error) throw error;

        const allHandicapsSet = players.every(p => p.handicap !== null);
        
        if (!allHandicapsSet) {
          setCurrentStep('setup');
        } else if (needsValidation) {
          setCurrentStep('validation');
        } else {
          setCurrentStep('ready');
        }
      } catch (error) {
        console.error('Error checking flight status:', error);
        setCurrentStep('setup');
      }
    };

    // Only run once when the modal opens
    if (isOpen && currentStep === 'setup') {
      checkFlightStatus();
    }
  }, [isOpen, currentFlight?.id, user?.id]); // Removed needsValidation and currentStep to prevent loops

  const handleStartRound = () => {
    navigate('/scorecard');
    onClose();
  };


  const getStepIndicator = () => {
    const steps = [
      { key: 'setup', label: 'Handicap Setup', icon: Target },
      { key: 'validation', label: 'Peer Validation', icon: Users },
      { key: 'ready', label: 'Ready to Play', icon: Play }
    ];

    return (
      <div className="flex items-center justify-center gap-4 mb-6">
        {steps.map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted = 
            (step.key === 'setup' && currentStep !== 'setup') ||
            (step.key === 'validation' && currentStep === 'ready');
          
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2
                ${isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                  isActive ? 'border-primary text-primary' :
                  'border-muted-foreground text-muted-foreground'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-primary' : 
                isCompleted ? 'text-primary' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  isCompleted ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'setup':
        return <FlightHandicapSetup />;
      
      case 'validation':
        return <FlightHandicapValidation />;
      
      case 'ready':
        return (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ready to Start!</h3>
                <p className="text-muted-foreground">
                  All handicaps have been validated. Your flight is ready to begin the round.
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="gap-2">
                  <Users className="h-3 w-3" />
                  {currentFlight?.players.length} Players
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {currentFlight?.name} • {currentFlight?.courseName}
                </div>
              </div>
              <Button onClick={handleStartRound} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Start Round
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (!currentFlight) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Flight Setup - {currentFlight.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {getStepIndicator()}
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};