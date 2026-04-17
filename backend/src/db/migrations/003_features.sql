-- ── Audit Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT        NOT NULL,  -- 'application' | 'job' | 'student' | 'company'
  entity_id    UUID        NOT NULL,
  action       TEXT        NOT NULL,  -- e.g. 'status_changed', 'round_result_set', 'job_closed'
  changed_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  old_value    JSONB,
  new_value    JSONB,
  reason       TEXT,
  ip_address   INET,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_by        ON audit_logs (changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_changed   ON audit_logs (changed_at DESC);

-- ── Company Contacts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contacted_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  mode          TEXT        NOT NULL DEFAULT 'email', -- email | call | visit | whatsapp | meeting
  subject       TEXT,
  notes         TEXT,
  contacted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_contacts_co ON company_contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_at ON company_contacts (contacted_at DESC);

-- ── Company Timeline Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_timeline_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL,
  -- outreach_initiated | jd_received | approval_pending | drive_scheduled
  -- drive_completed    | result_published | follow_up | contract_signed | dropped
  event_data   JSONB       DEFAULT '{}',
  notes        TEXT,
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_timeline_co  ON company_timeline_events (company_id);
CREATE INDEX IF NOT EXISTS idx_company_timeline_occ ON company_timeline_events (occurred_at DESC);

-- ── Company Operations Fields ────────────────────────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS outreach_status      TEXT        DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS sla_days             INT         DEFAULT 7,
  ADD COLUMN IF NOT EXISTS last_contacted_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_followup_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_coordinator UUID        REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes                TEXT;
