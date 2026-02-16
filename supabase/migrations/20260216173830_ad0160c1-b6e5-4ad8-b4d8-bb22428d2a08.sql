
-- Tabela de configuração dinâmica do jogo (admin)
CREATE TABLE public.game_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  collision_chance_percent INTEGER NOT NULL DEFAULT 25,
  collision_min_damage INTEGER NOT NULL DEFAULT 5,
  collision_max_damage INTEGER NOT NULL DEFAULT 20,
  collision_durability_loss INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Inserir configuração padrão
INSERT INTO game_config (id, collision_chance_percent, collision_min_damage, collision_max_damage, collision_durability_loss)
VALUES ('default', 25, 5, 20, 3);

-- RLS: leitura pública, escrita apenas admin (service role)
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game config"
  ON public.game_config FOR SELECT USING (true);

-- Tabela de log de colisões para histórico
CREATE TABLE public.collision_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL,
  owner_wallet TEXT NOT NULL,
  damage_engine INTEGER NOT NULL DEFAULT 0,
  damage_durability INTEGER NOT NULL DEFAULT 0,
  race_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collision_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collisions"
  ON public.collision_events FOR SELECT USING (true);

CREATE POLICY "System can insert collisions"
  ON public.collision_events FOR INSERT WITH CHECK (true);

-- Adicionar campo is_admin à tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
