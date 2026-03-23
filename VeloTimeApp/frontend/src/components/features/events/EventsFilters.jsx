import { useState } from 'react';
import './EventsFilters.css';

const EventsFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minDistance: '',
    maxDistance: '',
    date: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      status: '',
      minDistance: '',
      maxDistance: '',
      date: ''
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <section className="filters-container fade-in">
      <div className="search-bar-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          type="text" 
          name="search" 
          placeholder="Search by name or description..." 
          value={filters.search} 
          onChange={handleChange}
          aria-label="Search events"
        />
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={filters.status} onChange={handleChange}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="date">Date</label>
          <input type="date" id="date" name="date" value={filters.date} onChange={handleChange} />
        </div>

        <div className="filter-group range-group">
          <label>Distance Range (km)</label>
          <div className="range-inputs">
            <input type="number" name="minDistance" placeholder="Min" value={filters.minDistance} onChange={handleChange} />
            <input type="number" name="maxDistance" placeholder="Max" value={filters.maxDistance} onChange={handleChange} />
          </div>
        </div>
      </div>

      <button className="clear-filters-btn" onClick={clearFilters}>
        Clear Filters
      </button>
    </section>
  );
};

export default EventsFilters;
