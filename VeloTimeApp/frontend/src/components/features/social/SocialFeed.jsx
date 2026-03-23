import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import './SocialFeed.css';

const SocialFeed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data, error } = await supabase
        .from('feed_items')
        .select(`*, user:profiles(full_name, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (!error) setFeed(data);
      setLoading(false);
    };

    fetchFeed();

    // Sottoscrizione Realtime per nuovi post
    const channel = supabase
      .channel('public:feed_items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, (payload) => {
        fetchFeed(); // Ricarica per avere anche i dati dell'utente
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  if (loading) return <div className="loader-mini">Caricamento feed...</div>;

  return (
    <div className="social-feed">
      {feed.length === 0 ? (
        <p className="empty-feed">Ancora nessuna attività. Sii il primo!</p>
      ) : (
        feed.map(item => (
          <div key={item.id} className="feed-card fade-in">
            <div className="feed-avatar">
              {(item.user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="feed-content">
              <p>
                <strong>{item.user?.full_name || 'Atleta'}</strong> {item.content}
              </p>
              <span className="feed-time">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SocialFeed;
