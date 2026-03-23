import Skeleton from '../../common/Skeleton';
import './EventCardSkeleton.css';

const EventCardSkeleton = () => {
  return (
    <div className="event-card-skeleton">
      <div className="skeleton-header">
        <Skeleton width="60px" height="14px" />
        <Skeleton width="80px" height="20px" radius="999px" />
      </div>
      <div className="skeleton-content">
        <Skeleton width="80%" height="24px" className="mb-4" />
        <div className="skeleton-info-rows">
          <Skeleton width="40%" height="16px" />
          <Skeleton width="50%" height="16px" />
        </div>
        <div className="skeleton-desc">
          <Skeleton width="100%" height="14px" />
          <Skeleton width="95%" height="14px" />
          <Skeleton width="70%" height="14px" />
        </div>
      </div>
      <div className="skeleton-footer">
        <Skeleton width="100%" height="36px" radius="8px" />
      </div>
    </div>
  );
};

export default EventCardSkeleton;
