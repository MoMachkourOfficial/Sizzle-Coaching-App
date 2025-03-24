/*
  # Fix Call Attempts RLS Policy

  1. Changes
    - Drop existing RLS policy
    - Add new policy that properly handles user_id from auth.uid()
    - Add policy to ensure users can only create call attempts for their own pipeline entries

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Ensure users can only manage their own data
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own call attempts" ON call_attempts;

-- Create new policies
CREATE POLICY "Users can manage their own call attempts"
  ON call_attempts
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM pipeline_entries
      WHERE id = pipeline_entry_id
      AND user_id = auth.uid()
    )
  );

-- Add index for faster policy checks
CREATE INDEX IF NOT EXISTS idx_pipeline_entries_user_id ON pipeline_entries(user_id);
