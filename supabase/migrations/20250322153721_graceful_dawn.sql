/*
  # Initial Schema for Sizzle Coaching App

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to Supabase auth.users
    - `assignments`
      - Stores coaching assignments/tasks
      - Linked to user profiles
    - `pipeline_entries`
      - Stores sales pipeline data
      - Three stages: LEAD, OPPORTUNITY, CLOSED
    - `performance_metrics`
      - Stores weekly performance numbers
      - Tracks sales, calls, meetings, etc.

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pipeline entries table
CREATE TYPE pipeline_stage AS ENUM ('LEAD', 'OPPORTUNITY', 'CLOSED');

CREATE TABLE IF NOT EXISTS pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  prospect_name text NOT NULL,
  value decimal(10,2) NOT NULL,
  stage pipeline_stage NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  week_start date NOT NULL,
  sales_amount decimal(10,2) DEFAULT 0,
  calls_made integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pipeline entries"
  ON pipeline_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pipeline entries"
  ON pipeline_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance metrics"
  ON performance_metrics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
