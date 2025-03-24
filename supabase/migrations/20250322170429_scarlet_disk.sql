/*
  # Update Pipeline Stages

  1. Changes
    - Update pipeline_stage enum to match new business requirements
    - Remove unused stages
    - Add new stages for tracking sales process

  2. New Stages
    - LEADS: Initial leads
    - CALLS: Scheduled calls
    - CONVERSATIONS: Active conversations
    - FOLLOW_UP_CALLS: Follow-up calls
    - APPOINTMENTS: Set appointments
    - PRESENTATIONS_121: One-on-one presentations
    - FOLLOW_UP_CLOSE: Follow-up calls to close
    - NEW_CLIENTS: New client acquisitions
    - MONEY_RECEIVED: Payment received
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

-- Create new enum type with updated stages
CREATE TYPE pipeline_stage AS ENUM (
  'LEADS',
  'CALLS',
  'CONVERSATIONS',
  'FOLLOW_UP_CALLS',
  'APPOINTMENTS',
  'PRESENTATIONS_121',
  'FOLLOW_UP_CLOSE',
  'NEW_CLIENTS',
  'MONEY_RECEIVED'
);

-- Add the new stage column
ALTER TABLE pipeline_entries
ADD COLUMN stage pipeline_stage NOT NULL DEFAULT 'LEADS';

-- Migrate data from backup
UPDATE pipeline_entries p
SET stage = CASE 
  WHEN b.stage = 'NETWORKING' THEN 'LEADS'::pipeline_stage
  WHEN b.stage = 'LEADS' THEN 'LEADS'::pipeline_stage
  WHEN b.stage = 'CALLS' THEN 'CALLS'::pipeline_stage
  WHEN b.stage = 'CONVERSATIONS' THEN 'CONVERSATIONS'::pipeline_stage
  WHEN b.stage = 'APPOINTMENTS' THEN 'APPOINTMENTS'::pipeline_stage
  WHEN b.stage = 'GROUP_PRESENTATIONS' THEN 'PRESENTATIONS_121'::pipeline_stage
  WHEN b.stage = 'PRESENTATIONS_121' THEN 'PRESENTATIONS_121'::pipeline_stage
  WHEN b.stage = 'COMPLIMENTARY_SESSION' THEN 'FOLLOW_UP_CLOSE'::pipeline_stage
  WHEN b.stage = 'FOLLOW_UP' THEN 'FOLLOW_UP_CALLS'::pipeline_stage
  WHEN b.stage = 'NEW_CLIENT' THEN 'NEW_CLIENTS'::pipeline_stage
  WHEN b.stage = 'MONEY_RECEIVED' THEN 'MONEY_RECEIVED'::pipeline_stage
  ELSE 'LEADS'::pipeline_stage
END
FROM pipeline_entries_backup b
WHERE p.id = b.id;

-- Drop the backup table as it's no longer needed
DROP TABLE pipeline_entries_backup;
