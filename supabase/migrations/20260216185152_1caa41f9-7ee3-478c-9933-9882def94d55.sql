
-- Add dedicated last_seen_at column for accurate online tracking
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Initialize with created_at so nobody appears online falsely
UPDATE public.users SET last_seen_at = created_at;
