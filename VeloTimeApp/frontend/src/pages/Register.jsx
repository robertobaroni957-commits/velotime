import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageTransition from '../components/common/PageTransition';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <PageTransition>
      <div className="register-container">
        <div className="register-card-wrapper">
          <div className="register-header">
            <Link to="/" className="register-logo-link">
              <div className="register-logo-box">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="register-logo-icon"
                  aria-hidden="true"
                >
                  <line x1="10" x2="14" y1="2" y2="2"></line>
                  <line x1="12" x2="15" y1="14" y2="11"></line>
                  <circle cx="12" cy="14" r="8"></circle>
                </svg>
              </div>
              <span className="register-logo-text">VELOTIME</span>
            </Link>
            <p className="register-subtitle">Create your account</p>
          </div>

          <div className="register-card">
            <form className="register-form" onSubmit={handleSubmit}>
              {error && <div className="form-error" role="alert">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    id="name" 
                    type="text" 
                    placeholder="John Doe" 
                    className="form-input" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <div className="input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  </svg>
                  <input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    className="form-input" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="form-input" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="input-icon"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className="form-input" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="register-submit-btn">Create Account</button>
            </form>

            <div className="register-footer">
              <span className="footer-text">Already have an account? </span>
              <Link to="/login" className="login-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
