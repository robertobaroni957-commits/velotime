import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStrava } from '../hooks/useStrava';
import { supabase } from '../lib/supabase';
import PageTransition from '../components/common/PageTransition';
import ConnectStravaButton from '../components/features/strava/ConnectStravaButton';
import ActivitiesList from '../components/features/strava/ActivitiesList';
import './Profile.css';

const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isStravaConnected, refreshStatus, loading: stravaLoading } = useStrava();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-user-profile');
      if (error) throw error;
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="profile-error-container">
          <div className="error-card scale-in">
            <h1>Access Restricted</h1>
            <p>You must be logged in to view your performance stats.</p>
            <Link to="/login" className="login-redirect-btn hover-glow">Go to Login</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div className="profile-container">
        <div className="profile-wrapper">
          {/* Hero Section */}
          <header className="profile-header fade-in">
            <div className="profile-info-main">
              <div className="avatar-placeholder scale-in">
                {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <h1>{user.user_metadata?.full_name || 'Rider'}</h1>
                <p className="user-email">{user.email}</p>
                <div className="user-badges-mini">
                  {profileData?.badges?.map((badge, i) => (
                    <span key={i} className="mini-badge" title={badge.label}>{badge.icon}</span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn hover-scale">
              Logout
            </button>
          </header>

          {loading ? (
            <div className="profile-loading-state">
              <div className="loader"></div>
              <p>Aggregating your stats...</p>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <section className="stats-bar-section fade-in-up">
                <div className="stats-bar-grid">
                  <div className="bar-stat">
                    <span className="stat-value">{profileData?.stats?.total_wins || 0}</span>
                    <span className="stat-label">Wins</span>
                  </div>
                  <div className="bar-stat">
                    <span className="stat-value">{profileData?.stats?.total_events || 0}</span>
                    <span className="stat-label">Events</span>
                  </div>
                  <div className="bar-stat">
                    <span className="stat-value">{((profileData?.stats?.total_distance || 0) / 1000).toFixed(0)}km</span>
                    <span className="stat-label">Distance</span>
                  </div>
                  <div className="bar-stat">
                    <span className="stat-value">{Math.round(profileData?.stats?.total_elevation || 0)}m</span>
                    <span className="stat-label">Climbing</span>
                  </div>
                </div>
              </section>

              {/* Recent Activity Table */}
              <section className="activity-section fade-in delay-200">
                <h2 className="section-title">Recent Results</h2>
                <div className="activity-list-container">
                  {profileData?.recentActivity?.length > 0 ? (
                    <table className="profile-activity-table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Rank</th>
                          <th>Time</th>
                          <th>Speed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileData.recentActivity.map((res, i) => (
                          <tr key={i}>
                            <td>
                              <Link to={`/events/${res.events.id}`} className="event-link">
                                {res.events.name}
                              </Link>
                            </td>
                            <td><span className={`rank-tag r-${res.rank}`}>{res.rank}</span></td>
                            <td>{formatTime(res.total_time)}</td>
                            <td>{res.average_speed?.toFixed(1)} km/h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-activity">
                      <p>No race results yet. Join an event to start competing!</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Strava Section */}
          <section className="strava-integration-section fade-in delay-300">
            <div className="section-card">
              <div className="strava-info">
                <h2 className="section-title">Strava Sync</h2>
                <p className="section-desc">Manage your connection and import new activities.</p>
              </div>
              <div className="strava-actions">
                <ConnectStravaButton />
                {isStravaConnected && (
                  <button 
                    onClick={refreshStatus} 
                    className="import-btn hover-glow"
                    disabled={stravaLoading}
                  >
                    {stravaLoading ? 'Syncing...' : 'Sync Activities'}
                  </button>
                )}
              </div>
            </div>
            
            {isStravaConnected && (
              <div className="imported-activities">
                <h3 className="sub-section-title">Recent Rides</h3>
                <ActivitiesList />
              </div>
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Profile;
