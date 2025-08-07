-- Delete duplicate flights from 2025-08-07 for user ivan.chengjh
DELETE FROM flights 
WHERE date_played = '2025-08-07' 
  AND created_by = '80b77e63-47a6-4eb7-9bc4-05b0241edfa9';