import { useStrava } from '../../../hooks/useStrava';
import { useToast } from '../../../hooks/useToast';
import './ConnectStravaButton.css';

const ConnectStravaButton = () => {
  const { isStravaConnected, connectStrava, disconnectStrava, loading } = useStrava();
  const { showSuccess } = useToast();

  const handleToggle = async () => {
    if (isStravaConnected) {
      await disconnectStrava();
      showSuccess('Disconnected from Strava');
    } else {
      connectStrava();
    }
  };

  return (
    <button 
      onClick={handleToggle} 
      className={`strava-btn ${isStravaConnected ? 'connected' : ''}`}
      disabled={loading}
      role="button"
    >
      <div className="strava-icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"></path>
        </svg>
      </div>
      <span>{loading ? 'Processing...' : isStravaConnected ? 'Disconnect Strava' : 'Connect to Strava'}</span>
    </button>
  );
};

export default ConnectStravaButton;
