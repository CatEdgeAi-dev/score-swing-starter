-- Update the UPDATE policy for flight_players to allow players to update their own handicap
DROP POLICY IF EXISTS "Users can update players in flights they created" ON flight_players;

-- Create new policy that allows both flight creators to update any player 
-- AND allows players to update their own handicap
CREATE POLICY "Users can update players in flights they created or update their own handicap" 
ON flight_players 
FOR UPDATE 
USING (
  user_created_flight(flight_id) OR  -- Flight creator can update any player
  user_id = auth.uid()               -- Any player can update their own record
);