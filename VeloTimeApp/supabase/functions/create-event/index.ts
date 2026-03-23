import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    const { name, description, strava_activity_id } = await req.json()
    const { data: tokens } = await supabaseClient.from('strava_tokens').select('*').eq('user_id', user.id).single()
    
    // 1. Recupera dettagli attività
    const stravaRes = await fetch(`https://www.strava.com/api/v3/activities/${strava_activity_id}?include_all_efforts=true`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const activity = await stravaRes.json()
    
    // 2. Crea Evento
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .insert({
        creator_id: user.id,
        name,
        description,
        date: activity.start_date,
        strava_activity_id,
        distance: activity.distance,
        elevation_gain: activity.total_elevation_gain,
        map_polyline: activity.map?.summary_polyline,
        status: 'active'
      })
      .select().single()

    if (eventError) throw eventError
    console.log(`EVENTO_CREATO: ${event.id}`);

    // 3. Elaborazione segmenti con LOGGING TOTALE
    const efforts = activity.segment_efforts || [];
    console.log(`EFFORTS_RICEVUTI: ${efforts.length}`);

    if (efforts.length > 0) {
      // Usiamo una mappa per inserire ogni segmento una sola volta
      const uniqueSegments = new Map();
      efforts.forEach((e: any) => {
        if (e.segment) uniqueSegments.set(e.segment.id, e.segment);
      });

      for (const seg of uniqueSegments.values()) {
        try {
          // Inserimento Segmento Master (Senza map_polyline per evitare problemi di cache)
          const { data: s, error: e } = await supabaseClient
            .from('segments')
            .upsert({
              strava_segment_id: seg.id,
              name: seg.name || 'Senza nome',
              distance: seg.distance || 0,
              average_grade: seg.average_grade || 0,
              climb_category: seg.climb_category || 0
            }, { onConflict: 'strava_segment_id' })
            .select().single();

          if (e) {
            console.error(`ERRORE_INSERT_SEGMENTO_${seg.id}:`, e.message);
            continue;
          }

          if (s) {
            // Inserimento Candidato
            const { error: ce } = await supabaseClient
              .from('event_segments_candidates')
              .upsert({
                event_id: event.id,
                segment_id: s.id,
                is_key_segment: (seg.climb_category || 0) > 0
              }, { onConflict: 'event_id,segment_id' });
            
            if (ce) {
              console.error(`ERRORE_INSERT_CANDIDATO_${seg.id}:`, ce.message);
            } else {
              console.log(`CANDIDATO_SALVATO: Evento ${event.id} -> Segmento ${s.id} (Strava ${seg.id})`);
            }
          }
        } catch (innerErr) {
          console.error(`ECCEZIONE_LOOP_SEGMENTO:`, innerErr);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, event_id: event.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('CRITICAL_ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
