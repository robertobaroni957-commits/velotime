-- Tabella per i segmenti candidati (non ancora confermati)
CREATE TABLE IF NOT EXISTS public.event_segments_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE,
    is_key_segment BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, segment_id)
);

-- Indice per velocizzare il recupero dei candidati
CREATE INDEX IF NOT EXISTS idx_event_segments_candidates_event ON public.event_segments_candidates(event_id);

-- Abilita RLS sulla tabella dei candidati
ALTER TABLE public.event_segments_candidates ENABLE ROW LEVEL SECURITY;

-- Permetti a chiunque di leggere i candidati (necessario per la selezione post-creazione)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read event segment candidates') THEN
        CREATE POLICY "Anyone can read event segment candidates" ON public.event_segments_candidates
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can manage candidates') THEN
        CREATE POLICY "Creators can manage candidates" ON public.event_segments_candidates
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.events
                WHERE id = event_segments_candidates.event_id
                AND creator_id = auth.uid()
            )
        );
    END IF;
END $$;

-- RLS per la tabella definitiva dei segmenti evento
ALTER TABLE public.event_segments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read event segments') THEN
        CREATE POLICY "Anyone can read event segments" ON public.event_segments
        FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can manage event segments') THEN
        CREATE POLICY "Creators can manage event segments" ON public.event_segments
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.events
                WHERE id = event_segments.event_id
                AND creator_id = auth.uid()
            )
        );
    END IF;
END $$;
