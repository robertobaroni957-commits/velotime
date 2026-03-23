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

    // 1. Call the RPC to get aggregated rankings
    const { data: leaderboard, error: rpcError } = await supabaseClient.rpc('get_global_leaderboard')
    if (rpcError) throw rpcError

    // 2. Fetch top badges for each user in the leaderboard (Bonus UX)
    const enrichedLeaderboard = await Promise.all((leaderboard || []).map(async (entry) => {
      const { data: badges } = await supabaseClient
        .from('user_badges')
        .select('badge_type')
        .eq('user_id', entry.user_id)
        .limit(3)
      
      return {
        ...entry,
        recent_badges: badges?.map(b => b.badge_type) || []
      }
    }))

    return new Response(JSON.stringify({
      success: true,
      leaderboard: enrichedLeaderboard
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
