import { useState, useEffect, useCallback } from 'react';
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
  flight_id?: string;
  player_id?: string;
  is_flight_round?: boolean;
  flight_name?: string;
}

export const useRounds = () => {
  const [loading, setLoading] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadRounds = useCallback(async () => {
    if (!user) {
      setRounds([]);
      return;
    }

    console.log('Loading rounds for user:', user.id);
    setLoading(true);
    try {
      // First, get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      // Then get the rounds
      const { data: roundsData, error } = await supabase
        .from('rounds')
        .select(`
          *,
          holes(*),
          flights(name)
        `)
        .eq('user_id', user.id)
        .order('date_played', { ascending: false });

      if (error) throw error;
      console.log('Rounds loaded successfully:', roundsData?.length || 0);
      
      const roundsList: Round[] = (roundsData || []).map((round: any) => ({
        id: String(round.id),
        user_id: String(round.user_id),
        course_name: round.course_name ?? undefined,
        date_played: String(round.date_played),
        total_score: Number(round.total_score),
        total_putts: Number(round.total_putts),
        fairways_hit: Number(round.fairways_hit),
        greens_in_regulation: Number(round.greens_in_regulation),
        created_at: String(round.created_at),
        updated_at: String(round.updated_at),
        ...(round.flight_id ? { flight_id: String(round.flight_id) } : {}),
        ...(round.player_id ? { player_id: String(round.player_id) } : {}),
        ...(round.is_flight_round ? { is_flight_round: Boolean(round.is_flight_round) } : {}),
        ...(round.flight_name ? { flight_name: String(round.flight_name) } : {}),
      }));
      
      setRounds(roundsList);
    } catch (error: any) {
      console.error('Error fetching rounds:', error);
      // Only show toast for real errors, not network issues during development
      if (!error.message?.includes('Failed to fetch')) {
        toast({
          variant: "destructive",
          title: "Error loading rounds",
          description: error.message || "Failed to load round history.",
        });
      }
      setRounds([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Load rounds when user changes
  useEffect(() => {
    if (user) {
      loadRounds();
    } else {
      setRounds([]);
      setLoading(false);
    }
  }, [user?.id, loadRounds]); // Include loadRounds in dependencies

  const saveRound = async (
    holes: Record<number, HoleData>,
    courseName?: string,
    isFlightRound?: boolean,
    flightName?: string
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
          course_name: courseName ?? null,
          total_score: totalScore,
          total_putts: totalPutts,
          fairways_hit: fairwaysHit,
          greens_in_regulation: greensInRegulation,
          is_flight_round: isFlightRound || false,
          flight_name: flightName ?? null,
        })
        .select()
        .maybeSingle();

      if (roundError) throw roundError;
      if (!round) throw new Error('Failed to create round');

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

      // Refresh rounds after saving
      await loadRounds();

      const normalized: Round = {
        id: String(round.id),
        user_id: String(round.user_id),
        course_name: round.course_name ?? undefined,
        date_played: String(round.date_played),
        total_score: Number(round.total_score),
        total_putts: Number(round.total_putts),
        fairways_hit: Number(round.fairways_hit),
        greens_in_regulation: Number(round.greens_in_regulation),
        created_at: String(round.created_at),
        updated_at: String(round.updated_at),
        ...(round.flight_id ? { flight_id: String(round.flight_id) } : {}),
        ...(round.player_id ? { player_id: String(round.player_id) } : {}),
        ...(round.is_flight_round ? { is_flight_round: Boolean(round.is_flight_round) } : {}),
        ...(round.flight_name ? { flight_name: String(round.flight_name) } : {}),
      };

      return normalized;
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
      // Generate a shareable link with deep linking
      const shareUrl = `${window.location.origin}/shared/${roundId}`;
      
      // Generate a shareable text summary
      const { data: round } = await supabase
        .from('rounds')
        .select('*, holes(*)')
        .eq('id', roundId)
        .maybeSingle();

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

View full round details: ${shareUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Golf Round Summary',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Round summary and link copied to clipboard.",
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
      // First, get the user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      // Then get the rounds
      const { data: rounds, error } = await supabase
        .from('rounds')
        .select(`
          *,
          holes(*),
          flights(name)
        `)
        .eq('user_id', user.id)
        .order('date_played', { ascending: false });

      if (error) throw error;
      
      const roundsList: Round[] = (rounds || []).map((round: any) => ({
        id: String(round.id),
        user_id: String(round.user_id),
        course_name: round.course_name ?? undefined,
        date_played: String(round.date_played),
        total_score: Number(round.total_score),
        total_putts: Number(round.total_putts),
        fairways_hit: Number(round.fairways_hit),
        greens_in_regulation: Number(round.greens_in_regulation),
        created_at: String(round.created_at),
        updated_at: String(round.updated_at),
        ...(round.flight_id ? { flight_id: String(round.flight_id) } : {}),
        ...(round.player_id ? { player_id: String(round.player_id) } : {}),
        ...(round.is_flight_round ? { is_flight_round: Boolean(round.is_flight_round) } : {}),
        ...(round.flight_name ? { flight_name: String(round.flight_name) } : {}),
      }));
      
      return roundsList;
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
        .maybeSingle();

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
    rounds,
    isLoading: loading,
    refetch: loadRounds,
    saveRound,
    shareRound,
    fetchRounds,
    fetchRoundDetails,
    loading,
  };
};