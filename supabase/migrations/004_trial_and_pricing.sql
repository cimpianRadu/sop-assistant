-- Add trial and subscription columns to profiles
ALTER TABLE profiles
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'expired'));

-- Backfill existing profiles
UPDATE profiles
SET
  trial_ends_at = NOW() + INTERVAL '14 days',
  subscription_status = 'trialing'
WHERE trial_ends_at IS NULL;

-- Update the trigger to set trial fields on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    NOW() + INTERVAL '14 days',
    'trialing'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
