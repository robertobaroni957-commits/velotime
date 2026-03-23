-- Riparazione tabella segments: aggiunta colonne se mancano a causa di migrazioni interrotte
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='map_polyline') THEN
        ALTER TABLE public.segments ADD COLUMN map_polyline TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='maximum_grade') THEN
        ALTER TABLE public.segments ADD COLUMN maximum_grade FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='elevation_high') THEN
        ALTER TABLE public.segments ADD COLUMN elevation_high FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='elevation_low') THEN
        ALTER TABLE public.segments ADD COLUMN elevation_low FLOAT;
    END IF;
END $$;

-- Forza il refresh della cache di PostgREST
NOTIFY pgrst, 'reload schema';
