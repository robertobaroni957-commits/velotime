import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import './FeedList.css';

const FeedList = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-feed');
      if (error) throw error;
      setFeedItems(data || []);
    } catch (err) {
      console.error('Errore nel recupero del feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // Opzionale: Polling ogni 30 secondi per mantenere il feed fresco
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (dateStr) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / 60000);
    
    if (diffInMins < 1) return 'Proprio ora';
    if (diffInMins < 60) return `${diffInMins}m fa`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h fa`;
    return past.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'event_created': return '🚲';
      case 'joined': return '🤝';
      case 'record_broken': return '🔥';
      default: return '📢';
    }
  };

  if (loading) return <div className="feed-loading">Aggiornamento feed...</div>;

  return (
    <div className="feed-container">
      <h2 className="feed-title">Attività Recente</h2>
      <div className="feed-list">
        {feedItems.map((item) => (
          <div key={item.id} className="feed-card">
            <div className="feed-card-header">
              <img 
                src={item.profiles?.avatar_url || 'https://via.placeholder.com/40'} 
                alt="avatar" 
                className="feed-avatar"
              />
              <div className="feed-info">
                <span className="feed-user">{item.profiles?.full_name || 'Atleta'}</span>
                <span className="feed-time">{formatRelativeTime(item.created_at)}</span>
              </div>
              <span className="activity-icon">{getActivityIcon(item.activity_type)}</span>
            </div>
            <div className="feed-content">
              <p>{item.content}</p>
              {item.target_id && (
                <Link to={`/events/${item.target_id}`} className="feed-link">
                  Visualizza Sfida →
                </Link>
              )}
            </div>
          </div>
        ))}
        {feedItems.length === 0 && (
          <p className="feed-empty">Ancora nessuna attività. Crea una sfida per iniziare!</p>
        )}
      </div>
    </div>
  );
};

export default FeedList;
