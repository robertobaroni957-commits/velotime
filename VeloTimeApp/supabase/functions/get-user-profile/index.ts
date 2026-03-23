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

    // 1. Fetch Profile & Stats
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    const { data: stats, error: statsError } = await supabaseClient.rpc('get_user_stats', { target_user_id: user.id })
    if (statsError) throw statsError

    // 2. Compute Badges (Dynamic Logic)
    const newBadges = []
    
    // Check for Win
    if (stats.total_wins > 0) newBadges.push({ type: 'winner', label: 'Race Winner', icon: '🏆' })
    
    // Check for Speed
    if (stats.best_avg_speed > 35) newBadges.push({ type: 'speed_demon', label: 'Speed Demon', icon: '⚡' })
    
    // Check for Climbing
    if (stats.total_elevation > 5000) newBadges.push({ type: 'mountain_king', label: 'Climber', icon: '🏔️' })

    // Check for Distance
    if (stats.total_distance > 100000) newBadges.push({ type: 'century', label: '100km Club', icon: '💯' })

    // 3. Fetch Recent Results
    const { data: results, error: resultsError } = await supabaseClient
      .from('event_results')
      .select(`
        rank,
        total_time,
        average_speed,
        events (id, name, date, distance)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return new Response(JSON.stringify({
      success: true,
      profile,
      stats,
      badges: newBadges,
      recentActivity: results || []
    }), {
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
