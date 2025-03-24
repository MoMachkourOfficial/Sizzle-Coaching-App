/*
  # Update Pipeline Stages and Add New Columns

  1. Changes
    - Update pipeline_stage enum to include new stages for sales tracking
    - Add new columns to pipeline_entries table for tracking metrics
    - Migrate existing data to new stage format

  2. New Columns
    - event_type: For tracking networking/seminar/workshop/live events
    - conversation_date: When the conversation took place
    - presentation_type: Group or 1:1
    - complimentary_session_date: When the complimentary session was held
    - follow_up_date: When the follow-up call was made
    - money_received_date: When payment was received
    - target_amount: Target amount for the deal

  3. Security
    - Maintains existing RLS policies
*/

-- First, create a backup of the existing data with the stage as text
CREATE TABLE IF NOT EXISTS pipeline_entries_backup AS
SELECT 
  id,
  user_id,
  prospect_name,
  value,
  stage::text as stage,
  created_at,
  updated_at
FROM pipeline_entries;

-- Drop the existing stage column
ALTER TABLE pipeline_entries DROP COLUMN stage;

-- Now we can safely drop and recreate the enum
DROP TYPE IF EXISTS pipeline_stage;

-- Create new enum type with updated stages
CREATE TYPE pipeline_stage AS ENUM (
  'NETWORKING',
  'LEADS',
  'CALLS',
  'CONVERSATIONS',
  'APPOINTMENTS',
  'GROUP_PRESENTATIONS',
  'PRESENTATIONS_121',
  'COMPLIMENTARY_SESSION',
  'FOLLOW_UP',
  'NEW_CLIENT',
  'MONEY_RECEIVED'
);

-- Add the new stage column and other new columns
ALTER TABLE pipeline_entries
ADD COLUMN stage pipeline_stage NOT NULL DEFAULT 'LEADS',
ADD COLUMN IF NOT EXISTS event_type text,
ADD COLUMN IF NOT EXISTS conversation_date timestamptz,
ADD COLUMN IF NOT EXISTS presentation_type text CHECK (presentation_type IN ('GROUP', '121')),
ADD COLUMN IF NOT EXISTS complimentary_session_date timestamptz,
ADD COLUMN IF NOT EXISTS follow_up_date timestamptz,
ADD COLUMN IF NOT EXISTS money_received_date timestamptz,
ADD COLUMN IF NOT EXISTS target_amount numeric(10,2);

-- Migrate data from backup
UPDATE pipeline_entries p
SET stage = CASE 
  WHEN b.stage = 'LEAD' THEN 'LEADS'::pipeline_stage
  WHEN b.stage = 'OPPORTUNITY' THEN 'CONVERSATIONS'::pipeline_stage
  WHEN b.stage = 'CLOSED' THEN 'MONEY_RECEIVED'::pipeline_stage
  ELSE 'LEADS'::pipeline_stage
END,
money_received_date = CASE 
  WHEN b.stage = 'CLOSED' THEN b.updated_at
  ELSE NULL
END
FROM pipeline_entries_backup b
WHERE p.id = b.id;

-- Drop the backup table as it's no longer needed
DROP TABLE pipeline_entries_backup;
