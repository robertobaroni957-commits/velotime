-- Tabella Master dei Segmenti Strava (evita duplicati)
CREATE TABLE IF NOT EXISTS public.segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    strava_segment_id BIGINT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    distance FLOAT NOT NULL, -- metri
    average_grade FLOAT,
    maximum_grade FLOAT,
    elevation_high FLOAT,
    elevation_low FLOAT,
    climb_category INTEGER DEFAULT 0, -- 0=NC, 1=Cat4 ... 5=HC
    city TEXT,
    state TEXT,
    map_polyline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Associa i segmenti a un Evento specifico
CREATE TABLE IF NOT EXISTS public.event_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE,
    is_key_segment BOOLEAN DEFAULT false, -- Per evidenziare salite principali
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, segment_id)
);

-- Risultati degli atleti sui segmenti dell'evento
CREATE TABLE IF NOT EXISTS public.segment_efforts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strava_effort_id BIGINT UNIQUE,
    elapsed_time INTEGER NOT NULL, -- secondi
    moving_time INTEGER NOT NULL, -- secondi
    start_date TIMESTAMPTZ NOT NULL,
    kom_rank INTEGER, -- Posizione assoluta Strava (se disponibile)
    pr_rank INTEGER, -- Posizione personale (1, 2, 3...)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, segment_id, user_id) -- Un solo miglior tempo per evento per utente
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_event_segments_event ON public.event_segments(event_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_event ON public.segment_efforts(event_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_user ON public.segment_efforts(user_id);

-- RPC: Ottiene la leaderboard di un segmento specifico per un evento
CREATE OR REPLACE FUNCTION get_segment_leaderboard(target_event_id UUID, target_segment_id UUID)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    elapsed_time INTEGER,
    gap INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_efforts AS (
        SELECT 
            se.user_id,
            se.elapsed_time,
            RANK() OVER (ORDER BY se.elapsed_time ASC) as rank
        FROM public.segment_efforts se
        WHERE se.event_id = target_event_id AND se.segment_id = target_segment_id
    )
    SELECT 
        re.rank,
        p.id as user_id,
        p.full_name,
        p.avatar_url,
        re.elapsed_time,
        (re.elapsed_time - FIRST_VALUE(re.elapsed_time) OVER (ORDER BY re.rank))::INTEGER as gap
    FROM ranked_efforts re
    JOIN public.profiles p ON re.user_id = p.id
    ORDER BY re.rank ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
