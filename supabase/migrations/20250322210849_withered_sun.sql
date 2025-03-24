/*
  # Create Performance and Pipeline Tables

  1. New Tables
    - `performance_metrics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `week_number` (integer)
      - `year` (integer)
      - `week_start` (timestamptz)
      - `sales_amount` (numeric)
      - `calls_made` (integer)
      - `meetings_booked` (integer)
      - `leads_generated` (integer)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pipeline_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `prospect_name` (text)
      - `value` (numeric)
      - `target_amount` (numeric)
      - `event_type` (text)
      - `stage` (text)
      - `status` (text)
      - `outcome_notes` (text)
      - `outcome_date` (timestamptz)
      - `money_received_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  week_start timestamptz,
  sales_amount numeric(10,2) DEFAULT 0,
  calls_made integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pipeline_entries table
CREATE TABLE IF NOT EXISTS pipeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  prospect_name text NOT NULL,
  value numeric(10,2) NOT NULL,
  target_amount numeric(10,2),
  event_type text,
  stage text NOT NULL CHECK (stage IN ('LEADS', 'CONVERSATIONS', 'APPOINTMENTS', 'FOLLOW_UP', 'CLOSED')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WON', 'LOST')),
  outcome_notes text,
  outcome_date timestamptz,
  money_received_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for performance_metrics
CREATE POLICY "Users can manage own performance metrics"
  ON performance_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for pipeline_entries
CREATE POLICY "Users can manage own pipeline entries"
  ON pipeline_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_week 
  ON performance_metrics(user_id, year, week_number);

CREATE INDEX IF NOT EXISTS idx_pipeline_entries_user_stage 
  ON pipeline_entries(user_id, stage);

-- Add triggers for updated_at
CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_entries_updated_at
  BEFORE UPDATE ON pipeline_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
