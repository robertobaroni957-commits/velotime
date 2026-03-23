-- Permessi per la tabella master dei segmenti
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read segments') THEN
        CREATE POLICY "Anyone can read segments" ON public.segments
        FOR SELECT USING (true);
    END IF;
END $$;
