-- Private, owner-only admin notes per player (personalized deals, etc.).
-- RLS is enabled with no policies, so only the server service role can access it.
CREATE TABLE IF NOT EXISTS public.player_notes (
  username_key text PRIMARY KEY,
  username text NOT NULL,
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_notes ENABLE ROW LEVEL SECURITY;
