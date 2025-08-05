-- Update the DELETE policy for flight_players to allow players to remove themselves
DROP POLICY IF EXISTS "Users can delete players from flights they created" ON flight_players;

-- Create new policy that allows both flight creators to remove any player 
-- AND allows players to remove themselves
CREATE POLICY "Users can delete players from flights they created or remove themselves" 
ON flight_players 
FOR DELETE 
USING (
  user_created_flight(flight_id) OR  -- Flight creator can remove any player
  user_id = auth.uid()               -- Any player can remove themselves
);