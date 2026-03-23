import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <div className="footer-logo-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-logo-icon">
              <line x1="10" x2="14" y1="2" y2="2"></line>
              <line x1="12" x2="15" y1="14" y2="11"></line>
              <circle cx="12" cy="14" r="8"></circle>
            </svg>
          </div>
          <span className="footer-logo-text">VELOTIME</span>
        </div>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} VeloTime. Built for the Strava community.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
