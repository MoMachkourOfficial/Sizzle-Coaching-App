/*
  # Clear Database and Integrate with GHL

  1. Changes
    - Drop all existing tables except auth-related ones
    - Create new tables for GHL sync tracking
    - Add RLS policies for new tables

  2. New Tables
    - `ghl_sync_logs`
      - Track last sync time for different GHL entities
      - Store sync status and any errors
*/

-- Drop existing tables
DROP TABLE IF EXISTS call_attempts CASCADE;
DROP TABLE IF EXISTS pipeline_entries CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS coaching_sessions CASCADE;
DROP TABLE IF EXISTS user_assignments CASCADE;
DROP TABLE IF EXISTS program_sessions CASCADE;
DROP TABLE IF EXISTS coaching_programs CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS pipeline_stage CASCADE;
DROP TYPE IF EXISTS pipeline_status CASCADE;

-- Create profiles table (required for auth)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create GHL sync logs table
CREATE TABLE IF NOT EXISTS ghl_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  last_sync_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for sync logs
CREATE POLICY "Anyone can read sync logs"
  ON ghl_sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ghl_sync_logs_updated_at
  BEFORE UPDATE ON ghl_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
