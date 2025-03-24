/*
  # Add notes column to performance_metrics table

  1. Changes
    - Add `notes` column to `performance_metrics` table
      - Type: text
      - Nullable: true
      - Purpose: Allow users to add additional notes to their performance reports
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_metrics' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE performance_metrics ADD COLUMN notes text;
  END IF;
END $$;
