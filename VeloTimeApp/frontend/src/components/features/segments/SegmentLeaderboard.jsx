import React from 'react';
import './SegmentLeaderboard.css';

const SegmentLeaderboard = ({ entries = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="leaderboard-skeleton">
        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row"></div>)}
      </div>
    );
  }

  if (entries.length === 0) {
    return <div className="empty-leaderboard">Nessun risultato registrato.</div>;
  }

  // Calculate gaps
  const bestTime = entries[0]?.total_time || 0;

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatGap = (seconds) => {
    if (seconds === bestTime) return '-';
    const gap = seconds - bestTime;
    return `+${gap.toFixed(0)}s`;
  };

  return (
    <div className="segment-leaderboard">
      <div className="leaderboard-header">
        <div className="col-rank">#</div>
        <div className="col-athlete">Atleta</div>
        <div className="col-time">Tempo</div>
        <div className="col-gap">Gap</div>
      </div>
      
      <div className="leaderboard-body">
        {entries.map((entry, index) => (
          <div key={entry.user_id || index} className={`leaderboard-row rank-${entry.rank}`}>
            <div className="col-rank">
              <span className="rank-badge">{entry.rank}</span>
            </div>
            <div className="col-athlete">
              <div className="athlete-avatar">
                {entry.profiles?.avatar_url ? (
                    <img src={entry.profiles.avatar_url} alt="avatar" />
                ) : (
                    <div className="avatar-placeholder">
                        {(entry.profiles?.full_name || 'U').charAt(0)}
                    </div>
                )}
              </div>
              <span className="athlete-name">{entry.profiles?.full_name || 'Anonimo'}</span>
            </div>
            <div className="col-time">{formatTime(entry.total_time)}</div>
            <div className="col-gap">{formatGap(entry.total_time)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentLeaderboard;
