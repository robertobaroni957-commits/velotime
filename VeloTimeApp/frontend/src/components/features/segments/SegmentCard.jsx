import React from 'react';
import './SegmentCard.css';

const SegmentCard = ({ 
  segment, 
  onSelect, 
  isSelected = false, 
  showStats = true 
}) => {
  if (!segment) return null;

  return (
    <div 
      className={`segment-card ${isSelected ? 'is-selected' : ''} ${onSelect ? 'is-interactive' : ''}`}
      onClick={() => onSelect && onSelect(segment)}
    >
      <div className="segment-card-header">
        <div className="segment-icon">
          {/* Simple Activity Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="segment-info">
          <h3 className="segment-name">{segment.name}</h3>
          <span className="segment-location">{segment.city || 'Segmento Strava'}</span>
        </div>
        {isSelected && (
          <div className="selection-check">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
      </div>

      {showStats && (
        <div className="segment-stats">
          <div className="stat-item">
            <span className="stat-label">Distanza</span>
            <span className="stat-value">{(segment.distance / 1000).toFixed(2)} <small>km</small></span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pendenza</span>
            <span className="stat-value">{segment.average_grade}%</span>
          </div>
          {segment.elevation_gain > 0 && (
            <div className="stat-item">
              <span className="stat-label">Dislivello</span>
              <span className="stat-value">{Math.round(segment.elevation_gain)} <small>m</small></span>
            </div>
          )}
        </div>
      )}
      
      {/* Visual Slope Graph Placeholder */}
      <div className="segment-graph">
         <div 
           className="graph-bar" 
           style={{ width: `${Math.min(segment.average_grade * 10, 100)}%` }}
         ></div>
      </div>
    </div>
  );
};

export default SegmentCard;
