/*
  # Fix Performance Metrics Schema

  1. Changes
    - Make week_start nullable in performance_metrics table
    - Add function to calculate week start date
  
  2. Notes
    - Using direct ALTER TABLE statements
    - Adding function for week start calculation
*/

-- Make week_start nullable
ALTER TABLE performance_metrics 
  ALTER COLUMN week_start DROP NOT NULL;

-- Create function to calculate week start date
CREATE OR REPLACE FUNCTION calculate_week_start(year int, week int)
RETURNS date AS $func$
BEGIN
  RETURN date_trunc('week', make_date(year, 1, 1) + ((week - 1) * interval '1 week'));
END;
$func$ LANGUAGE plpgsql;

-- Set default value for week_start
ALTER TABLE performance_metrics 
  ALTER COLUMN week_start SET DEFAULT NULL;
