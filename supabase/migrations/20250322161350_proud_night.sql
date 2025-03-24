/*
  # Create Coaching Programs and Assignments Schema

  1. New Tables
    - `coaching_programs`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `program_sessions`
      - `id` (uuid, primary key)
      - `program_id` (uuid, foreign key)
      - `session_number` (integer)
      - `title` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_assignments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `session_id` (uuid, foreign key)
      - `completed` (boolean)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for user access to their assignments
*/

-- Create coaching_programs table
CREATE TABLE IF NOT EXISTS coaching_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create program_sessions table
CREATE TABLE IF NOT EXISTS program_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES coaching_programs(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(program_id, session_number)
);

-- Create user_assignments table
CREATE TABLE IF NOT EXISTS user_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable RLS
ALTER TABLE coaching_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for coaching_programs
CREATE POLICY "Admins can manage coaching programs"
  ON coaching_programs
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "All users can view coaching programs"
  ON coaching_programs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for program_sessions
CREATE POLICY "Admins can manage program sessions"
  ON program_sessions
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "All users can view program sessions"
  ON program_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_assignments
CREATE POLICY "Users can view and update their assignments"
  ON user_assignments
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all assignments"
  ON user_assignments
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
