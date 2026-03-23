import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import EventCard from '../components/features/events/EventCard';
import EventCardSkeleton from '../components/features/events/EventCardSkeleton';
import EventsFilters from '../components/features/events/EventsFilters';
import PageTransition from '../components/common/PageTransition';
import './Events.css';

const Events = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        
        setAllEvents(data || []);
        setFilteredEvents(data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleFilterChange = (filters) => {
    let result = [...allEvents];

    // Search filter (by name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter(event => event.status === filters.status);
    }

    // Distance filter (assuming distance is in meters)
    if (filters.minDistance) {
      result = result.filter(event => (event.distance / 1000) >= parseFloat(filters.minDistance));
    }
    if (filters.maxDistance) {
      result = result.filter(event => (event.distance / 1000) <= parseFloat(filters.maxDistance));
    }

    setFilteredEvents(result);
  };

  return (
    <PageTransition>
      <div className="events-container">
        <div className="events-content-wrapper">
          <header className="events-header fade-in">
            <h1 className="events-main-title">Community Challenges</h1>
            <p className="events-subtitle">Browse and join segments created by other VeloTime riders</p>
          </header>

          <EventsFilters onFilterChange={handleFilterChange} />

          {loading ? (
            <div className="events-grid">
              {Array(6).fill(0).map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map(event => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          ) : (
            <div className="no-events-found fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="no-events-icon"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <h3>No events found</h3>
              <p>Try adjusting your filters or create the first challenge for this route!</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Events;
