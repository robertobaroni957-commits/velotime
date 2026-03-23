import Skeleton from '../../common/Skeleton';
import './ResultsSkeleton.css';

const ResultsSkeleton = () => {
  const rows = Array(6).fill(0);

  return (
    <div className="results-skeleton">
      <div className="skeleton-table-header">
        <Skeleton width="10%" height="16px" />
        <Skeleton width="40%" height="16px" />
        <Skeleton width="15%" height="16px" />
        <Skeleton width="15%" height="16px" />
        <Skeleton width="15%" height="16px" />
      </div>
      <div className="skeleton-table-body">
        {rows.map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <Skeleton width="24px" height="24px" circle />
            <Skeleton width="35%" height="16px" />
            <Skeleton width="12%" height="16px" />
            <Skeleton width="12%" height="16px" />
            <Skeleton width="12%" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsSkeleton;
