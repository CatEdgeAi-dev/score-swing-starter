-- Add handicap column to flight_players table to store player handicaps for each flight
ALTER TABLE flight_players 
ADD COLUMN handicap NUMERIC(4,1) DEFAULT NULL;

-- Add index for better performance when querying handicaps
CREATE INDEX idx_flight_players_handicap ON flight_players(handicap);