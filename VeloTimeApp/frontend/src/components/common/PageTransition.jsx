import { usePageTransition } from '../../hooks/usePageTransition';
import './PageTransition.css';

const PageTransition = ({ children }) => {
  const transitionClass = usePageTransition();

  return (
    <div className={`page-transition-wrapper ${transitionClass}`}>
      {children}
    </div>
  );
};

export default PageTransition;
