-- Clean up the stuck flight completely
-- First remove all flight players for today's flights
DELETE FROM flight_players 
WHERE flight_id IN (
  SELECT id FROM flights WHERE date_played = CURRENT_DATE
);

-- Then remove all flights for today
DELETE FROM flights WHERE date_played = CURRENT_DATE;

-- Also clean up any validation records for today's flights
DELETE FROM flight_handicap_validations 
WHERE flight_id IN (
  SELECT id FROM flights WHERE date_played = CURRENT_DATE
);