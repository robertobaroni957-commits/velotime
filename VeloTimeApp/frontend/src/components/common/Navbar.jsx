import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const isActive = (path) => location.pathname === path;

  // Chiudi il menu quando si cambia rotta
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <div className="navbar-logo-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="navbar-logo-icon">
              <line x1="10" x2="14" y1="2" y2="2"></line>
              <line x1="12" x2="15" y1="14" y2="11"></line>
              <circle cx="12" cy="14" r="8"></circle>
            </svg>
          </div>
          <span className="navbar-logo-text">VELOTIME</span>
        </Link>

        <button className="mobile-menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? <line x1="18" y1="6" x2="6" y2="18"></line> : <line x1="3" y1="12" x2="21" y2="12"></line>}
            {isOpen ? <line x1="6" y1="6" x2="18" y2="18"></line> : <line x1="3" y1="6" x2="21" y2="6"></line>}
            {!isOpen && <line x1="3" y1="18" x2="21" y2="18"></line>}
          </svg>
        </button>

        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <Link to="/create-event" className={`nav-link ${isActive('/create-event') ? 'active' : ''}`}>
              Create Event
            </Link>
          )}
          <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
            Events
          </Link>
          <Link to="/hall-of-fame" className={`nav-link ${isActive('/hall-of-fame') ? 'active' : ''}`}>
            Hall of Fame
          </Link>
          <div className="navbar-divider"></div>
          
          {isAuthenticated ? (
            <div className="nav-user-info">
              <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                Hi, {(user.user_metadata?.full_name || user.email || 'Rider').split(' ')[0]}
              </Link>
              <button onClick={logout} className="vt-btn vt-btn-outline vt-btn-skew" style={{padding: '0.4rem 1rem'}}>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="vt-btn vt-btn-outline vt-btn-skew" style={{padding: '0.4rem 1.2rem'}}>
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="vt-btn vt-btn-primary vt-btn-skew" style={{padding: '0.4rem 1.2rem'}}>
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
