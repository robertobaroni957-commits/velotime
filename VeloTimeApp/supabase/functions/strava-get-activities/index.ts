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
    if (userError || !user) throw new Error('Unauthorized');

    const { data: tokens } = await supabaseClient
      .from('strava_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!tokens) {
      return new Response(JSON.stringify({ isConnected: false, activities: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let accessToken = tokens.access_token
    const now = Math.floor(Date.now() / 1000)

    if (tokens.expires_at < (now + 600)) {
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
        }),
      })
      const refreshData = await refreshResponse.json()
      if (refreshResponse.ok) {
        accessToken = refreshData.access_token
        await supabaseClient.from('strava_tokens').update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: refreshData.expires_at,
        }).eq('user_id', user.id)
      }
    }

    // Chiamata Strava
    const stravaRes = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    const activities = await stravaRes.json()
    
    // DEBUG LOG: Vediamo cosa ci manda Strava
    if (Array.isArray(activities)) {
        console.log(`STRAVA_GET_ACTIVITIES: Ricevute ${activities.length} attività.`);
        activities.slice(0, 3).forEach(a => {
            console.log(` - Attività: ${a.name} | Tipo: ${a.type} | Distanza: ${a.distance}m`);
        });
    }

    return new Response(JSON.stringify({ isConnected: true, activities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
