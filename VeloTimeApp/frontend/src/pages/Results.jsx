import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ResultsTable from '../components/features/results/ResultsTable';
import PageTransition from '../components/common/PageTransition';
import './Results.css';

const Results = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch results joined with profiles
        const { data: resultsData, error: resultsError } = await supabase
          .from('event_results')
          .select(`
            rank,
            total_time,
            average_speed,
            user_id,
            profiles:user_id (full_name, avatar_url)
          `)
          .eq('event_id', id)
          .order('rank', { ascending: true });

        if (resultsError) throw resultsError;
        setResults(resultsData || []);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="results-loading">
          <div className="loader"></div>
          <p>Loading leaderboard...</p>
        </div>
      </PageTransition>
    );
  }

  if (!event) {
    return (
      <PageTransition>
        <div className="results-error">
          <h1>Event not found</h1>
          <Link to="/events" className="back-link">← Back to Events</Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="results-container">
        <div className="results-wrapper">
          <header className="results-header">
            <Link to={`/events/${id}`} className="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="back-icon" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Event Details
            </Link>

            <div className="event-info-banner fade-in">
              <div className="info-main">
                <h1 className="results-title">Leaderboard: {event.name}</h1>
                <div className="results-meta">
                  <div className="meta-pill">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pill-icon" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                      <line x1="16" x2="16" y1="2" y2="6"></line>
                      <line x1="8" x2="8" y1="2" y2="6"></line>
                    </svg>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="segment-info">
                <span className="label">Distance</span>
                <span className="value">{(event.distance / 1000).toFixed(1)} km</span>
              </div>
            </div>
          </header>

          <main className="results-main">
            <div className="section-header">
              <h2 className="section-title">General Classification</h2>
              <div className="status-badge">
                <span className="status-dot"></span>
                Official
              </div>
            </div>
            <ResultsTable results={results} />
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default Results;
