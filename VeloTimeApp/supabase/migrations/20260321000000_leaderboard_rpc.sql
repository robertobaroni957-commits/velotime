-- Migration: Add get_event_leaderboard RPC
CREATE OR REPLACE FUNCTION get_event_leaderboard(target_event_id UUID)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_time INTEGER,
  average_speed FLOAT,
  is_winner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.rank,
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    er.total_time,
    er.average_speed,
    (er.rank = 1) as is_winner
  FROM public.event_results er
  JOIN public.profiles p ON er.user_id = p.id
  WHERE er.event_id = target_event_id
  ORDER BY er.rank ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
