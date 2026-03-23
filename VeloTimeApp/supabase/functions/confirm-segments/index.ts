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

    const { event_id, segment_ids } = await req.json()

    // 1. Verifica che l'utente sia il creatore
    const { data: event } = await supabaseClient.from('events').select('creator_id').eq('id', event_id).single()
    if (event?.creator_id !== user.id) throw new Error('Not the event creator')

    // 2. Rimuovi eventuali selezioni precedenti (reset)
    await supabaseClient.from('event_segments').delete().eq('event_id', event_id)

    // 3. Inserisci i segmenti selezionati
    if (segment_ids.length > 0) {
      // Recuperiamo i dati is_key_segment dai candidati
      const { data: candidates } = await supabaseClient
        .from('event_segments_candidates')
        .select('segment_id, is_key_segment')
        .eq('event_id', event_id)
        .in('segment_id', segment_ids)

      const inserts = candidates?.map((c: any) => ({
        event_id,
        segment_id: c.segment_id,
        is_key_segment: c.is_key_segment
      })) || []
      
      if (inserts.length > 0) {
        await supabaseClient.from('event_segments').insert(inserts)
      }
    }

    // 4. Pulizia candidati (opzionale, ma consigliato)
    await supabaseClient.from('event_segments_candidates').delete().eq('event_id', event_id)

    return new Response(JSON.stringify({ success: true }), {
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
