import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HoleData } from '@/components/scorecard/ScorecardContext';

export interface Round {
  id: string;
  user_id: string;
  course_name?: string;
  date_played: string;
  total_score: number;
  total_putts: number;
  fairways_hit: number;
  greens_in_regulation: number;
  created_at: string;
  updated_at: string;
}

export const useRounds = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const saveRound = async (
    holes: Record<number, HoleData>,
    courseName?: string
  ): Promise<Round | null> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to save rounds.",
      });
      return null;
    }

    setLoading(true);
    try {
      // Calculate round statistics
      const totalScore = Object.values(holes).reduce((total, hole) => total + hole.strokes, 0);
      const totalPutts = Object.values(holes).reduce((total, hole) => total + hole.putts, 0);
      const fairwaysHit = Object.values(holes).filter(hole => hole.par > 3 && hole.fairwayHit).length;
      const greensInRegulation = Object.values(holes).filter(hole => hole.greenInRegulation).length;

      // Create the round
      const { data: round, error: roundError } = await supabase
        .from('rounds')
        .insert({
          user_id: user.id,
          course_name: courseName,
          total_score: totalScore,
          total_putts: totalPutts,
          fairways_hit: fairwaysHit,
          greens_in_regulation: greensInRegulation,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Create hole records
      const holeRecords = Object.entries(holes).map(([holeNumber, holeData]) => ({
        round_id: round.id,
        hole_number: parseInt(holeNumber),
        par: holeData.par,
        strokes: holeData.strokes,
        putts: holeData.putts,
        fairway_hit: holeData.fairwayHit,
        green_in_regulation: holeData.greenInRegulation,
        up_and_down: holeData.upAndDown,
        notes: holeData.notes,
      }));

      const { error: holesError } = await supabase
        .from('holes')
        .insert(holeRecords);

      if (holesError) throw holesError;

      toast({
        title: "Round saved!",
        description: "Your golf round has been saved successfully.",
      });

      return round;
    } catch (error: any) {
      console.error('Error saving round:', error);
      toast({
        variant: "destructive",
        title: "Error saving round",
        description: error.message || "An unexpected error occurred.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const shareRound = async (roundId: string): Promise<string | null> => {
    try {
      // Generate a shareable text summary
      const { data: round } = await supabase
        .from('rounds')
        .select('*, holes(*)')
        .eq('id', roundId)
        .single();

      if (!round) return null;

      const scoreVsPar = round.total_score - 72;
      const scoreText = scoreVsPar === 0 ? 'Even par' : scoreVsPar > 0 ? `+${scoreVsPar}` : `${scoreVsPar}`;
      
      const shareText = `🏌️ Golf Round Summary
📍 Course: ${round.course_name || 'Golf Course'}
📅 Date: ${new Date(round.date_played).toLocaleDateString()}
⛳ Score: ${round.total_score} (${scoreText})
🏀 Putts: ${round.total_putts}
🎯 GIR: ${round.greens_in_regulation}/18
🎪 Fairways: ${round.fairways_hit}/${round.holes?.filter((h: any) => h.par > 3).length || 14}

Shared from Golf Scorecard App`;

      if (navigator.share) {
        await navigator.share({
          title: 'Golf Round Summary',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Round summary copied to clipboard.",
        });
      }

      return shareText;
    } catch (error: any) {
      console.error('Error sharing round:', error);
      toast({
        variant: "destructive",
        title: "Error sharing round",
        description: "Failed to share round summary.",
      });
      return null;
    }
  };

  const fetchRounds = async (): Promise<Round[]> => {
    if (!user) return [];

    try {
      const { data: rounds, error } = await supabase
        .from('rounds')
        .select(`
          *,
          holes(*)
        `)
        .eq('user_id', user.id)
        .order('date_played', { ascending: false });

      if (error) throw error;
      return rounds || [];
    } catch (error: any) {
      console.error('Error fetching rounds:', error);
      toast({
        variant: "destructive",
        title: "Error loading rounds",
        description: error.message || "Failed to load round history.",
      });
      return [];
    }
  };

  const fetchRoundDetails = async (roundId: string): Promise<any | null> => {
    if (!user) return null;

    try {
      const { data: round, error } = await supabase
        .from('rounds')
        .select(`
          *,
          holes(*),
          flights(name),
          flight_players(guest_name)
        `)
        .eq('id', roundId)
        .single();

      if (error) throw error;
      return round;
    } catch (error: any) {
      console.error('Error fetching round details:', error);
      toast({
        variant: "destructive",
        title: "Error loading round details",
        description: error.message || "Failed to load round details.",
      });
      return null;
    }
  };

  return {
    saveRound,
    shareRound,
    fetchRounds,
    fetchRoundDetails,
    loading,
  };
};