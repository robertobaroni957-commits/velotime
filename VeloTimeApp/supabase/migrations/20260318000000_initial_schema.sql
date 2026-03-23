-- VeloTime Unified Initial Schema
-- Order: Utilities -> Profiles -> Strava Tokens -> Events -> Segments -> Participants -> Results -> Badges -> Functions

-- 1. UTILITIES
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. PROFILES (Synced with Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  strava_athlete_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. STRAVA TOKENS
CREATE TABLE IF NOT EXISTS public.strava_tokens (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own Strava tokens" ON public.strava_tokens
  FOR ALL USING (auth.uid() = user_id);

-- 4. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL, -- Coerente con Edge Functions e UI
  strava_activity_id BIGINT,
  distance FLOAT, -- in meters
  elevation_gain FLOAT, -- in meters
  map_polyline TEXT,
  start_latlng FLOAT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Creators can manage their events" ON public.events FOR ALL USING (auth.uid() = creator_id);

-- 5. SEGMENTS
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  strava_segment_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  distance FLOAT,
  average_grade FLOAT,
  climb_category INTEGER,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Segments are viewable by everyone" ON public.segments FOR SELECT USING (true);

-- 6. EVENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants are viewable by everyone" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Users can manage their participation" ON public.event_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Creators can invite" ON public.event_participants FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT creator_id FROM public.events WHERE id = event_id)
);

-- 7. RESULTS
CREATE TABLE IF NOT EXISTS public.segment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  elapsed_time INTEGER NOT NULL,
  moving_time INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  strava_effort_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(segment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_time INTEGER NOT NULL,
  average_speed FLOAT,
  rank INTEGER,
  segment_efforts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.segment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Results viewable by everyone" ON public.segment_results FOR SELECT USING (true);
CREATE POLICY "Event results viewable by everyone" ON public.event_results FOR SELECT USING (true);

-- 8. BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type, event_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);

-- 9. RPC FUNCTIONS
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
      (COUNT(DISTINCT ep.id) * 10)
    )::FLOAT as global_score
  FROM public.profiles p
  LEFT JOIN public.event_participants ep ON p.id = ep.user_id
  LEFT JOIN public.event_results er ON p.id = er.user_id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY global_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats_result JSON;
BEGIN
  SELECT json_build_object(
    'total_events', (SELECT count(*) FROM public.event_participants WHERE user_id = target_user_id AND status = 'accepted'),
    'total_wins', (SELECT count(*) FROM public.event_results WHERE user_id = target_user_id AND rank = 1),
    'total_distance', COALESCE((SELECT sum(e.distance) FROM public.event_results r JOIN public.events e ON r.event_id = e.id WHERE r.user_id = target_user_id), 0),
    'total_elevation', COALESCE((SELECT sum(e.elevation_gain) FROM public.event_results r JOIN public.events e ON r.event_id = e.id WHERE r.user_id = target_user_id), 0),
    'best_avg_speed', COALESCE((SELECT max(average_speed) FROM public.event_results WHERE user_id = target_user_id), 0)
  ) INTO stats_result;
  
  RETURN stats_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. TRIGGERS & INDEXES
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_strava_tokens_updated_at BEFORE UPDATE ON public.strava_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_event_participants_updated_at BEFORE UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_event_results_updated_at BEFORE UPDATE ON public.event_results FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_events_creator ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_results_event ON public.event_results(event_id);
