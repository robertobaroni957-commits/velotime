import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import './Leaderboard.css';

const Leaderboard = ({ eventId, isCreator }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_event_leaderboard', { target_event_id: eventId });
    if (!error) setResults(data);
    setLoading(false);
  };

  const handleCompute = async () => {
    setCalculating(true);
    try {
      const { error } = await supabase.functions.invoke('compute-leaderboard', {
        body: { event_id: eventId }
      });
      if (error) throw error;
      await fetchResults();
    } catch (err) {
      alert("Errore nel calcolo: " + err.message);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  if (loading) return <div className="leaderboard-loading">Caricamento classifica...</div>;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3>🏆 Classifica Evento</h3>
        {isCreator && (
          <button 
            onClick={handleCompute} 
            disabled={calculating}
            className="btn-sync"
          >
            {calculating ? 'Calcolo in corso...' : 'Aggiorna Classifica'}
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Atleta</th>
              <th>Tempo</th>
              <th>Vel. Media</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res) => (
              <tr key={res.user_id} className={res.is_winner ? 'winner-row' : ''}>
                <td>{res.rank}°</td>
                <td className="athlete-cell">
                  <img src={res.avatar_url || 'https://via.placeholder.com/32'} alt="avatar" />
                  <span>{res.full_name}</span>
                </td>
                <td>{Math.floor(res.total_time / 60)}m {res.total_time % 60}s</td>
                <td>{res.average_speed} km/h</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td colSpan="4" className="no-results">Nessun risultato ancora disponibile.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
