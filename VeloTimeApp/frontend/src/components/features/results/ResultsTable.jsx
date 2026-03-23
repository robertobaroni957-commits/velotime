import './ResultsTable.css';

const ResultsTable = ({ results }) => {
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateGap = (currentTime, winnerTime) => {
    if (currentTime === winnerTime) return '-';
    const gap = currentTime - winnerTime;
    const mins = Math.floor(gap / 60);
    const secs = gap % 60;
    return `+${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!results || results.length === 0) {
    return (
      <div className="no-results fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" x2="12" y1="8" y2="12"></line>
          <line x1="12" x2="12.01" y1="16" y2="16"></line>
        </svg>
        <p>No results have been computed yet for this challenge.</p>
      </div>
    );
  }

  const winnerTime = results[0].total_time;

  return (
    <div className="table-container fade-in">
      <table className="results-table">
        <thead>
          <tr>
            <th scope="col">Pos</th>
            <th scope="col">Athlete</th>
            <th scope="col">Time</th>
            <th scope="col">Gap</th>
            <th scope="col">Avg Speed</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item, idx) => (
            <tr key={idx} className={item.rank <= 3 ? `podium-row rank-${item.rank}` : ''}>
              <td className="rank-cell">
                <span className="rank-badge">{item.rank}</span>
              </td>
              <td className="athlete-cell">
                <div className="athlete-info">
                  <div className="athlete-avatar">
                    {(item.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{item.profiles?.full_name || 'Anonymous Rider'}</span>
                  {item.rank === 1 && <span className="winner-badge">🏆</span>}
                </div>
              </td>
              <td className="time-cell">{formatTime(item.total_time)}</td>
              <td className="gap-cell">{calculateGap(item.total_time, winnerTime)}</td>
              <td className="speed-cell">
                {item.average_speed ? `${item.average_speed.toFixed(1)} km/h` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
