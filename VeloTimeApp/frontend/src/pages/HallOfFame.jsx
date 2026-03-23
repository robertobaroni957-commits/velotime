import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getBadgesForUser } from '../utils/badges';
import PageTransition from '../components/common/PageTransition';
import './HallOfFame.css';

const HallOfFame = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      // Chiamata alla funzione RPC definita nel database
      const { data, error } = await supabase.rpc('get_global_leaderboard');
      
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Errore nel recupero Hall of Fame:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  if (loading) {
    return (
      <div className="hall-loading">
        <div className="loader"></div>
        <p>Consultando gli archivi storici...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="hall-container">
        <header className="hall-header">
          <h1 className="hall-title">Hall of Fame <span>🏆</span></h1>
          <p className="hall-subtitle">I re e le regine della strada. Solo i migliori entrano nella leggenda.</p>
        </header>

        <section className="podium-section">
          {leaderboard.slice(0, 3).map((user, index) => (
            <div key={user.user_id} className={`podium-card rank-${index + 1} fade-in-up`}>
              <div className="podium-rank">{index + 1}</div>
              <img src={user.avatar_url || 'https://via.placeholder.com/80'} alt="avatar" className="podium-avatar" />
              <h3 className="podium-name">{user.full_name || 'Atleta Misterioso'}</h3>
              <div className="podium-score">{Math.round(user.global_score)} <span>PTS</span></div>
              <div className="podium-badges">
                {getBadgesForUser(user.user_id, user).map(badge => (
                  <span key={badge.id} title={badge.description} className="badge-icon">{badge.icon}</span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="hall-table-section">
          <div className="table-responsive">
            <table className="hall-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Atleta</th>
                  <th>Vittorie</th>
                  <th>Sfide</th>
                  <th>Punteggio</th>
                  <th>Badge</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <tr key={user.user_id} className="hall-row">
                    <td className="hall-rank-col">{index + 1}°</td>
                    <td className="hall-user-col">
                      <img src={user.avatar_url || 'https://via.placeholder.com/32'} alt="avatar" />
                      <span>{user.full_name || 'Atleta'}</span>
                    </td>
                    <td>{user.total_wins} 🥇</td>
                    <td>{user.total_events}</td>
                    <td className="hall-score-col">{Math.round(user.global_score)}</td>
                    <td className="hall-badges-col">
                      <div className="badges-list">
                        {getBadgesForUser(user.user_id, user).map(badge => (
                          <span key={badge.id} title={badge.label} className="badge-mini">{badge.icon}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default HallOfFame;
