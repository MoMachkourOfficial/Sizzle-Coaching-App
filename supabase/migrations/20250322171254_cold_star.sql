/*
  # Add Status to Pipeline Entries

  1. Changes
    - Add status column to track won/lost state
    - Add outcome_notes for additional context
    - Add outcome_date to track when the deal was won/lost

  2. New Fields
    - status: enum ('OPEN', 'WON', 'LOST')
    - outcome_notes: text
    - outcome_date: timestamptz
*/

-- Create status enum type
CREATE TYPE pipeline_status AS ENUM ('OPEN', 'WON', 'LOST');

-- Add new columns to pipeline_entries
ALTER TABLE pipeline_entries
ADD COLUMN status pipeline_status NOT NULL DEFAULT 'OPEN',
ADD COLUMN outcome_notes text,
ADD COLUMN outcome_date timestamptz;

-- Set existing closed deals as won
UPDATE pipeline_entries
SET 
  status = 'WON',
  outcome_date = money_received_date
WHERE stage = 'CLOSED';
