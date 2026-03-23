import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { event_id } = await req.json()
    if (!event_id) throw new Error('Missing event_id')

    // 1. Check event status
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('status, name')
      .eq('id', event_id)
      .single()

    if (eventError || !event) throw new Error('Event not found')
    if (event.status !== 'active') throw new Error('Event is no longer active')

    // 2. Upsert participation (Join as 'accepted')
    const { data: participant, error: joinError } = await supabaseClient
      .from('event_participants')
      .upsert({
        event_id,
        user_id: user.id,
        status: 'accepted'
      }, { onConflict: 'event_id, user_id' })
      .select()
      .single()

    if (joinError) {
      console.error('Join error:', joinError)
      throw new Error('Failed to join the event')
    }

    return new Response(JSON.stringify({ success: true, participant }), {
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
