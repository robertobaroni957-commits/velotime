-- Migliora le performance della ricerca per il Webhook Strava
CREATE INDEX IF NOT EXISTS idx_strava_tokens_athlete_id ON public.strava_tokens(athlete_id);

-- Aggiungiamo un commento alla tabella per tracciare l'ultima integrazione
COMMENT ON TABLE public.event_results IS 'Risultati sincronizzati automaticamente via Strava Webhook o calcolo manuale.';
