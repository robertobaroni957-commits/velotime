import { Link } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ id, name, date, distance, elevation_gain, status, description }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(1) + ' km';
  };

  return (
    <div className="event-card fade-in">
      <div className="event-card-header">
        <span className={`event-status ${status}`}>
          {status?.toUpperCase() || 'ACTIVE'}
        </span>
      </div>
      
      <div className="event-card-content">
        <h3 className="event-title">{name}</h3>
        
        <div className="event-info-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="event-icon" aria-hidden="true">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="21" y1="10" y2="10"></line>
          </svg>
          <span className="event-info-text">{formatDate(date)}</span>
        </div>

        <div className="event-info-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="event-icon" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="event-info-text">
            {formatDistance(distance)} • {Math.round(elevation_gain)} m
          </span>
        </div>

        <p className="event-description">
          {description || "No description provided for this challenge."}
        </p>
      </div>

      <div className="event-card-footer">
        <Link to={`/events/${id}`} className="view-details-btn hover-glow">
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon" aria-hidden="true">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
