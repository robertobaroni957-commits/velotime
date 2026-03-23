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

    // Recupera l'utente che fa la richiesta (deve essere il creatore)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    const { event_id } = await req.json()
    if (!event_id) throw new Error('Missing event_id')

    // 1. Verifica che l'evento esista e l'utente sia il creatore
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single()

    if (eventError || !event) throw new Error('Event not found')
    if (event.creator_id !== user.id) throw new Error('Only the creator can compute results')

    // 2. Prendi i partecipanti "accepted"
    const { data: participants } = await supabaseClient
      .from('event_participants')
      .select('user_id')
      .eq('event_id', event_id)
      .eq('status', 'accepted')

    const results = []
    const eventDate = new Date(event.date)
    const after = Math.floor(eventDate.getTime() / 1000) - 43200 // 12h prima
    const before = Math.floor(eventDate.getTime() / 1000) + 43200 // 12h dopo

    for (const p of participants || []) {
      // Recupera token Strava del partecipante
      const { data: token } = await supabaseClient.from('strava_tokens').select('*').eq('user_id', p.user_id).single()
      if (!token) continue

      let accessToken = token.access_token
      const now = Math.floor(Date.now() / 1000)

      // Refresh token if expired
      if (token.expires_at < (now + 300)) {
        const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: Deno.env.get('STRAVA_CLIENT_ID'),
            client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
            grant_type: 'refresh_token',
            refresh_token: token.refresh_token,
          }),
        })

        const refreshData = await refreshResponse.json()
        if (refreshResponse.ok) {
          accessToken = refreshData.access_token
          await supabaseClient
            .from('strava_tokens')
            .update({
              access_token: refreshData.access_token,
              refresh_token: refreshData.refresh_token,
              expires_at: refreshData.expires_at,
            })
            .eq('user_id', p.user_id)
        }
      }
      
      const stravaRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const activities = await stravaRes.json()

      if (Array.isArray(activities)) {
        // Trova l'attività che più si avvicina alla distanza dell'evento (tolleranza 10%)
        const match = activities.find(a => Math.abs(a.distance - event.distance) < (event.distance * 0.1))
        
        if (match) {
          results.push({
            event_id,
            user_id: p.user_id,
            total_time: match.moving_time,
            average_speed: Number((match.average_speed * 3.6).toFixed(2)), // km/h
            segment_efforts: { strava_activity_id: match.id }
          })
        }
      }
    }

    // 3. Ordina e assegna i Rank
    results.sort((a, b) => a.total_time - b.total_time)
    const finalResults = results.map((r, index) => ({ ...r, rank: index + 1 }))

    // 4. Salva nel DB
    if (finalResults.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from('event_results')
        .upsert(finalResults, { onConflict: 'event_id,user_id' })
      if (upsertError) throw upsertError
    }

    return new Response(JSON.stringify({ success: true, count: finalResults.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
