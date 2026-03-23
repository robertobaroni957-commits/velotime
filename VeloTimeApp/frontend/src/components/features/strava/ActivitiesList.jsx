import { useNavigate } from 'react-router-dom';
import { useStrava } from '../../../hooks/useStrava';
import './ActivitiesList.css';

const ActivitiesList = () => {
  const { activities, loading } = useStrava();
  const navigate = useNavigate();

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleSelect = (activity) => {
    // Naviga alla creazione evento passando l'ID dell'attività
    navigate('/create-event', { state: { strava_activity_id: activity.id } });
  };

  if (loading) return (
    <div className="loader-mini-container">
        <div className="loader-mini"></div>
        <p>Sincronizzazione attività...</p>
    </div>
  );

  if (!activities || activities.length === 0) {
    return (
      <div className="no-activities">
        <p>Nessuna attività Strava trovata. Assicurati di averne caricate di recenti!</p>
      </div>
    );
  }

  return (
    <div className="activities-grid">
      {activities.map((activity) => (
        <div key={activity.id} className="activity-card hover-glow" onClick={() => handleSelect(activity)}>
          <div className="activity-header">
            <h4 className="activity-title">{activity.name}</h4>
            <span className="activity-date">{new Date(activity.start_date).toLocaleDateString()}</span>
          </div>
          
          <div className="activity-metrics">
            <div className="metric">
              <span className="label">Km</span>
              <span className="value">{(activity.distance / 1000).toFixed(1)}</span>
            </div>
            <div className="metric">
              <span className="label">Dislivello</span>
              <span className="value">{Math.round(activity.total_elevation_gain)}m</span>
            </div>
            <div className="metric">
              <span className="label">Tempo</span>
              <span className="value">{formatDuration(activity.moving_time)}</span>
            </div>
          </div>
          
          <button className="select-activity-btn">Lancia Sfida</button>
        </div>
      ))}
    </div>
  );
};

export default ActivitiesList;
