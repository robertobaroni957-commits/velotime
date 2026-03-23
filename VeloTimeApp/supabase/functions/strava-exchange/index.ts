import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { code, redirect_uri } = await req.json()
    
    // FALLBACK HARDCODED PER AMBIENTE LOCALE
    const clientId = Deno.env.get('STRAVA_CLIENT_ID') || "82617";
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET') || "09d9aad70cccaeb8cf9e7aa7152d2cc25d88d98d";

    if (!clientId || !clientSecret) {
      throw new Error("Configurazione Strava mancante nel server.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    // Scambio codice con token
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Errore scambio token')

    // Salva token nel database
    const { error: upsertError } = await supabaseClient
      .from('strava_tokens')
      .upsert({
        user_id: user.id,
        athlete_id: data.athlete.id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ success: true, athlete: data.athlete }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
