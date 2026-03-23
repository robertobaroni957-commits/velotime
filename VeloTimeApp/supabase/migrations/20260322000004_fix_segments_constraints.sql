-- Riparazione vincoli tabella segments
DO $$ 
BEGIN
    -- 1. Assicuriamoci che strava_segment_id sia UNIQUE
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'segments_strava_segment_id_key'
    ) THEN
        -- Rimuoviamo eventuali duplicati prima di applicare il vincolo (per sicurezza)
        DELETE FROM public.segments a USING public.segments b 
        WHERE a.id < b.id AND a.strava_segment_id = b.strava_segment_id;
        
        ALTER TABLE public.segments ADD CONSTRAINT segments_strava_segment_id_key UNIQUE (strava_segment_id);
    END IF;

    -- 2. Assicuriamoci che event_segments_candidates abbia il vincolo UNIQUE su (event_id, segment_id)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'event_segments_candidates_event_id_segment_id_key'
    ) THEN
        ALTER TABLE public.event_segments_candidates ADD CONSTRAINT event_segments_candidates_event_id_segment_id_key UNIQUE (event_id, segment_id);
    END IF;
END $$;

-- Forza ricaricamento schema
NOTIFY pgrst, 'reload schema';
