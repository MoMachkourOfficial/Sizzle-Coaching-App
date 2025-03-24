/*
  # Add Pipeline Entries Table

  1. New Tables
    - `pipeline_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `prospect_name` (text)
      - `value` (numeric(10,2))
      - `stage` (pipeline_stage enum)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `pipeline_entries` table
    - Add policies for authenticated users to manage their own entries
*/

-- Create pipeline_stage enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_stage') THEN
    CREATE TYPE pipeline_stage AS ENUM ('LEAD', 'OPPORTUNITY', 'CLOSED');
  END IF;
END $$;

-- Create pipeline_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  prospect_name text NOT NULL,
  value numeric(10,2) NOT NULL,
  stage pipeline_stage NOT NULL DEFAULT 'LEAD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage own pipeline entries" ON pipeline_entries;
END $$;

-- Create policy
CREATE POLICY "Users can manage own pipeline entries"
  ON pipeline_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_pipeline_entries_updated_at ON pipeline_entries;

-- Create trigger
CREATE TRIGGER update_pipeline_entries_updated_at
    BEFORE UPDATE
    ON pipeline_entries
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
