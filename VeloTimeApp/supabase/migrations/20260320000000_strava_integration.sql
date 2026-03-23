-- VeloTime SQL Migration - 20260320
-- Integra tutte le modifiche necessarie per Strava, Feed Social e Punteggi

-- 1. AGGIORNAMENTO TABELLA TOKENS
ALTER TABLE public.strava_tokens ADD COLUMN IF NOT EXISTS athlete_id BIGINT;
-- Se expires_at era timestamp, lo convertiamo in BIGINT (Unix)
DO $$ 
BEGIN 
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'strava_tokens' AND column_name = 'expires_at') = 'timestamp with time zone' THEN
        ALTER TABLE public.strava_tokens ALTER COLUMN expires_at TYPE BIGINT USING extract(epoch from expires_at)::bigint;
    END IF;
END $$;

-- 2. TABELLA FEED SOCIALE
CREATE TABLE IF NOT EXISTS public.feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'event_created', 'joined', 'record_broken', 'badge_earned'
  target_id UUID,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed items viewable by everyone" ON public.feed_items FOR SELECT USING (true);

-- 3. TRIGGER PER FEED AUTOMATICO
CREATE OR REPLACE FUNCTION public.log_event_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.feed_items (user_id, activity_type, target_id, content)
  VALUES (NEW.creator_id, 'event_created', NEW.id, 'ha creato una nuova sfida: ' || NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_created ON public.events;
CREATE TRIGGER on_event_created AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.log_event_creation();

-- 4. AGGIORNAMENTO LEADERBOARD (LOGICA PUNTI)
CREATE OR REPLACE FUNCTION get_global_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_wins BIGINT,
  total_events BIGINT,
  global_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT er.id) FILTER (WHERE er.rank = 1) as total_wins,
    COUNT(DISTINCT ep.id) as total_events,
    (
      (COUNT(DISTINCT er.id) FILTER (WHERE er.rank = 1) * 100) + 
      (COUNT(DISTINCT ep.id) * 10) +
      COALESCE(MAX(er.average_speed), 0)
    )::FLOAT as global_score
  FROM public.profiles p
  LEFT JOIN public.event_participants ep ON p.id = ep.user_id
  LEFT JOIN public.event_results er ON p.id = er.user_id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY global_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
