-- Migration 004: Company export templates
-- Stores per-company preferences for Excel export formatting

CREATE TABLE IF NOT EXISTS company_export_templates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- Ordered list of column keys to include in the export
  columns      TEXT[]      NOT NULL DEFAULT ARRAY[
    'sno','full_name','roll_number','email','branch','cgpa',
    'active_backlogs','tenth_percent','twelfth_percent','skills','status','applied_at'
  ],
  show_photo   BOOLEAN     NOT NULL DEFAULT FALSE,
  show_cgpa    BOOLEAN     NOT NULL DEFAULT TRUE,
  show_percent BOOLEAN     NOT NULL DEFAULT TRUE,
  -- ARGB hex string for the header row background (e.g. "FF2563EB")
  header_color TEXT        NOT NULL DEFAULT 'FF2563EB',
  template_name TEXT       NOT NULL DEFAULT 'Default',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id)
);
