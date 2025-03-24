/*
  # Add Coaching Reports Tables

  1. New Tables
    - `coaching_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `week_number` (integer)
      - `year` (integer)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `performance_metrics` (already exists, adding week_number and year)
      - Add `week_number` (integer)
      - Add `year` (integer)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add week tracking to performance metrics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_metrics' AND column_name = 'week_number'
  ) THEN
    ALTER TABLE performance_metrics ADD COLUMN week_number integer NOT NULL;
    ALTER TABLE performance_metrics ADD COLUMN year integer NOT NULL;
  END IF;
END $$;

-- Create coaching sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own coaching sessions"
  ON coaching_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
