import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { method } = req;

  // 1. Verifica Webhook (GET)
  if (method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('STRAVA_VERIFY_TOKEN')) {
      return new Response(JSON.stringify({ "hub.challenge": challenge }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // 2. Ricezione Eventi (POST)
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    if (body.object_type === 'activity' && body.aspect_type === 'create') {
      const athleteId = body.owner_id;
      const activityId = body.object_id;

      // Recupera User & Token
      const { data: tokenData } = await supabaseClient
        .from('strava_tokens')
        .select('*')
        .eq('athlete_id', athleteId)
        .single();

      if (!tokenData) return new Response('User not found', { status: 200 });

      // Refresh Token
      let accessToken = tokenData.access_token;
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at < (now + 600)) {
        const refreshRes = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: Deno.env.get('STRAVA_CLIENT_ID'),
            client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
            grant_type: 'refresh_token',
            refresh_token: tokenData.refresh_token,
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          accessToken = refreshData.access_token;
          await supabaseClient.from('strava_tokens').update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            expires_at: refreshData.expires_at,
          }).eq('user_id', tokenData.user_id);
        }
      }

      // Recupera dettagli completi attività
      const activityRes = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const activity = await activityRes.json();

      // Cerca eventi compatibili (Data match e distanza simile)
      const activityDate = new Date(activity.start_date).toISOString().split('T')[0];
      const { data: events } = await supabaseClient
        .from('events')
        .select('*, event_participants!inner(user_id)')
        .eq('event_participants.user_id', tokenData.user_id)
        .eq('status', 'active');

      if (events) {
        for (const event of events) {
          const eventDate = new Date(event.date).toISOString().split('T')[0];
          const isMatch = eventDate === activityDate && Math.abs(activity.distance - event.distance) < (event.distance * 0.15);

          if (isMatch) {
            console.log(`Match evento: ${event.name}`);

            // 1. Salva risultato totale
            await supabaseClient.from('event_results').upsert({
              event_id: event.id,
              user_id: tokenData.user_id,
              total_time: activity.moving_time,
              average_speed: Number((activity.average_speed * 3.6).toFixed(2))
            }, { onConflict: 'event_id,user_id' });

            // 2. Analisi SEGMENTI (Solo quelli confermati in event_segments)
            const { data: confirmedSegments } = await supabaseClient
              .from('event_segments')
              .select('segment_id, segments(strava_segment_id)')
              .eq('event_id', event.id);

            if (confirmedSegments && activity.segment_efforts) {
              const confirmedMap = new Map(confirmedSegments.map((cs:any) => [String(cs.segments.strava_segment_id), cs.segment_id]));

              const effortsToSave = activity.segment_efforts
                .filter((effort:any) => confirmedMap.has(String(effort.segment.id)))
                .map((effort:any) => ({
                  event_id: event.id,
                  segment_id: confirmedMap.get(String(effort.segment.id)),
                  user_id: tokenData.user_id,
                  strava_effort_id: effort.id,
                  elapsed_time: effort.elapsed_time,
                  moving_time: effort.moving_time,
                  start_date: effort.start_date,
                  kom_rank: effort.kom_rank,
                  pr_rank: effort.pr_rank
                }));

              if (effortsToSave.length > 0) {
                await supabaseClient.from('segment_efforts').upsert(effortsToSave, { onConflict: 'event_id,segment_id,user_id' });
                console.log(`Salvati ${effortsToSave.length} risultati segmento.`);
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: 'processed' }), { status: 200 });
  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})
