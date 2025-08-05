-- Clean up any orphaned flight_players records where the flight no longer exists
-- or where players are stuck in deleted flights
DELETE FROM flight_players 
WHERE flight_id IN (
  SELECT fp.flight_id 
  FROM flight_players fp 
  LEFT JOIN flights f ON fp.flight_id = f.id 
  WHERE f.id IS NULL
);

-- For this specific case, delete the stuck flight and its players
DELETE FROM flight_players WHERE flight_id = '0d2f34fc-9087-4592-b2a6-e9607a2e1dea';
DELETE FROM flights WHERE id = '0d2f34fc-9087-4592-b2a6-e9607a2e1dea';