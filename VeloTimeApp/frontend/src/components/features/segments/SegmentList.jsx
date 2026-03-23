import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import './SegmentList.css';

const SegmentList = ({ eventId }) => {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [segmentResults, setSegmentResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const { data, error } = await supabase
          .from('event_segments')
          .select(`
            id,
            segment_id,
            is_key_segment,
            segments (
              id, name, distance, average_grade, climb_category
            )
          `)
          .eq('event_id', eventId)
          .order('is_key_segment', { ascending: false }); // Prima le salite principali

      if (error) throw error;
        setSegments(data || []);
      } catch (err) {
        console.error('Error loading segments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSegments();
  }, [eventId]);

  const handleExpand = async (segmentId) => {
    if (expandedSegment === segmentId) {
      setExpandedSegment(null);
      return;
    }

    setExpandedSegment(segmentId);
    setLoadingResults(true);
    try {
      const { data, error } = await supabase.rpc('get_segment_leaderboard', {
        target_event_id: eventId,
        target_segment_id: segmentId
      });

      if (error) throw error;
      setSegmentResults(data || []);
    } catch (err) {
      console.error('Error fetching segment leaderboard:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const getCategoryBadge = (cat) => {
    if (cat === 5) return <span className="cat-badge hc">HC</span>;
    if (cat > 0) return <span className={`cat-badge cat-${cat}`}>{cat}</span>;
    return null;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="seg-loading">Analisi percorso...</div>;
  if (segments.length === 0) return null;

  return (
    <div className="segment-list-container">
      <h3 className="segment-list-title">Segmenti Chiave ({segments.length})</h3>
      <div className="segments-grid">
        {segments.map((item) => {
          const seg = item.segments;
          const isExpanded = expandedSegment === seg.id;

          return (
            <div key={item.id} className={`segment-card ${isExpanded ? 'expanded' : ''}`}>
              <div className="segment-header" onClick={() => handleExpand(seg.id)}>
                <div className="segment-meta">
                  {getCategoryBadge(seg.climb_category)}
                  <span className="segment-name">{seg.name}</span>
                </div>
                <div className="segment-stats">
                  <span>{(seg.distance / 1000).toFixed(1)}km</span>
                  <span>{seg.average_grade}%</span>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="segment-leaderboard fade-in">
                  {loadingResults ? (
                    <p className="loading-text">Caricamento tempi...</p>
                  ) : segmentResults.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Atleta</th>
                          <th>Tempo</th>
                          <th>Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segmentResults.map((res) => (
                          <tr key={res.user_id}>
                            <td>{res.rank}</td>
                            <td>
                              <div className="athlete-mini">
                                <img src={res.avatar_url || 'https://via.placeholder.com/20'} alt="av" />
                                {res.full_name.split(' ')[0]}
                              </div>
                            </td>
                            <td><strong>{formatTime(res.elapsed_time)}</strong></td>
                            <td className="gap-text">+{res.gap}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-results-text">Nessun tempo registrato su questo segmento.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentList;
