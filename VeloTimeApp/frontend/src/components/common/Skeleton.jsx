import './Skeleton.css';

const Skeleton = ({ width, height, radius, circle, className = '' }) => {
  const style = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: circle ? '50%' : (radius || '6px')
  };

  return <div className={`skeleton-base ${className}`} style={style} aria-hidden="true" />;
};

export default Skeleton;
