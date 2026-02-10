CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'operator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- processes
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sop_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- checklist_steps
CREATE TABLE checklist_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_text TEXT NOT NULL,
  UNIQUE(process_id, step_number)
);

-- executions
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- execution_steps
CREATE TABLE execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  checklist_step_id UUID NOT NULL REFERENCES checklist_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(execution_id, checklist_step_id)
);

-- Indexes
CREATE INDEX idx_processes_manager_id ON processes(manager_id);
CREATE INDEX idx_checklist_steps_process_id ON checklist_steps(process_id);
CREATE INDEX idx_executions_process_id ON executions(process_id);
CREATE INDEX idx_executions_operator_id ON executions(operator_id);
CREATE INDEX idx_execution_steps_execution_id ON execution_steps(execution_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;

-- profiles: users see own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- processes: managers see own, operators see all
CREATE POLICY "View processes" ON processes FOR SELECT USING (
  manager_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
);
CREATE POLICY "Managers create processes" ON processes FOR INSERT WITH CHECK (
  manager_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
);
CREATE POLICY "Managers update own" ON processes FOR UPDATE USING (manager_id = auth.uid());
CREATE POLICY "Managers delete own" ON processes FOR DELETE USING (manager_id = auth.uid());

-- checklist_steps: follow process visibility
CREATE POLICY "View steps" ON checklist_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND (
    manager_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
  ))
);
CREATE POLICY "Managers insert steps" ON checklist_steps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);

-- executions: operators see own, managers see for own processes
CREATE POLICY "View executions" ON executions FOR SELECT USING (
  operator_id = auth.uid() OR
  EXISTS (SELECT 1 FROM processes WHERE id = process_id AND manager_id = auth.uid())
);
CREATE POLICY "Operators create executions" ON executions FOR INSERT WITH CHECK (
  operator_id = auth.uid() AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operator')
);
CREATE POLICY "Operators update own" ON executions FOR UPDATE USING (operator_id = auth.uid());

-- execution_steps: follow execution ownership
CREATE POLICY "View exec steps" ON execution_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM executions WHERE id = execution_id AND (
    operator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM processes WHERE id = executions.process_id AND manager_id = auth.uid())
  ))
);
CREATE POLICY "Operators insert exec steps" ON execution_steps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM executions WHERE id = execution_id AND operator_id = auth.uid())
);
CREATE POLICY "Operators update exec steps" ON execution_steps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM executions WHERE id = execution_id AND operator_id = auth.uid())
);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'operator'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
