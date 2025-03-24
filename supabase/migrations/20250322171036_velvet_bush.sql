/*
  # Simplify Pipeline Stages

  1. Changes
    - Reduce pipeline stages to 5 core stages
    - Update existing entries to new stages
    - Preserve all other columns and data

  2. New Pipeline Stages
    - LEADS
    - CONVERSATIONS
    - APPOINTMENTS
    - FOLLOW_UP
    - CLOSED
*/

-- First, create a backup of the existing data
CREATE TABLE IF NOT EXISTS pipeline_entries_backup AS
SELECT 
  id,
  user_id,
  prospect_name,
  value,
  stage::text as stage,
  created_at,
  updated_at,
  event_type,
  conversation_date,
  presentation_type,
  complimentary_session_date,
  follow_up_date,
  money_received_date,
  target_amount
FROM pipeline_entries;

-- Drop the existing stage column
ALTER TABLE pipeline_entries DROP COLUMN stage;

-- Now we can safely drop and recreate the enum
DROP TYPE IF EXISTS pipeline_stage;

-- Create new enum type with simplified stages
CREATE TYPE pipeline_stage AS ENUM (
  'LEADS',
  'CONVERSATIONS',
  'APPOINTMENTS',
  'FOLLOW_UP',
  'CLOSED'
);

-- Add the new stage column
ALTER TABLE pipeline_entries
ADD COLUMN stage pipeline_stage NOT NULL DEFAULT 'LEADS';

-- Migrate data from backup
UPDATE pipeline_entries p
SET stage = CASE 
  WHEN b.stage IN ('LEADS', 'CALLS') THEN 'LEADS'::pipeline_stage
  WHEN b.stage = 'CONVERSATIONS' THEN 'CONVERSATIONS'::pipeline_stage
  WHEN b.stage IN ('APPOINTMENTS', 'PRESENTATIONS_121') THEN 'APPOINTMENTS'::pipeline_stage
  WHEN b.stage IN ('FOLLOW_UP_CALLS', 'FOLLOW_UP_CLOSE') THEN 'FOLLOW_UP'::pipeline_stage
  WHEN b.stage IN ('NEW_CLIENTS', 'MONEY_RECEIVED') THEN 'CLOSED'::pipeline_stage
  ELSE 'LEADS'::pipeline_stage
END
FROM pipeline_entries_backup b
WHERE p.id = b.id;

-- Drop the backup table as it's no longer needed
DROP TABLE pipeline_entries_backup;
