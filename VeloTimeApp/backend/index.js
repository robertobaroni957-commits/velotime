const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// --- ROUTES ---

// Compute Event Leaderboard
app.post('/api/events/:id/compute-leaderboard', async (req, res) => {
  const eventId = req.params.id;

  try {
    // 1. Fetch all segment results for this event
    const { data: results, error: resultsError } = await supabase
      .from('segment_results')
      .select('user_id, elapsed_time')
      .eq('event_id', eventId);

    if (resultsError) throw resultsError;

    // 2. Aggregate times per user
    const userTimes = results.reduce((acc, curr) => {
      acc[curr.user_id] = (acc[curr.user_id] || 0) + curr.elapsed_time;
      return acc;
    }, {});

    // 3. Sort and Rank
    const ranked = Object.entries(userTimes)
      .map(([user_id, total_time]) => ({ user_id, total_time }))
      .sort((a, b) => a.total_time - b.total_time)
      .map((entry, index) => ({ ...entry, event_id: eventId, rank: index + 1 }));

    // 4. Upsert into event_results
    const { error: upsertError } = await supabase
      .from('event_results')
      .upsert(ranked, { onConflict: 'event_id, user_id' });

    if (upsertError) throw upsertError;

    res.json({ message: 'Leaderboard computed successfully', count: ranked.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VeloTime Backend running on http://localhost:${PORT}`);
});
