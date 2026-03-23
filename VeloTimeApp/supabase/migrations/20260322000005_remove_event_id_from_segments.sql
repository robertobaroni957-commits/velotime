-- Rimuove la dipendenza di segments da event_id per renderlo un Master Table
DO $$ 
BEGIN
    -- 1. Rimuove il vincolo NOT NULL da event_id se esiste ancora
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='event_id') THEN
        ALTER TABLE public.segments ALTER COLUMN event_id DROP NOT NULL;
        
        -- Opzionale: Rimuovere proprio la colonna se vogliamo pulire tutto
        -- Attenzione: se abbiamo dati che vogliamo salvare, dovremmo prima migrarli.
        -- In questo caso, i segmenti sono replicati Strava, quindi possiamo ricostruirli.
        ALTER TABLE public.segments DROP COLUMN event_id;
    END IF;

    -- 2. Assicuriamoci che distance sia NOT NULL (default 0)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='segments' AND column_name='distance') THEN
        UPDATE public.segments SET distance = 0 WHERE distance IS NULL;
        ALTER TABLE public.segments ALTER COLUMN distance SET NOT NULL;
    END IF;

END $$;

-- Forza ricaricamento schema
NOTIFY pgrst, 'reload schema';
