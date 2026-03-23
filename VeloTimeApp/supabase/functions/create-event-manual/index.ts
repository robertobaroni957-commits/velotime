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

    const { name, description, distance, elevation_gain, map_polyline, start_latlng, date, bounds } = await req.json()

    // FALLBACK HARDCODED PER AMBIENTE LOCALE
    const clientId = Deno.env.get('STRAVA_CLIENT_ID') || "82617";
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET') || "09d9aad70cccaeb8cf9e7aa7152d2cc25d88d98d";

    // 1. CREA EVENTO
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .insert({
        creator_id: user.id,
        name,
        description,
        date: date || new Date().toISOString(),
        distance,
        elevation_gain,
        map_polyline,
        start_latlng,
        status: 'active'
      })
      .select().single()

    if (eventError) throw eventError

    // 2. ELABORAZIONE SEGMENTI CANDIDATI
    if (bounds && bounds.length === 4) {
      const { data: tokens } = await supabaseClient.from('strava_tokens').select('*').eq('user_id', user.id).single()
      if (tokens) {
        let accessToken = tokens.access_token
        const now = Math.floor(Date.now() / 1000)

        if (tokens.expires_at < (now + 600)) {
          const refreshRes = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'refresh_token',
              refresh_token: tokens.refresh_token,
            }),
          })
          const refreshData = await refreshRes.json()
          if (refreshRes.ok) {
            accessToken = refreshData.access_token
            await supabaseClient.from('strava_tokens').update({
              access_token: refreshData.access_token,
              refresh_token: refreshData.refresh_token,
              expires_at: refreshData.expires_at,
            }).eq('user_id', user.id)
          }
        }

        const stravaRes = await fetch(`https://www.strava.com/api/v3/segments/explore?bounds=${bounds.join(',')}&activity_type=riding`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        if (stravaRes.ok) {
          const { segments: exploredSegments } = await stravaRes.json()
          if (exploredSegments && exploredSegments.length > 0) {
            for (const seg of exploredSegments) {
              const { data: savedSegment, error: segError } = await supabaseClient
                .from('segments')
                .upsert({
                  strava_segment_id: seg.id,
                  name: seg.name,
                  distance: seg.distance,
                  average_grade: seg.avg_grade,
                  elevation_high: seg.elev_difference > 0 ? seg.elev_difference : 0,
                  climb_category: seg.climb_category,
                  map_polyline: seg.points
                }, { onConflict: 'strava_segment_id' })
                .select().single();

              if (!segError && savedSegment) {
                await supabaseClient.from('event_segments_candidates').upsert({
                  event_id: event.id,
                  segment_id: savedSegment.id,
                  is_key_segment: seg.climb_category > 0
                }, { onConflict: 'event_id,segment_id' });
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, event_id: event.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Create Event Manual Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
