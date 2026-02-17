
-- Config for Bia (insurance NPC) timers — stored in game_config to avoid new table
ALTER TABLE public.game_config 
  ADD COLUMN bia_initial_delay_min INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN bia_initial_delay_max INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN bia_visible_duration INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN bia_reappear_min INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN bia_reappear_max INTEGER NOT NULL DEFAULT 180;
