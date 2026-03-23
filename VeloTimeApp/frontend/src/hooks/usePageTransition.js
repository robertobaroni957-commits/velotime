import { useState, useEffect } from 'react';

export const usePageTransition = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  return isVisible ? 'page-enter-active' : 'page-enter';
};
