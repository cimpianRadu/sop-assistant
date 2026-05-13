-- AI call observability: one row per LLM request across all endpoints.
-- Drives the platform-admin /platform/ai-usage dashboard.

CREATE TABLE ai_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cache_read_tokens INT NOT NULL DEFAULT 0,
  cache_creation_tokens INT NOT NULL DEFAULT 0,
  latency_ms INT,
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_calls_created_at ON ai_calls(created_at DESC);
CREATE INDEX idx_ai_calls_org_endpoint_created ON ai_calls(org_id, endpoint, created_at DESC);
CREATE INDEX idx_ai_calls_endpoint_created ON ai_calls(endpoint, created_at DESC);

ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert rows for themselves (server-side logging
-- from the route handlers). No SELECT policy: only the service-role client
-- (used by the /platform admin pages) can read the table.
CREATE POLICY ai_calls_insert_self ON ai_calls
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
