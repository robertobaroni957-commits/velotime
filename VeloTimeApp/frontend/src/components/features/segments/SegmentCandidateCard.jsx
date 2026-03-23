import React from 'react';
import './SegmentCandidateCard.css';

const SegmentCandidateCard = ({ segment, isSelected, onToggle }) => {
  const getCategory = (cat) => {
    if (cat === 5) return 'HC';
    return cat > 0 ? `Cat ${cat}` : 'Pianura';
  };

  const getCategoryClass = (cat) => {
    if (cat === 5) return 'hc';
    return cat > 0 ? `cat-${cat}` : 'flat';
  };

  return (
    <div className={`candidate-card ${isSelected ? 'selected' : ''}`} onClick={onToggle}>
      <div className="candidate-checkbox">
        <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
          {isSelected && <span className="check-mark">✓</span>}
        </div>
      </div>
      <div className="candidate-info">
        <div className="candidate-name-row">
            <span className="candidate-name">{segment.name}</span>
            <span className={`candidate-cat ${getCategoryClass(segment.climb_category)}`}>
                {getCategory(segment.climb_category)}
            </span>
        </div>
        <div className="candidate-stats">
            <span>{(segment.distance / 1000).toFixed(1)} km</span>
            <span>{segment.average_grade}% pendenza avg</span>
        </div>
      </div>
    </div>
  );
};

export default SegmentCandidateCard;
