import { supabase } from '../lib/supabase';

export const supabaseApi = {
  // --- EVENTS ---
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:profiles(full_name, avatar_url)
      `)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createEvent(eventData) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        creator_id: userData.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- SEGMENTS ---
  async createSegments(segments) {
    const { data, error } = await supabase
      .from('segments')
      .insert(segments)
      .select();

    if (error) throw error;
    return data;
  },

  async getEventSegments(eventId) {
    const { data, error } = await supabase
      .from('segments')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  },

  // --- PARTICIPANTS ---
  async joinEvent(eventId) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('event_participants')
      .insert([{
        event_id: eventId,
        user_id: userData.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- RESULTS ---
  async saveSegmentResult(resultData) {
    const { data, error } = await supabase
      .from('segment_results')
      .upsert([resultData])
      .select();

    if (error) throw error;
    return data;
  },

  async getEventResults(eventId) {
    const { data, error } = await supabase
      .from('event_results')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data;
  },

  // --- LEADERBOARD ---
  async getGlobalLeaderboard() {
    const { data, error } = await supabase
      .rpc('get_global_leaderboard');

    if (error) throw error;
    return data;
  }
};
