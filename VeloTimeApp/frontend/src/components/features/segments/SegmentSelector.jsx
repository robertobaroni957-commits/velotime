import React, { useState } from 'react';
import SegmentCard from './SegmentCard';
import './SegmentSelector.css';

const SegmentSelector = ({ segments = [], selectedIds = [], onToggleSelection }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSegments = segments.filter(seg => 
    seg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (seg.city && seg.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="segment-selector">
      <div className="selector-header">
        <div className="search-bar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Cerca segmento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="selection-count">
          {selectedIds.length} selezionati
        </div>
      </div>

      <div className="segment-grid">
        {filteredSegments.length > 0 ? (
          filteredSegments.map(segment => (
            <SegmentCard 
              key={segment.id} 
              segment={segment} 
              isSelected={selectedIds.includes(segment.id)}
              onSelect={() => onToggleSelection(segment.id)}
            />
          ))
        ) : (
          <div className="empty-search">
            <p>Nessun segmento trovato.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentSelector;
