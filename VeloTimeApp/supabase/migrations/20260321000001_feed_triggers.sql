-- Trigger per loggare quando un utente si unisce a un evento
CREATE OR REPLACE FUNCTION public.log_event_join()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    -- Evita duplicati se l'utente cambia stato più volte
    IF NOT EXISTS (
      SELECT 1 FROM public.feed_items 
      WHERE user_id = NEW.user_id 
      AND activity_type = 'joined' 
      AND target_id = NEW.event_id
    ) THEN
      INSERT INTO public.feed_items (user_id, activity_type, target_id, content)
      VALUES (NEW.user_id, 'joined', NEW.event_id, 'si è unito alla sfida!');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_joined ON public.event_participants;
CREATE TRIGGER on_event_joined AFTER INSERT OR UPDATE OF status ON public.event_participants
FOR EACH ROW EXECUTE FUNCTION public.log_event_join();
