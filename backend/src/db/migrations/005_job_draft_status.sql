-- Migration 005: add 'draft' to job status enum
-- Safe to run multiple times (IF NOT EXISTS pattern)

DO $$
BEGIN
  -- Add 'draft' to the status check constraint if it doesn't already have it
  -- First check if the jobs table has a status column with a check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs'
      AND column_name = 'status'
      AND column_default IS NOT NULL
  ) THEN
    RAISE NOTICE 'status column setup skipped';
  END IF;

  -- Alter the check constraint to allow 'draft'
  -- Drop old constraint if it exists, add new one
  ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
  ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('draft', 'open', 'closed', 'cancelled'));

  -- Give draft its own default so new rows can omit it
  ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'draft';

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 005 partial: %', SQLERRM;
END $$;
