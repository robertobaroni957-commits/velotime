import Skeleton from '../../common/Skeleton';
import EventCardSkeleton from '../events/EventCardSkeleton';
import './ProfileSkeleton.css';

const ProfileSkeleton = () => {
  return (
    <div className="profile-skeleton">
      <div className="skeleton-profile-header">
        <div className="skeleton-profile-main">
          <Skeleton width="96px" height="96px" circle />
          <div className="skeleton-profile-text">
            <Skeleton width="200px" height="28px" className="mb-2" />
            <Skeleton width="150px" height="16px" />
          </div>
        </div>
        <Skeleton width="100px" height="36px" />
      </div>

      <div className="skeleton-stats-grid">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="skeleton-stat-card">
            <Skeleton width="40px" height="40px" radius="8px" />
            <div>
              <Skeleton width="60px" height="12px" className="mb-2" />
              <Skeleton width="80px" height="18px" />
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton-recent-events">
        <Skeleton width="180px" height="24px" className="mb-6" />
        <div className="skeleton-events-grid">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
