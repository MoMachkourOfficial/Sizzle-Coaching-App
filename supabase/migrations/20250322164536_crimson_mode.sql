/*
  # Add Call List Feature

  1. New Tables
    - `call_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `pipeline_entry_id` (uuid, references pipeline_entries)
      - `attempt_date` (timestamptz)
      - `status` (text: 'PENDING', 'COMPLETED', 'NO_ANSWER', 'RESCHEDULED')
      - `notes` (text)
      - `next_follow_up` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `call_attempts` table
    - Add policies for authenticated users to manage their own call attempts
*/

-- Create call_attempts table
CREATE TABLE IF NOT EXISTS call_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  pipeline_entry_id uuid REFERENCES pipeline_entries(id) NOT NULL,
  attempt_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'NO_ANSWER', 'RESCHEDULED')),
  notes text,
  next_follow_up timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own call attempts"
  ON call_attempts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS call_attempts_user_date_idx ON call_attempts(user_id, attempt_date);
CREATE INDEX IF NOT EXISTS call_attempts_pipeline_entry_idx ON call_attempts(pipeline_entry_id);

-- Add trigger for updated_at
CREATE TRIGGER update_call_attempts_updated_at
  BEFORE UPDATE ON call_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
