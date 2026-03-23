import { Link } from 'react-router-dom';
import { events } from '../data/events';
import EventCard from '../components/features/events/EventCard';
import FeedList from '../components/features/feed/FeedList';
import PageTransition from '../components/common/PageTransition';
import './Home.css';

const Home = () => {
  const featuredEvents = events.slice(0, 3);

  return (
    <PageTransition>
      <div className="home-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title fade-in-up">
              Track Your Performance. <span className="text-accent">Ride Faster.</span>
            </h1>
            <p className="hero-subtitle fade-in-up delay-100">
              Live results, event analytics and segment insights. Join the community of competitive cyclists and push your limits on every climb.
            </p>
            <div className="hero-actions fade-in-up delay-200">
              <Link to="/events" className="vt-btn vt-btn-primary vt-btn-skew cta-button">
                <span>View Events</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cta-icon" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link to="/register" className="vt-btn vt-btn-outline vt-btn-skew cta-button">
                <span>Get Started</span>
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-gradient-orb"></div>
          </div>
        </section>

        {/* Featured Events Section */}
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">Featured Events</h2>
            <Link to="/events" className="view-all-link">
              See all events
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </Link>
          </div>

          <div className="featured-grid">
            {featuredEvents.map(event => (
              <EventCard 
                key={event.id} 
                {...event}
              />
            ))}
          </div>
        </section>

        {/* Social Feed Section */}
        <section className="feed-section fade-in-up">
          <FeedList />
        </section>

        {/* Info Section */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-item hover-scale">
              <div className="info-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m12 14 4-4"></path>
                  <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                </svg>
              </div>
              <h3>Real-time Tracking</h3>
              <p>Monitor your position in the leaderboard as you ride through segments.</p>
            </div>
            <div className="info-item hover-scale">
              <div className="info-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v20"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3>Strava Integration</h3>
              <p>Seamlessly sync your activities and segments directly from Strava.</p>
            </div>
            <div className="info-item hover-scale">
              <div className="info-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12H3"></path>
                  <path d="M12 3v18"></path>
                  <circle cx="12" cy="12" r="9"></circle>
                </svg>
              </div>
              <h3>Advanced Analytics</h3>
              <p>Detailed power, speed and heart rate analysis for every race.</p>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Home;
